import {
    geoIdentity as d3_geoIdentity,
    geoPath as d3_geoPath,
    geoStream as d3_geoStream
} from 'd3-geo';

import { geoVecAdd, geoVecAngle, geoVecLength } from '../geo';
import type { EntityId, NodeId, OsmEntity, osmNode, osmWay, WayId } from '../osm';
import type { coreGraph } from '../core';
import type { ClipExtent, Projection } from '../geo/raw_mercator';
import type { Vec2 } from '../geo/vector';
import type { Feature, LineString } from 'geojson';
import type { WithLoc } from './geolocate';


// Touch targets control which other vertices we can drag a vertex onto.
//
// - the activeID - nope
// - 1 away (adjacent) to the activeID - yes (vertices will be merged)
// - 2 away from the activeID - nope (would create a self intersecting segment)
// - all others on a linear way - yes
// - all others on a closed way - nope (would create a self intersecting polygon)
//
// returns
// 0 = active vertex - no touch/connect
// 1 = passive vertex - yes touch/connect
// 2 = adjacent vertex - yes but pay attention segmenting a line here
//
export function svgPassiveVertex(node: osmNode, graph: coreGraph, activeID: NodeId) {
    if (!activeID) return 1;
    if (activeID === node.id) return 0;

    var parents = graph.parentWays(node);

    var i, j, nodes, isClosed, ix1, ix2, ix3, ix4, max;

    for (i = 0; i < parents.length; i++) {
        nodes = parents[i].nodes;
        isClosed = parents[i].isClosed();
        for (j = 0; j < nodes.length; j++) {   // find this vertex, look nearby
            if (nodes[j] === node.id) {
                ix1 = j - 2;
                ix2 = j - 1;
                ix3 = j + 1;
                ix4 = j + 2;

                if (isClosed) {  // wraparound if needed
                    max = nodes.length - 1;
                    if (ix1 < 0)   ix1 = max + ix1;
                    if (ix2 < 0)   ix2 = max + ix2;
                    if (ix3 > max) ix3 = ix3 - max;
                    if (ix4 > max) ix4 = ix4 - max;
                }

                if (nodes[ix1] === activeID) return 0;        // no - prevent self intersect
                else if (nodes[ix2] === activeID) return 2;   // ok - adjacent
                else if (nodes[ix3] === activeID) return 2;   // ok - adjacent
                else if (nodes[ix4] === activeID) return 0;   // no - prevent self intersect
                else if (isClosed && nodes.indexOf(activeID) !== -1) return 0;  // no - prevent self intersect
            }
        }
    }

    return 1;   // ok
}

export interface MarkerSegment {
    id: WayId;
    index: number;
    d: string;
}

/**
 * @param {Number} dt spacing between segments
 */
export function svgMarkerSegments(
    projection: Projection,
    graph: coreGraph,
    dt: number,
    shouldReverse: (entity: osmWay) => boolean = () => false,
    bothDirections: (entity: osmWay) => boolean = () => false
) {
    /**
     * @returns list of svg path segments corres
     */
    return function(entity: osmWay): MarkerSegment[] {
        let i = 0;
        let offset = dt / 2;
        const segments: MarkerSegment[] = [];

        const clip = paddedClipExtent(projection);

        const coordinates = graph.childNodes(entity).map(function(n) { return n.loc; });
        let a: Vec2 | null;
        let b: Vec2;

        const _shouldReverse = shouldReverse(entity);
        const _bothDirections = bothDirections(entity);

        d3_geoStream({
            type: 'LineString',
            coordinates: coordinates
        }, projection.stream(clip({
            polygonStart() {},
            polygonEnd() {},
            lineStart: function() {},
            lineEnd: function() { a = null; },
            point: function(x, y) {
                b = [x, y];

                if (a) {
                    let span = geoVecLength(a, b) - offset;

                    if (span >= 0) {
                        const heading = geoVecAngle(a, b);
                        const dx = dt * Math.cos(heading);
                        const dy = dt * Math.sin(heading);
                        let p: Vec2 = [
                            a[0] + offset * Math.cos(heading),
                            a[1] + offset * Math.sin(heading)
                        ];

                        // gather coordinates
                        const coord = [a, p];
                        for (span -= dt; span >= 0; span -= dt) {
                            p = geoVecAdd(p, [dx, dy]);
                            coord.push(p);
                        }
                        coord.push(b);

                        // generate svg paths
                        let segment = '';

                        if (!_shouldReverse || _bothDirections) {
                            for (let j = 0; j < coord.length; j++) {
                                segment += (j === 0 ? 'M' : 'L') + coord[j][0] + ',' + coord[j][1];
                            }
                            segments.push({ id: entity.id, index: i++, d: segment });
                        }

                        if (_shouldReverse || _bothDirections) {
                            segment = '';
                            for (let j = coord.length - 1; j >= 0; j--) {
                                segment += (j === coord.length - 1 ? 'M' : 'L') + coord[j][0] + ',' + coord[j][1];
                            }
                            segments.push({ id: entity.id, index: i++, d: segment });
                        }
                    }

                    offset = -span;
                }

                a = b;
            }
        })));

        return segments;
    };
}


export function svgPath(projection: Projection, graph?: coreGraph, isArea?: boolean) {
    const cache: Record<EntityId, string | null> = {};
    const project = projection.stream;
    const clip = paddedClipExtent(projection, isArea);
    const path = d3_geoPath()
        .projection({stream: function(output) { return project(clip(output)); }});

    const svgpath = function(entity: osmWay) {
        if (entity.id in cache) {
            return cache[entity.id];
        } else {
            return cache[entity.id] = path(entity.asGeoJSON(graph!));
        }
    };

    svgpath.geojson = function(d: any) {
        if (d.__featurehash__ !== undefined) {
            if (d.__featurehash__ in cache) {
                return cache[d.__featurehash__];
            } else {
                return cache[d.__featurehash__] = path(d);
            }
        } else {
            return path(d);
        }
    };

    return svgpath;
}


export function svgPointTransform(projection: Projection) {
    const svgpoint = function(entity: WithLoc) {
        var pt = projection(entity.loc);
        return 'translate(' + pt[0] + ',' + pt[1] + ')';
    };

    svgpoint.geojson = function(d: Feature) {
        return svgpoint(d.properties!.entity);
    };

    return svgpoint;
}


export function svgRelationMemberTags(graph: coreGraph) {
    return function(entity: OsmEntity) {
        var tags = entity.tags;
        var shouldCopyMultipolygonTags = !entity.hasInterestingTags();
        graph.parentRelations(entity).forEach(function(relation) {
            var type = relation.tags.type;
            if ((type === 'multipolygon' && shouldCopyMultipolygonTags) || type === 'boundary') {
                tags = Object.assign({}, relation.tags, tags);
            }
        });
        return tags;
    };
}

export type SegmentFeature = Feature<LineString, {
    nope?: true;
    target: true;
    entity: osmWay;
    nodes: [start: osmNode, end: osmNode];
    index: number;
}>;

export function svgSegmentWay(way: osmWay, graph: coreGraph, activeID: NodeId): {
    passive: SegmentFeature[];
    active: SegmentFeature[];
} {
    // When there is no activeID, we can memoize this expensive computation
    if (activeID === undefined) {
        return graph.transient(way, 'waySegments', getWaySegments);
    } else {
        return getWaySegments();
    }

    function getWaySegments() {
        const isActiveWay = (way.nodes.indexOf(activeID) !== -1);
        const features: { passive: SegmentFeature[]; active: SegmentFeature[]; } = { passive: [], active: [] };

        interface Start { node: osmNode; type: number; }
        let start: Start | { type?: undefined } = {};

        for (var i = 0; i < way.nodes.length; i++) {
            const node = graph.entity(way.nodes[i]);
            const type = svgPassiveVertex(node, graph, activeID);
            const end = { node: node, type: type };

            if (start.type !== undefined) {
                if (start.node.id === activeID || end.node.id === activeID) {
                    // push nothing
                } else if (isActiveWay && (start.type === 2 || end.type === 2)) {   // one adjacent vertex
                    pushActive(start, end, i);
                } else if (start.type === 0 && end.type === 0) {   // both active vertices
                    pushActive(start, end, i);
                } else {
                    pushPassive(start, end, i);
                }
            }

            start = end;
        }

        return features;

        function pushActive(start: Start, end: Start, index: number) {
            features.active.push({
                type: 'Feature',
                id: way.id + '-' + index + '-nope',
                properties: {
                    nope: true,
                    target: true,
                    entity: way,
                    nodes: [start.node, end.node],
                    index: index
                },
                geometry: {
                    type: 'LineString',
                    coordinates: [start.node.loc, end.node.loc]
                }
            });
        }

        function pushPassive(start: Start, end: Start, index: number) {
            features.passive.push({
                type: 'Feature',
                id: way.id + '-' + index,
                properties: {
                    target: true,
                    entity: way,
                    nodes: [start.node, end.node],
                    index: index
                },
                geometry: {
                    type: 'LineString',
                    coordinates: [start.node.loc, end.node.loc]
                }
            });
        }
    }
}


/**
 * Returns a d3 projection stream that clips the given geometries to an
 * extent that is slightly padded.
 *
 * Explanation of magic numbers:
 * "padding" here allows space for strokes to extend beyond the viewport,
 * so that the stroke isn't drawn along the edge of the viewport when
 * the shape is clipped.
 * When drawing lines, pad viewport by 5px.
 * When drawing areas, pad viewport by 65px in each direction to allow
 * for 60px area fill stroke (see ".fill-partial path.fill" css rule)
 */
function paddedClipExtent(projection: Projection, isArea = false) {
    var padding = isArea ? 65 : 5;
    var viewport = projection.clipExtent();
    var paddedExtent: ClipExtent = [
        [viewport[0][0] - padding, viewport[0][1] - padding],
        [viewport[1][0] + padding, viewport[1][1] + padding]
    ];
    return d3_geoIdentity().clipExtent(paddedExtent).stream;
}
