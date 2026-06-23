import type { GeoJSON } from 'geojson';
import { geoAngle, geoExtent, geoVecAdd, geoVecLength, geoVecNormalize, geoVecSubtract } from '../geo';
import { utilArrayUniqBy } from '../util';
import { osmShouldRenderDirection } from './tags';
import { OsmAbstractEntity, type OsmEntityProps } from './abstract-entity';
import type { ChangesetId, NodeId } from './id_manager';
import type { Vec2 } from '../geo/vector';
import type { coreGraph } from '../core/graph';
import { debug } from '..';
import type { Projection } from '../geo/raw_mercator';

export const cardinal: Record<string, number> = {
    north: 0,               n: 0,
    northnortheast: 22,     nne: 22,
    northeast: 45,          ne: 45,
    eastnortheast: 67,      ene: 67,
    east: 90,               e: 90,
    eastsoutheast: 112,     ese: 112,
    southeast: 135,         se: 135,
    southsoutheast: 157,    sse: 157,
    south: 180,             s: 180,
    southsouthwest: 202,    ssw: 202,
    southwest: 225,         sw: 225,
    westsouthwest: 247,     wsw: 247,
    west: 270,              w: 270,
    westnorthwest: 292,     wnw: 292,
    northwest: 315,         nw: 315,
    northnorthwest: 337,    nnw: 337
};

export const SIDE_TAGS = [
    'side',
    'railway:signal:position',
    // railway:turnout_side has special handling, since it's not relative to the way direction
];

export const SIDES = new Set(['left', 'right', 'both']);

export const SIDE_ANGLE_OFFSET: Record<string, number> = { left: 180, right: 0 };

export class osmNode extends OsmAbstractEntity {
    declare readonly type: 'node';
    declare readonly id: NodeId;
    declare readonly loc: Vec2;

    constructor(...args: Partial<OsmEntityProps & Pick<osmNode, 'loc'>>[]) {
        super({ type: 'node', loc: [9999, 9999] }, ...args);
        if (debug) Object.freeze(this.loc);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentional, to make the method signature compatible with way/relation
    extent(resolver?: coreGraph) {
        return new geoExtent(this.loc);
    }

    geometry(graph: coreGraph) {
        return graph.transient(this, 'geometry', () => {
            return graph.isPoi(this) ? 'point' : 'vertex';
        });
    }

    copy(resolver: coreGraph, copies: { [id: NodeId]: any }) {
        if (copies[this.id]) return copies[this.id];

        var copy = new osmNode(this, {
            id: undefined,
            user: undefined,
            version: undefined,
        });
        copies[this.id] = copy;

        return copy;
    }

    move(loc: Vec2) {
        return this.update({loc: loc});
    }

    isDegenerate() {
        return !(
            Array.isArray(this.loc) && this.loc.length === 2 &&
            this.loc[0] >= -180 && this.loc[0] <= 180 &&
            this.loc[1] >= -90 && this.loc[1] <= 90
        );
    }

    // Inspect tags and geometry to determine which direction(s) this node/vertex points
    directions(resolver: coreGraph, projection: Projection) {
        const rawValues: { type: 'side' | 'turnout_side' | 'direction'; value: string | number }[] = [];

        // which tag to use?
        if (this.isHighwayIntersection(resolver) && (this.tags.stop || '').toLowerCase() === 'all') {
            // all-way stop tag on a highway intersection
            rawValues.push({
                type: 'direction',
                value: 'all',
            });
        } else if (this.tags['railway:turnout_side'] && resolver.parentWays(this).length > 1) {
            rawValues.push({
                type: 'turnout_side',
                value: this.tags['railway:turnout_side'].toLowerCase(),
            });
        } else {
            // generic side tag

            // for `highway=cyclist_waiting_aid`, `side` (i.e. from cyclist's perspective) will be ambiguous
            // unless the `direction` is explicitly specified (even on one-way roads).
            const isSideTagAmbiguous = (
                this.tags.highway === 'cyclist_waiting_aid' &&
                this.tags.side !== 'both' &&
                this.tags.direction !== 'forward' &&
                this.tags.direction !== 'backward'
            );

            const sideTag = SIDE_TAGS.map(key => this.tags[key]).find(Boolean);
            if (sideTag && SIDES.has(sideTag.toLowerCase()) && !isSideTagAmbiguous) {
                rawValues.push({
                    type: 'side',
                    value: sideTag?.toLowerCase(),
                });
            }

            // generic direction tag
            let val = (this.tags.direction || '').toLowerCase();

            // better suffix-style direction tag
            const re = /:direction$/i;
            for (const key of Object.keys(this.tags)) {
                if (re.test(key)) {
                    val = this.tags[key].toLowerCase();
                    break;
                }
            }
            for (const value of val.split(';')) {
                rawValues.push({ type: 'direction', value });
            }
        }

        if (!rawValues.length) return [];


        const results: { type: 'side' | 'direction'; angle: number }[] = [];

        const neighborNodeReducer = (neighbor: osmNode, { lookBackward = true, lookForward = true } = {}) => function(collection: { [nodeId: NodeId]: boolean }, { nodes }: { nodes: NodeId[] }) {
            nodes.forEach((_, i) => {
                if (nodes[i] !== neighbor.id) return;  // not a match of current entity

                if (lookForward && i > 0) {
                    collection[nodes[i - 1]] = true;  // look back to prev node
                }
                if (lookBackward && i < nodes.length - 1) {
                    collection[nodes[i + 1]] = true;  // look ahead to next node
                }
            });
            return collection;
        };

        rawValues.forEach(({ type, value: v }) => {
            // swap cardinal for numeric directions
            if (cardinal[v] !== undefined) {
                v = cardinal[v];
            }

            // numeric direction - just add to results
            if (v !== '' && !isNaN(+v)) {
                results.push({ type: 'direction', angle: +v });
                return;
            }

            if (type === 'turnout_side') {
                if (SIDE_ANGLE_OFFSET[v] === undefined) return;

                const branchVectors: Record<string, Vec2> = {};
                const ids = Object.keys(resolver.parentWays(this)
                    .filter(way => way.tags.railway && way.geometry(resolver) === 'line')
                    .reduce(neighborNodeReducer(this), {})
                );

                // the turnout side tag is only meaningfully defined for switches with 3 branches - one incoming and two outgoing
                if (ids.length !== 3) return;

                ids.forEach(id => branchVectors[id] = geoVecNormalize(geoVecSubtract(projection(resolver.entity(id).loc), projection(this.loc))));

                const sortedIds = ids.map(id => {
                    const otherVectorSum = ids
                        .filter(n => n !== id)
                        .map(n => branchVectors[n])
                        .reduce(geoVecAdd, [0, 0]);
                    return { id, alignment: geoVecLength(otherVectorSum) };
                }).sort((a, b) => b.alignment - a.alignment);

                // don't attempt to interpret the turnout side if the angles of the branches are too similar
                const MIN_ALIGNMENT_RATIO = 2;
                if (sortedIds[0].alignment < MIN_ALIGNMENT_RATIO * sortedIds[1].alignment || !sortedIds[0].id) return;

                results.push({
                    type: 'side',
                    angle: (geoAngle(this, resolver.entity(sortedIds[0].id), projection) * (180 / Math.PI)) + SIDE_ANGLE_OFFSET[v]
                });
            } else {

                const isSide = type === 'side' && SIDES.has(v as string);

                // In case of `highway=cyclist_waiting_aid`, if the `side` is to be shown, then
                // it will be explicitly specified by the `direction` from the cyclist's perspective (not way's perspective)
                const isSideFlipped = isSide &&
                    this.tags.highway === 'cyclist_waiting_aid' &&
                    this.tags.direction === 'backward';

                // string direction - inspect parent ways
                const lookBackward =
                    (!!this.tags['traffic_sign:backward'] || v === (isSide ? 'left' : 'backward') || v === 'both' || v === 'all');
                const lookForward =
                    (!!this.tags['traffic_sign:forward'] || v === (isSide ? 'right' : 'forward') || v === 'both' || v === 'all');

                if (!lookForward && !lookBackward) return;

                const nodeIds = resolver.parentWays(this)
                    .filter(way => osmShouldRenderDirection(this.tags, way.tags))
                    .reduce(neighborNodeReducer(this, { lookForward, lookBackward }), {});

                Object.keys(nodeIds).forEach((nodeId) => {
                    // +90 because geoAngle returns angle from X axis, not Y (north)
                    results.push({
                        type: isSide ? 'side' : 'direction',
                        angle: (geoAngle(this, resolver.entity(nodeId), projection) * (180 / Math.PI)) + (isSide ? (isSideFlipped ? 180 : 0) : 90)
                    });
                }, this);
            }
        }, this);

        return utilArrayUniqBy(results, item => item.type + item.angle);
    }

    isCrossing() {
        return this.tags.highway === 'crossing' ||
               this.tags.railway && this.tags.railway.indexOf('crossing') !== -1;
    }

    isEndpoint(resolver: coreGraph) {
        return resolver.transient(this, 'isEndpoint', () => {
            var id = this.id;
            return resolver.parentWays(this).filter(function(parent) {
                return !parent.isClosed() && !!parent.affix(id);
            }).length > 0;
        });
    }

    isConnected(resolver: coreGraph) {
        return resolver.transient(this, 'isConnected', () => {
            var parents = resolver.parentWays(this);

            if (parents.length > 1) {
                // vertex is connected to multiple parent ways
                for (var i in parents) {
                    if (parents[i].geometry(resolver) === 'line' &&
                        parents[i].hasInterestingTags()) return true;
                }
            } else if (parents.length === 1) {
                var way = parents[0];
                var nodes = way.nodes.slice();
                if (way.isClosed()) { nodes.pop(); }  // ignore connecting node if closed

                // return true if vertex appears multiple times (way is self intersecting)
                return nodes.indexOf(this.id) !== nodes.lastIndexOf(this.id);
            }

            return false;
        });
    }

    parentIntersectionWays(resolver: coreGraph) {
        return resolver.transient(this, 'parentIntersectionWays', () => {
            return resolver.parentWays(this).filter(function(parent) {
                return (parent.tags.highway ||
                    parent.tags.waterway ||
                    parent.tags.railway ||
                    parent.tags.aeroway) &&
                    parent.geometry(resolver) === 'line';
            });
        });
    }

    isIntersection(resolver: coreGraph) {
        return this.parentIntersectionWays(resolver).length > 1;
    }

    isHighwayIntersection(resolver: coreGraph) {
        return resolver.transient(this, 'isHighwayIntersection', () => {
            return resolver.parentWays(this).filter(function(parent) {
                return parent.tags.highway && parent.geometry(resolver) === 'line';
            }).length > 1;
        });
    }

    isOnAddressLine(resolver: coreGraph) {
        return resolver.transient(this, 'isOnAddressLine', () => {
            return resolver.parentWays(this).filter(function(parent) {
                return parent.tags.hasOwnProperty('addr:interpolation') &&
                    parent.geometry(resolver) === 'line';
            }).length > 0;
        });
    }


    asJXON(changeset_id: ChangesetId) {
        var r: any = {
            node: {
                '@id': this.osmId(),
                '@lon': this.loc[0],
                '@lat': this.loc[1],
                '@version': (this.version || 0),
                tag: Object.keys(this.tags).map((k) => {
                    return { keyAttributes: { k: k, v: this.tags[k] } };
                }, this)
            }
        };
        if (changeset_id) r.node['@changeset'] = changeset_id;
        return r;
    }

    asGeoJSON(): GeoJSON {
        return {
            type: 'Point',
            coordinates: this.loc
        };
    }
}
