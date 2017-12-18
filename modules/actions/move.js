import _each from 'lodash-es/each';
import _every from 'lodash-es/every';
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _intersection from 'lodash-es/intersection';
import _isEqual from 'lodash-es/isEqual';
import _isEmpty from 'lodash-es/isEmpty';
import _map from 'lodash-es/map';
import _without from 'lodash-es/without';

import { osmNode } from '../osm';

import {
  geoAngle,
  geoChooseEdge,
  geoInterp,
  geoPathIntersections,
  geoPathLength,
  geoSphericalDistance,
  geoVecAdd,
  geoVecSubtract
} from '../geo';


// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
export function actionMove(moveIds, tryDelta, projection, cache) {
    var _delta = tryDelta;

    function setupCache(graph) {
        function canMove(nodeId) {
            // Allow movement of any node that is in the selectedIDs list..
            if (moveIds.indexOf(nodeId) !== -1) return true;

            // Allow movement of a vertex where 2 ways meet..
            var parents = _map(graph.parentWays(graph.entity(nodeId)), 'id');
            if (parents.length < 3) return true;

            // Restrict movement of a vertex where >2 ways meet, unless all parentWays are moving too..
            var parentsMoving = _every(parents, function(id) { return cache.moving[id]; });
            if (!parentsMoving) delete cache.moving[nodeId];

            return parentsMoving;
        }

        function cacheEntities(ids) {
            ids.forEach(function(id) {
                if (cache.moving[id]) return;
                cache.moving[id] = true;

                var entity = graph.hasEntity(id);
                if (!entity) return;

                if (entity.type === 'node') {
                    cache.nodes.push(id);
                    cache.startLoc[id] = entity.loc;
                } else if (entity.type === 'way') {
                    cache.ways.push(id);
                    cacheEntities(entity.nodes);
                } else {
                    cacheEntities(entity.members.map(function(member) {
                        return member.id;
                    }));
                }
            });
        }

        function cacheIntersections(ids) {
            function isEndpoint(way, id) { return !way.isClosed() && !!way.affix(id); }

            ids.forEach(function(id) {
                // consider only intersections with 1 moved and 1 unmoved way.
                var childNodes = graph.childNodes(graph.entity(id));
                childNodes.forEach(function(node) {
                    var parents = graph.parentWays(node);
                    if (parents.length !== 2) return;

                    var moved = graph.entity(id),
                        unmoved = _find(parents, function(way) { return !cache.moving[way.id]; });
                    if (!unmoved) return;

                    // exclude ways that are overly connected..
                    if (_intersection(moved.nodes, unmoved.nodes).length > 2) return;

                    if (moved.isArea() || unmoved.isArea()) return;

                    cache.intersection[node.id] = {
                        nodeId: node.id,
                        movedId: moved.id,
                        unmovedId: unmoved.id,
                        movedIsEP: isEndpoint(moved, node.id),
                        unmovedIsEP: isEndpoint(unmoved, node.id)
                    };
                });
            });
        }


        if (!cache) {
            cache = {};
        }
        if (!cache.ok) {
            cache.moving = {};
            cache.intersection = {};
            cache.replacedVertex = {};
            cache.startLoc = {};
            cache.nodes = [];
            cache.ways = [];

            cacheEntities(moveIds);
            cacheIntersections(cache.ways);
            cache.nodes = _filter(cache.nodes, canMove);

            cache.ok = true;
        }
    }


    // Place a vertex where the moved vertex used to be, to preserve way shape..
    function replaceMovedVertex(nodeId, wayId, graph, _delta) {
        var way = graph.entity(wayId);
        var moved = graph.entity(nodeId);
        var movedIndex = way.nodes.indexOf(nodeId);
        var len, prevIndex, nextIndex;

        if (way.isClosed()) {
            len = way.nodes.length - 1;
            prevIndex = (movedIndex + len - 1) % len;
            nextIndex = (movedIndex + len + 1) % len;
        } else {
            len = way.nodes.length;
            prevIndex = movedIndex - 1;
            nextIndex = movedIndex + 1;
        }

        var prev = graph.hasEntity(way.nodes[prevIndex]);
        var next = graph.hasEntity(way.nodes[nextIndex]);

        // Don't add orig vertex at endpoint..
        if (!prev || !next) return graph;

        var key = wayId + '_' + nodeId;
        var orig = cache.replacedVertex[key];
        if (!orig) {
            orig = osmNode();
            cache.replacedVertex[key] = orig;
            cache.startLoc[orig.id] = cache.startLoc[nodeId];
        }

        var start, end;
        if (_delta) {
            start = projection(cache.startLoc[nodeId]);
            end = projection.invert(geoVecAdd(start, _delta));
        } else {
            end = cache.startLoc[nodeId];
        }
        orig = orig.move(end);

        var angle = Math.abs(geoAngle(orig, prev, projection) -
                geoAngle(orig, next, projection)) * 180 / Math.PI;

        // Don't add orig vertex if it would just make a straight line..
        if (angle > 175 && angle < 185) return graph;

        // Don't add orig vertex if another point is already nearby (within 10m)
        if (geoSphericalDistance(prev.loc, orig.loc) < 10 ||
            geoSphericalDistance(orig.loc, next.loc) < 10) return graph;

        // moving forward or backward along way?
        var p1 = [prev.loc, orig.loc, moved.loc, next.loc].map(projection),
            p2 = [prev.loc, moved.loc, orig.loc, next.loc].map(projection),
            d1 = geoPathLength(p1),
            d2 = geoPathLength(p2),
            insertAt = (d1 < d2) ? movedIndex : nextIndex;

        // moving around closed loop?
        if (way.isClosed() && insertAt === 0) insertAt = len;

        way = way.addNode(orig.id, insertAt);
        return graph.replace(orig).replace(way);
    }


    // Reorder nodes around intersections that have moved..
    function unZorroIntersection(intersection, graph) {
        var vertex = graph.entity(intersection.nodeId);
        var way1 = graph.entity(intersection.movedId);
        var way2 = graph.entity(intersection.unmovedId);
        var isEP1 = intersection.movedIsEP;
        var isEP2 = intersection.unmovedIsEP;

        // don't move the vertex if it is the endpoint of both ways.
        if (isEP1 && isEP2) return graph;

        var nodes1 = _without(graph.childNodes(way1), vertex);
        var nodes2 = _without(graph.childNodes(way2), vertex);

        if (way1.isClosed() && way1.first() === vertex.id) nodes1.push(nodes1[0]);
        if (way2.isClosed() && way2.first() === vertex.id) nodes2.push(nodes2[0]);

        var edge1 = !isEP1 && geoChooseEdge(nodes1, projection(vertex.loc), projection);
        var edge2 = !isEP2 && geoChooseEdge(nodes2, projection(vertex.loc), projection);
        var loc;

        // snap vertex to nearest edge (or some point between them)..
        if (!isEP1 && !isEP2) {
            var epsilon = 1e-4, maxIter = 10;
            for (var i = 0; i < maxIter; i++) {
                loc = geoInterp(edge1.loc, edge2.loc, 0.5);
                edge1 = geoChooseEdge(nodes1, projection(loc), projection);
                edge2 = geoChooseEdge(nodes2, projection(loc), projection);
                if (Math.abs(edge1.distance - edge2.distance) < epsilon) break;
            }
        } else if (!isEP1) {
            loc = edge1.loc;
        } else {
            loc = edge2.loc;
        }

        graph = graph.replace(vertex.move(loc));

        // if zorro happened, reorder nodes..
        if (!isEP1 && edge1.index !== way1.nodes.indexOf(vertex.id)) {
            way1 = way1.removeNode(vertex.id).addNode(vertex.id, edge1.index);
            graph = graph.replace(way1);
        }
        if (!isEP2 && edge2.index !== way2.nodes.indexOf(vertex.id)) {
            way2 = way2.removeNode(vertex.id).addNode(vertex.id, edge2.index);
            graph = graph.replace(way2);
        }

        return graph;
    }


    function cleanupIntersections(graph) {
        _each(cache.intersection, function(obj) {
            graph = replaceMovedVertex(obj.nodeId, obj.movedId, graph, _delta);
            graph = replaceMovedVertex(obj.nodeId, obj.unmovedId, graph, null);
            graph = unZorroIntersection(obj, graph);
        });

        return graph;
    }


    // check if moving way endpoint can cross an unmoved way, if so limit _delta..
    function limitDelta(graph) {
        _each(cache.intersection, function(obj) {
            // Don't limit movement if this is vertex joins 2 endpoints..
            if (obj.movedIsEP && obj.unmovedIsEP) return;
            // Don't limit movement if this vertex is not an endpoint anyway..
            if (!obj.movedIsEP) return;

            var node = graph.entity(obj.nodeId);
            var start = projection(node.loc);
            var end = geoVecAdd(start, _delta);
            var movedNodes = graph.childNodes(graph.entity(obj.movedId));
            var movedPath = _map(_map(movedNodes, 'loc'), function(loc) {
                return geoVecAdd(projection(loc), _delta);
            });
            var unmovedNodes = graph.childNodes(graph.entity(obj.unmovedId));
            var unmovedPath = _map(_map(unmovedNodes, 'loc'), projection);
            var hits = geoPathIntersections(movedPath, unmovedPath);

            for (var i = 0; i < hits.length; i++) {
                if (_isEqual(hits[i], end)) continue;
                var edge = geoChooseEdge(unmovedNodes, end, projection);
                _delta = geoVecSubtract(projection(edge.loc), start);
            }
        });
    }


    var action = function(graph) {
        if (_delta[0] === 0 && _delta[1] === 0) return graph;

        setupCache(graph);

        if (!_isEmpty(cache.intersection)) {
            limitDelta(graph);
        }

        _each(cache.nodes, function(id) {
            var node = graph.entity(id);
            var start = projection(node.loc);
            var end = geoVecAdd(start, _delta);
            graph = graph.replace(node.move(projection.invert(end)));
        });

        if (!_isEmpty(cache.intersection)) {
            graph = cleanupIntersections(graph);
        }

        return graph;
    };


    action.delta = function() {
        return _delta;
    };


    return action;
}
