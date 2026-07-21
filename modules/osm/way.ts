import { geoArea as d3_geoArea } from 'd3-geo';
import type { LineString, Polygon } from 'geojson';

import { geoExtent, geoVecCross } from '../geo';
import { osmLanes } from './lanes';
import { osmTagSuggestingArea, osmSidednessTags, osmRemoveLifecyclePrefix, osmOneWayBiDirectionalTags, osmOneWayBackwardTags, osmOneWayForwardTags, osmOneWayTags } from './tags';
import { utilArrayUniq, utilCheckTagDictionary } from '../util';
import { OsmAbstractEntity, type OsmEntityProps } from './abstract-entity';
import type { TagDictionary } from '../util/object';
import type { coreGraph } from '../core/graph';
import type { osmNode } from './node';
import { osmIdManager, type ChangesetId, type NodeId, type WayId } from './id_manager';
import { debug } from '..';

export type SegmentId = `${WayId}-${number}`;

export interface Segment {
    id: SegmentId;
    wayId: WayId;
    index: number;
    nodes: NodeId[];
    extent(graph: coreGraph): geoExtent | undefined;
}

export class osmWay extends OsmAbstractEntity {
  declare readonly type: 'way';
  declare readonly id: WayId;
  declare readonly nodes: NodeId[];

    constructor(...args: Partial<OsmEntityProps & Pick<osmWay, 'nodes'>>[]) {
        super({ type: 'way', nodes: [] }, ...args);
        if (debug) Object.freeze(this.nodes);
    }

    copy(resolver: coreGraph, copies: { [id: WayId]: any }) {
        if (copies[this.id]) return copies[this.id];

        var copy = new osmWay(this, {
            id: undefined,
            user: undefined,
            version: undefined,
        });

        var nodes = this.nodes.map(function(id) {
            return resolver.entity(id).copy(resolver, copies).id;
        });

        copy = copy.update({ nodes: nodes });
        copies[this.id] = copy;

        return copy;
    }

    extent(resolver: coreGraph): geoExtent {
        return resolver.transient(this, 'extent', () => {
            var extent = geoExtent();
            for (var i = 0; i < this.nodes.length; i++) {
                var node = resolver.hasEntity(this.nodes[i]);
                if (node) {
                    extent._extend(node.extent(resolver));
                }
            }
            return extent;
        });
    }

    first() {
        return this.nodes[0];
    }

    last() {
        return this.nodes[this.nodes.length - 1];
    }

    contains(node: NodeId) {
        return this.nodes.indexOf(node) >= 0;
    }

    affix(node: NodeId) {
        if (this.nodes[0] === node) return 'prefix';
        if (this.nodes[this.nodes.length - 1] === node) return 'suffix';
    }

    layer() {
        // explicit layer tag, clamp between -10, 10..
        if (isFinite(+this.tags.layer)) {
            return Math.max(-10, Math.min(+this.tags.layer, 10));
        }

        // implied layer tag..
        if (this.tags.covered === 'yes') return -1;
        if (this.tags.location === 'overground') return 1;
        if (this.tags.location === 'underground') return -1;
        if (this.tags.location === 'underwater') return -10;

        if (this.tags.power === 'line') return 10;
        if (this.tags.power === 'minor_line') return 10;
        if (this.tags.aerialway) return 10;
        if (this.tags.bridge) return 1;
        if (this.tags.cutting) return -1;
        if (this.tags.tunnel) return -1;
        if (this.tags.waterway) return -1;
        if (this.tags.man_made === 'pipeline') return -10;
        if (this.tags.boundary) return -10;
        return 0;
    }

    // the approximate width of the line based on its tags except its `width` tag
    impliedLineWidthMeters() {
        var averageWidths: TagDictionary<number> = {
            highway: { // width is for single lane
                motorway: 5, motorway_link: 5, trunk: 4.5, trunk_link: 4.5,
                primary: 4, secondary: 4, tertiary: 4,
                primary_link: 4, secondary_link: 4, tertiary_link: 4,
                unclassified: 4, road: 4, living_street: 4, bus_guideway: 4, busway: 4, pedestrian: 4,
                residential: 3.5, service: 3.5, track: 3, cycleway: 2.5,
                bridleway: 2, corridor: 2, steps: 2, path: 1.5, footway: 1.5, ladder: 0.5,
            },
            railway: { // width includes ties and rail bed, not just track gauge
                rail: 2.5, light_rail: 2.5, tram: 2.5, subway: 2.5,
                monorail: 2.5, funicular: 2.5, disused: 2.5, preserved: 2.5,
                miniature: 1.5, narrow_gauge: 1.5
            },
            waterway: {
                river: 50, canal: 25, stream: 5, tidal_channel: 5, fish_pass: 2.5, drain: 2.5, ditch: 1.5
            }
        };
        for (var key in averageWidths) {
            if (this.tags[key] && averageWidths[key][this.tags[key]]) {
                var width = averageWidths[key][this.tags[key]];
                if (key === 'highway') {
                    var laneCount = this.tags.lanes && parseInt(this.tags.lanes, 10);
                    if (!laneCount) laneCount = this.isOneWay() ? 1 : 2;

                    return width * laneCount;
                }
                return width;
            }
        }
        return null;
    }

    /** returns a boolean, for example, if `oneway=yes` */
    isOneWayForwards() {
        if (this.tags.oneway === 'no') return false;

        return !!utilCheckTagDictionary(this.tags, osmOneWayForwardTags);
    }

    /** returns a boolean, for example, if `oneway=-1` */
    isOneWayBackwards() {
        if (this.tags.oneway === 'no') return false;

        return !!utilCheckTagDictionary(this.tags, osmOneWayBackwardTags);
    }

    /** returns a boolean, for example, if `oneway=alternating` */
    isBiDirectional() {
        if (this.tags.oneway === 'no') return false;

        return !!utilCheckTagDictionary(this.tags, osmOneWayBiDirectionalTags);
    }

    isOneWay() {
        if (this.tags.oneway === 'no') return false;

        return !!utilCheckTagDictionary(this.tags, osmOneWayTags);
    }

    // Some identifier for tag that implies that this way is "sided",
    // i.e. the right side is the 'inside' (e.g. the right side of a
    // natural=cliff is lower).
    sidednessIdentifier() {
        for (const realKey in this.tags) {
            const value = this.tags[realKey];
            const key = osmRemoveLifecyclePrefix(realKey);
            if (key in osmSidednessTags && (value in osmSidednessTags[key])) {
                if (osmSidednessTags[key][value] === true) {
                    return key;
                } else {
                    // if the map's value is something other than a
                    // literal true, we should use it so we can
                    // special case some keys (e.g. natural=coastline
                    // is handled differently to other naturals).
                    return osmSidednessTags[key][value];
                }
            }
        }

        return null;
    }

    isSided() {
        if (this.tags.two_sided === 'yes') {
            return false;
        }

        return this.sidednessIdentifier() !== null;
    }

    lanes() {
        return osmLanes(this);
    }

    isClosed() {
        return this.nodes.length > 1 && this.first() === this.last();
    }

    isConvex(resolver: coreGraph) {
        if (!this.isClosed() || this.isDegenerate()) return null;

        const nodes = utilArrayUniq(resolver.childNodes(this));
        const coords = nodes.map(function(n) { return n.loc; });
        let prev = 0;

        for (var i = 0; i < coords.length; i++) {
            var o = coords[(i+1) % coords.length];
            var a = coords[i];
            var b = coords[(i+2) % coords.length];
            var res = geoVecCross(a, b, o);

            const curr = (res > 0) ? 1 : (res < 0) ? -1 : 0;
            if (curr === 0) {
                continue;
            } else if (prev && curr !== prev) {
                return false;
            }
            prev = curr;
        }
        return true;
    }

    // returns an object with the tag that implies this is an area, if any
    tagSuggestingArea() {
        return osmTagSuggestingArea(this.tags);
    }

    isArea() {
        if (this.tags.area === 'yes') return true;
        if (!this.isClosed() || this.tags.area === 'no') return false;
        return this.tagSuggestingArea() !== null;
    }

    isDegenerate() {
        return (new Set(this.nodes).size < (this.isClosed() ? 3 : 2));
    }

    areAdjacent(n1: NodeId, n2: NodeId) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i] === n1) {
                if (this.nodes[i - 1] === n2) return true;
                if (this.nodes[i + 1] === n2) return true;
            }
        }
        return false;
    }

    geometry(graph: coreGraph) {
        return graph.transient(this, 'geometry', () => {
            return this.isArea() ? 'area' : 'line';
        });
    }

    // returns an array of objects representing the segments between the nodes in this way
    segments(graph: coreGraph) {
        const segmentExtent = (graph: coreGraph) => {
            var n1 = graph.hasEntity<osmNode>(this.nodes[0]);
            var n2 = graph.hasEntity<osmNode>(this.nodes[1]);
            return n1 && n2 && geoExtent([
                [
                    Math.min(n1.loc[0], n2.loc[0]),
                    Math.min(n1.loc[1], n2.loc[1])
                ],
                [
                    Math.max(n1.loc[0], n2.loc[0]),
                    Math.max(n1.loc[1], n2.loc[1])
                ]
            ]);
        };

        return graph.transient(this, 'segments', () => {
            var segments: Segment[] = [];
            for (var i = 0; i < this.nodes.length - 1; i++) {
                segments.push({
                    id: `${this.id}-${i}`,
                    wayId: this.id,
                    index: i,
                    nodes: [this.nodes[i], this.nodes[i + 1]],
                    extent: segmentExtent
                });
            }
            return segments;
        });
    }

    // If this way is not closed, append the beginning node to the end of the nodelist to close it.
    close() {
        if (this.isClosed() || !this.nodes.length) return this;

        var nodes = this.nodes.slice();
        nodes = nodes.filter(noRepeatNodes);
        nodes.push(nodes[0]);
        return this.update({ nodes: nodes });
    }

    // If this way is closed, remove any connector nodes from the end of the nodelist to unclose it.
    unclose() {
        if (!this.isClosed()) return this;

        var nodes = this.nodes.slice();
        var connector = this.first();
        var i = nodes.length - 1;

        // remove trailing connectors..
        while (i > 0 && nodes.length > 1 && nodes[i] === connector) {
            nodes.splice(i, 1);
            i = nodes.length - 1;
        }

        nodes = nodes.filter(noRepeatNodes);
        return this.update({ nodes: nodes });
    }

    // Adds a node (id) in front of the node which is currently at position index.
    // If index is undefined, the node will be added to the end of the way for linear ways,
    //   or just before the final connecting node for circular ways.
    // Consecutive duplicates are eliminated including existing ones.
    // Circularity is always preserved when adding a node.
    addNode(id: NodeId, index?: number) {
        var nodes = this.nodes.slice();
        var isClosed = this.isClosed();
        var max = isClosed ? nodes.length - 1 : nodes.length;

        if (index === undefined) {
            index = max;
        }

        if (index < 0 || index > max) {
            throw new RangeError('index ' + index + ' out of range 0..' + max);
        }

        // If this is a closed way, remove all connector nodes except the first one
        // (there may be duplicates) and adjust index if necessary..
        if (isClosed) {
            var connector = this.first();

            // leading connectors..
            var i = 1;
            while (i < nodes.length && nodes.length > 2 && nodes[i] === connector) {
                nodes.splice(i, 1);
                if (index > i) index--;
            }

            // trailing connectors..
            i = nodes.length - 1;
            while (i > 0 && nodes.length > 1 && nodes[i] === connector) {
                nodes.splice(i, 1);
                if (index > i) index--;
                i = nodes.length - 1;
            }
        }

        nodes.splice(index, 0, id);
        nodes = nodes.filter(noRepeatNodes);

        // If the way was closed before, append a connector node to keep it closed..
        if (isClosed && (nodes.length === 1 || nodes[0] !== nodes[nodes.length - 1])) {
            nodes.push(nodes[0]);
        }

        return this.update({ nodes: nodes });
    }

    // Replaces the node which is currently at position index with the given node (id).
    // Consecutive duplicates are eliminated including existing ones.
    // Circularity is preserved when updating a node.
    updateNode(id: NodeId, index: number) {
        var nodes = this.nodes.slice();
        var isClosed = this.isClosed();
        var max = nodes.length - 1;

        if (index === undefined || index < 0 || index > max) {
            throw new RangeError('index ' + index + ' out of range 0..' + max);
        }

        // If this is a closed way, remove all connector nodes except the first one
        // (there may be duplicates) and adjust index if necessary..
        if (isClosed) {
            var connector = this.first();

            // leading connectors..
            var i = 1;
            while (i < nodes.length && nodes.length > 2 && nodes[i] === connector) {
                nodes.splice(i, 1);
                if (index > i) index--;
            }

            // trailing connectors..
            i = nodes.length - 1;
            while (i > 0 && nodes.length > 1 && nodes[i] === connector) {
                nodes.splice(i, 1);
                if (index === i) index = 0;  // update leading connector instead
                i = nodes.length - 1;
            }
        }

        nodes.splice(index, 1, id);
        nodes = nodes.filter(noRepeatNodes);

        // If the way was closed before, append a connector node to keep it closed..
        if (isClosed && (nodes.length === 1 || nodes[0] !== nodes[nodes.length - 1])) {
            nodes.push(nodes[0]);
        }

        return this.update({nodes: nodes});
    }

    // Replaces each occurrence of node id needle with replacement.
    // Consecutive duplicates are eliminated including existing ones.
    // Circularity is preserved.
    replaceNode(needleID: NodeId, replacementID: NodeId) {
        var nodes = this.nodes.slice();
        var isClosed = this.isClosed();

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i] === needleID) {
                nodes[i] = replacementID;
            }
        }

        nodes = nodes.filter(noRepeatNodes);

        // If the way was closed before, append a connector node to keep it closed..
        if (isClosed && (nodes.length === 1 || nodes[0] !== nodes[nodes.length - 1])) {
            nodes.push(nodes[0]);
        }

        return this.update({nodes: nodes});
    }

    // Removes each occurrence of node id.
    // Consecutive duplicates are eliminated including existing ones.
    // Circularity is preserved.
    removeNode(id: NodeId | '') {
        var nodes = this.nodes.slice();
        var isClosed = this.isClosed();

        nodes = nodes
            .filter(function(node) { return node !== id; })
            .filter(noRepeatNodes);

        // If the way was closed before, append a connector node to keep it closed..
        if (isClosed && (nodes.length === 1 || nodes[0] !== nodes[nodes.length - 1])) {
            nodes.push(nodes[0]);
        }

        return this.update({nodes: nodes});
    }

    asJXON(changeset_id: ChangesetId) {
        var r: any = {
            way: {
                '@id': this.osmId(),
                '@version': this.version || 0,
                nd: this.nodes.map(function(id) {
                    return { keyAttributes: { ref: osmIdManager.toOSM(id) } };
                }, this),
                tag: Object.keys(this.tags).map((k) => {
                    return { keyAttributes: { k: k, v: this.tags[k] } };
                }, this)
            }
        };
        if (changeset_id) {
            r.way['@changeset'] = changeset_id;
        }
        return r;
    }

    asGeoJSON(resolver: coreGraph): Polygon | LineString {
        return resolver.transient(this, 'GeoJSON', () => {
            var coordinates = resolver.childNodes(this)
                .map(function(n) { return n.loc; });

            if (this.isArea() && this.isClosed()) {
                return {
                    type: 'Polygon',
                    coordinates: [coordinates]
                };
            } else {
                return {
                    type: 'LineString',
                    coordinates: coordinates
                };
            }
        });
    }

    area(resolver: coreGraph) {
        return resolver.transient(this, 'area', () => {
            var nodes = resolver.childNodes(this);

            var json: Polygon = {
                type: 'Polygon',
                coordinates: [ nodes.map(function(n) { return n.loc; }) ]
            };

            if (!this.isClosed() && nodes.length) {
                json.coordinates[0].push(nodes[0].loc);
            }

            var area = d3_geoArea(json);

            // Heuristic for detecting counterclockwise winding order. Assumes
            // that OpenStreetMap polygons are not hemisphere-spanning.
            if (area > 2 * Math.PI) {
                json.coordinates[0].reverse();
                area = d3_geoArea(json);
            }

            return isNaN(area) ? 0 : area;
        });
    }
}

// Filter function to eliminate consecutive duplicates.
function noRepeatNodes(node: string, i: number, arr: string[]) {
    return i === 0 || node !== arr[i - 1];
}
