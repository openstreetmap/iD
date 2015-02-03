// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
iD.actions.Move = function(moveIds, delta, projection, cache) {

    function setupCache(graph) {
        if (!cache) {
            cache = {};
        }
        if (!cache.ok) {
            cache.moving = {};
            cache.replacedVertex = {};
            cache.startLoc = {};
            cache.nodes = [];
            cache.ways = [];

            cacheEntities(moveIds, graph);
            cache.nodes = _.filter(cache.nodes, function(id) { return canMove(id, graph); });

            cache.ok = true;
        }
    }

    function cacheEntities(ids, graph) {
        _.each(ids, function(id) {
            if (cache.moving[id]) return;
            cache.moving[id] = true;

            var entity = graph.hasEntity(id);
            if (!entity) return;

            if (entity.type === 'node') {
                cache.nodes.push(id);
                cache.startLoc[id] = entity.loc;
            } else if (entity.type === 'way') {
                cache.ways.push(id);
                cacheEntities(entity.nodes, graph);
            } else {
                cacheEntities(_.pluck(entity.members, 'id'), graph);
            }
        });
    }

    // Place a vertex where the moved vertex used to be, to preserve way shape..
    function replaceMovedVertex(nodeId, wayId, graph, delta) {
        var way = graph.entity(wayId),
            moved = graph.entity(nodeId),
            movedIndex = way.nodes.indexOf(nodeId),
            len, prevIndex, nextIndex;

        if (way.isClosed()) {
            len = way.nodes.length - 1;
            prevIndex = (movedIndex + len - 1) % len;
            nextIndex = (movedIndex + len + 1) % len;
        } else {
            len = way.nodes.length;
            prevIndex = movedIndex - 1;
            nextIndex = movedIndex + 1;
        }

        var prev = graph.hasEntity(way.nodes[prevIndex]),
            next = graph.hasEntity(way.nodes[nextIndex]);

        // Don't add orig vertex at endpoint..
        if (!prev || !next) return graph;

        var key = wayId + '_' + nodeId,
            orig = cache.replacedVertex[key];
        if (!orig) {
            orig = iD.Node();
            cache.replacedVertex[key] = orig;
            cache.startLoc[orig.id] = cache.startLoc[nodeId];
        }

        var start, end;
        if (delta) {
            start = projection(cache.startLoc[nodeId]);
            end = projection.invert([start[0] + delta[0], start[1] + delta[1]]);
        } else {
            end = cache.startLoc[nodeId];
        }
        orig = orig.move(end);

        var angle = Math.abs(iD.geo.angle(orig, prev, projection) -
                iD.geo.angle(orig, next, projection)) * 180 / Math.PI;

        // Don't add orig vertex if it would just make a straight line..
        if (angle > 170 && angle < 190) return graph;

        // moving forward or backward along way?
        var p1 = [prev.loc, orig.loc, moved.loc, next.loc].map(projection),
            p2 = [prev.loc, moved.loc, orig.loc, next.loc].map(projection),
            d1 = iD.geo.pathLength(p1),
            d2 = iD.geo.pathLength(p2),
            insertAt = (d1 < d2) ? movedIndex : nextIndex;

        // moving around closed loop?
        if (way.isClosed() && insertAt === 0) insertAt = len;

        way = way.addNode(orig.id, insertAt);
        return graph.replace(orig).replace(way);
    }

    // Reorder nodes around intersections of ways that have moved..
    function unZorroIntersection(nodeId, graph) {
        var vertex = graph.entity(nodeId),
            parents = graph.parentWays(vertex),
            way1 = parents[0],
            way2 = parents[1];

        if (!way1 || !way2) return graph;

        var isEP1 = isEndpoint(nodeId, way1),
            isEP2 = isEndpoint(nodeId, way2);

        // don't move the vertex if it is the endpoint of both ways.
        if (isEP1 && isEP2) return graph;

        var nodes1 = _.without(graph.childNodes(way1), vertex),
            nodes2 = _.without(graph.childNodes(way2), vertex);

        if (way1.isClosed() && way1.first() === nodeId) nodes1.push(nodes1[0]);
        if (way2.isClosed() && way2.first() === nodeId) nodes2.push(nodes2[0]);

        var edge1 = !isEP1 && iD.geo.chooseEdge(nodes1, projection(vertex.loc), projection),
            edge2 = !isEP2 && iD.geo.chooseEdge(nodes2, projection(vertex.loc), projection),
            loc;

        // snap vertex to nearest edge (or some point between them)..
        if (!isEP1 && !isEP2) {
            var epsilon = 1e-4, maxIter = 10;
            for (var i = 0; i < maxIter; i++) {
                loc = iD.geo.interp(edge1.loc, edge2.loc, 0.5);
                edge1 = iD.geo.chooseEdge(nodes1, projection(loc), projection);
                edge2 = iD.geo.chooseEdge(nodes2, projection(loc), projection);
                if (Math.abs(edge1.distance - edge2.distance) < epsilon) break;
            }
        } else if (!isEP1) {
            loc = edge1.loc;
        } else {
            loc = edge2.loc;
        }

        graph = graph.replace(vertex.move(loc));

        // if zorro happened, reorder nodes..
        if (!isEP1 && edge1.index !== way1.nodes.indexOf(nodeId)) {
            way1 = way1.removeNode(nodeId).addNode(nodeId, edge1.index);
            graph = graph.replace(way1);
        }
        if (!isEP2 && edge2.index !== way2.nodes.indexOf(nodeId)) {
            way2 = way2.removeNode(nodeId).addNode(nodeId, edge2.index);
            graph = graph.replace(way2);
        }

        return graph;
    }

    // // scale the vertices between keynodes..
    // function rescaleSegments(wayId, keyNodeIds, graph) {
    //     function scale(p, dmin, dmax, rmin, rmax) {
    //         var x = (dmax[0] === dmin[0]) ? p[0] :
    //                 ((rmax[0] - rmin[0]) * (p[0] - dmin[0]) / (dmax[0] - dmin[0])) + rmin[0],
    //             y = (dmax[1] === dmin[1]) ? p[1] :
    //                 ((rmax[1] - rmin[1]) * (p[1] - dmin[1]) / (dmax[1] - dmin[1])) + rmin[1];
    //         return [x, y];
    //     }

    //     function rescaleSegment(from, to, ids, graph) {
    //         if (!ids.length) return graph;

    //         var dmin = projection(cache.startLoc[from]),
    //             dmax = projection(cache.startLoc[to]),
    //             rmin = projection(graph.entity(from).loc),
    //             rmax = projection(graph.entity(to).loc);
    //         // var dmin = (cache.startLoc[from]),
    //         //     dmax = (cache.startLoc[to]),
    //         //     rmin = (graph.entity(from).loc),
    //         //     rmax = (graph.entity(to).loc);

    //         var j, node, p1, p2;

    //         // console.log('');
    //         for (j = 0; j < ids.length; j++) {
    //             node = graph.entity(ids[j]);
    //             p1 = projection(cache.startLoc[ids[j]]);
    //             // p1 = (cache.startLoc[ids[j]]);
    //             p2 = scale(p1, dmin, dmax, rmin, rmax);
    //             // console.log(ids[j] + ': move from ' + iD.geo.roundCoords(p1) + ' to ' + iD.geo.roundCoords(p2));
    //             graph = graph.replace(node.move(projection.invert(p2)));
    //             // graph = graph.replace(node.move(p2));
    //         }
    //         return graph;
    //     }

    //     var way = graph.entity(wayId);
    //     if (way.isClosed()) return graph;

    //     var ids = [],
    //         from, to;

    //     for (var i = 0; i < way.nodes.length; i++) {
    //         if (keyNodeIds.indexOf(way.nodes[i]) !== -1) {
    //             if (!from) {
    //                 from = way.nodes[i];
    //             } else {
    //                 to = way.nodes[i];
    //                 graph = rescaleSegment(from, to, ids, graph);

    //                 ids = [];
    //                 from = to;
    //                 to = undefined;
    //             }
    //         } else {
    //             ids.push(way.nodes[i]);
    //         }
    //     }

    //     return graph;
    // }

    function isEndpoint(id, way) {
        return !way.isClosed() && !!way.affix(id);
    }

    function cleanupWay(id, graph) {
        var movedWay = graph.entity(id),
            movedNodes = graph.childNodes(movedWay),
            intersections = _.filter(movedNodes,
                function(node) { return (graph.parentWays(node).length === 2); });
            // keyNodeIds = [movedWay.first()].concat(_.pluck(intersections, 'id'), [movedWay.last()]);

        _.each(intersections, function(node) {
            var unmovedWay = _.find(graph.parentWays(node), function(way) { return !cache.moving[way.id]; });
            if (unmovedWay) {
                graph = replaceMovedVertex(node.id, movedWay.id, graph, delta);
                graph = replaceMovedVertex(node.id, unmovedWay.id, graph, null);
                graph = unZorroIntersection(node.id, graph);
            }
        });

        // graph = rescaleSegments(movedWay.id, keyNodeIds, graph);

        return graph;
    }

    // Don't move a vertex where >2 ways meet, unless all parentWays are moving too..
    function canMove(nodeId, graph) {
        var parents = _.pluck(graph.parentWays(graph.entity(nodeId)), 'id');
        if (parents.length < 3) return true;

        var parentsMoving = _.all(parents, function(id) { return cache.moving[id]; });
        if (!parentsMoving) delete cache.moving[nodeId];

        return parentsMoving;
    }

    var action = function(graph) {
        if (delta[0] === 0 && delta[1] === 0) return graph;

        setupCache(graph);

        _.each(cache.nodes, function(id) {
            var node = graph.entity(id),
                start = projection(node.loc),
                end = projection.invert([start[0] + delta[0], start[1] + delta[1]]);
            graph = graph.replace(node.move(end));
        });

        _.each(cache.ways, function(id) {
            graph = cleanupWay(id, graph);
        });

        return graph;
    };

    action.disabled = function(graph) {
        function incompleteRelation(id) {
            var entity = graph.entity(id);
            return entity.type === 'relation' && !entity.isComplete(graph);
        }

        if (_.any(moveIds, incompleteRelation))
            return 'incomplete_relation';
    };

    return action;
};
