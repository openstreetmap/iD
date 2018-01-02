import _extend from 'lodash-es/extend';

import {
    geoIdentity as d3_geoIdentity,
    geoPath as d3_geoPath,
    geoStream as d3_geoStream
} from 'd3-geo';

import { geoVecLength } from '../geo';


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
export function svgPassiveVertex(node, graph, activeID) {
    if (!activeID) return 1;
    if (activeID === node.id) return 0;

    var parents = graph.parentWays(node);

    for (var i = 0; i < parents.length; i++) {
        var nodes = parents[i].nodes;
        var isClosed = parents[i].isClosed();
        for (var j = 0; j < nodes.length; j++) {   // find this vertex, look nearby
            if (nodes[j] === node.id) {
                var ix1 = j - 2;
                var ix2 = j - 1;
                var ix3 = j + 1;
                var ix4 = j + 2;

                if (isClosed) {  // wraparound if needed
                    var max = nodes.length - 1;
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


export function svgOneWaySegments(projection, graph, dt) {
    return function(entity) {
        var i = 0;
        var offset = dt;
        var segments = [];
        var clip = d3_geoIdentity().clipExtent(projection.clipExtent()).stream;
        var coordinates = graph.childNodes(entity).map(function(n) { return n.loc; });
        var a, b;

        if (entity.tags.oneway === '-1') {
            coordinates.reverse();
        }

        d3_geoStream({
            type: 'LineString',
            coordinates: coordinates
        }, projection.stream(clip({
            lineStart: function() {},
            lineEnd: function() { a = null; },
            point: function(x, y) {
                b = [x, y];

                if (a) {
                    var span = geoVecLength(a, b) - offset;

                    if (span >= 0) {
                        var angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
                        var dx = dt * Math.cos(angle);
                        var dy = dt * Math.sin(angle);
                        var p = [
                            a[0] + offset * Math.cos(angle),
                            a[1] + offset * Math.sin(angle)
                        ];
                        var segment = 'M' + a[0] + ',' + a[1] + 'L' + p[0] + ',' + p[1];

                        for (span -= dt; span >= 0; span -= dt) {
                            p[0] += dx;
                            p[1] += dy;
                            segment += 'L' + p[0] + ',' + p[1];
                        }

                        segment += 'L' + b[0] + ',' + b[1];
                        segments.push({id: entity.id, index: i, d: segment});
                    }

                    offset = -span;
                    i++;
                }

                a = b;
            }
        })));

        return segments;
    };
}


export function svgPath(projection, graph, isArea) {

    // Explanation of magic numbers:
    // "padding" here allows space for strokes to extend beyond the viewport,
    // so that the stroke isn't drawn along the edge of the viewport when
    // the shape is clipped.
    //
    // When drawing lines, pad viewport by 5px.
    // When drawing areas, pad viewport by 65px in each direction to allow
    // for 60px area fill stroke (see ".fill-partial path.fill" css rule)

    var cache = {};
    var padding = isArea ? 65 : 5;
    var viewport = projection.clipExtent();
    var paddedExtent = [
        [viewport[0][0] - padding, viewport[0][1] - padding],
        [viewport[1][0] + padding, viewport[1][1] + padding]
    ];
    var clip = d3_geoIdentity().clipExtent(paddedExtent).stream;
    var project = projection.stream;
    var path = d3_geoPath()
        .projection({stream: function(output) { return project(clip(output)); }});

    var svgpath = function(entity) {
        if (entity.id in cache) {
            return cache[entity.id];
        } else {
            return cache[entity.id] = path(entity.asGeoJSON(graph));
        }
    };

    svgpath.geojson = path;

    return svgpath;
}


export function svgPointTransform(projection) {
    var svgpoint = function(entity) {
        // http://jsperf.com/short-array-join
        var pt = projection(entity.loc);
        return 'translate(' + pt[0] + ',' + pt[1] + ')';
    };

    svgpoint.geojson = function(d) {
        return svgpoint(d.properties.entity);
    };

    return svgpoint;
}


export function svgRelationMemberTags(graph) {
    return function(entity) {
        var tags = entity.tags;
        graph.parentRelations(entity).forEach(function(relation) {
            var type = relation.tags.type;
            if (type === 'multipolygon' || type === 'boundary') {
                tags = _extend({}, relation.tags, tags);
            }
        });
        return tags;
    };
}


export function svgSegmentWay(way, graph, activeID) {
    var features = { passive: [], active: [] };
    var coordGroups = { passive: [], active: [] };
    var nodeGroups = { passive: [], active: [] };
    var coords = [];
    var nodes = [];
    var startType = null;   // 0 = active, 1 = passive, 2 = adjacent
    var currType = null;    // 0 = active, 1 = passive, 2 = adjacent
    var node;

    for (var i = 0; i < way.nodes.length; i++) {
        if (way.nodes[i] === activeID) {    // vertex is the activeID
            coords = [];                   // draw no segment here
            nodes = [];
            startType = null;
            continue;
        }

        node = graph.entity(way.nodes[i]);
        currType = svgPassiveVertex(node, graph, activeID);

        if (startType === null) {
            startType = currType;
        }

        if (currType !== startType) {    // line changes here - try to save a segment

            if (coords.length > 0) {       // finish previous segment
                coords.push(node.loc);
                nodes.push(node.id);
                if (startType === 2 || currType === 2) {          // one adjacent vertex
                    coordGroups.active.push(coords);
                    nodeGroups.active.push(nodes);
                } else if (startType === 0 && currType === 0) {   // both active vertices
                    coordGroups.active.push(coords);
                    nodeGroups.active.push(nodes);
                } else {
                    coordGroups.passive.push(coords);
                    nodeGroups.passive.push(nodes);
                }
            }

            coords = [];
            nodes = [];
            startType = currType;
        }

        coords.push(node.loc);
        nodes.push(node.id);
    }

    // complete whatever segment we ended on
    if (coords.length > 1) {
        if (startType === 2 || currType === 2) {          // one adjacent vertex
            coordGroups.active.push(coords);
            nodeGroups.active.push(nodes);
        } else if (startType === 0 && currType === 0) {   // both active vertices
            coordGroups.active.push(coords);
            nodeGroups.active.push(nodes);
        } else {
            coordGroups.passive.push(coords);
            nodeGroups.passive.push(nodes);
        }
    }

    if (coordGroups.passive.length) {
        features.passive.push({
            type: 'Feature',
            id: way.id,
            properties: {
                target: true,
                entity: way,
                nodes: nodeGroups.passive
            },
            geometry: {
                type: 'MultiLineString',
                coordinates: coordGroups.passive
            }
        });
    }

    if (coordGroups.active.length) {
        features.active.push({
            type: 'Feature',
            id: way.id + '-nope',   // break the ids on purpose
            properties: {
                target: true,
                entity: way,
                nodes: nodeGroups.active,
                nope: true,
                originalID: way.id
            },
            geometry: {
                type: 'MultiLineString',
                coordinates: coordGroups.active
            }
        });
    }

    return features;
}
