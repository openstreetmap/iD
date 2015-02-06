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
        if (angle > 175 && angle < 195) return graph;

        // Don't add orig vertex if another point is already nearby (within 10m)
        if (iD.geo.sphericalDistance(prev.loc, orig.loc) < 10 ||
            iD.geo.sphericalDistance(orig.loc, next.loc) < 10) return graph;

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

    // // Adjust any vertices that have been moved beyond the endpoints..
    // function unZorroEndpoint(nodeId, movedId, unmovedId, graph) {

    //     function diffMultiPoint(a1, a2) {
    //         var result = [];
    //         outer: for (var i = 0; i < a1.length; i++) {
    //             for (var j = 0; j < a2.length; j++) {
    //                 if (a1[i][0] === a2[j][0] && a1[i][1] === a2[j][1]) continue outer;
    //             }
    //             result.push(a1[i]);
    //         }
    //         return result;
    //     }

    //     var movedWay = graph.entity(movedId),
    //         unmovedWay = graph.entity(unmovedId),
    //         movedNodes = graph.childNodes(movedWay),
    //         unmovedNodes = graph.childNodes(unmovedWay);

    //     if (movedNodes.length < 3) return graph;
    //     if (movedWay.last() === nodeId) movedNodes.reverse();

    //     var movedPath = _.pluck(movedNodes, 'loc').map(projection),
    //         unmovedPath = _.pluck(unmovedNodes, 'loc').map(projection),
    //         testPath = _.clone(movedPath),
    //         keep = [],
    //         remove = [],
    //         index = 0;

    //     // try removing segments from movedPath until zorros disappear..
    //     do {
    //         // paths intersect where there is not a vertex?
    //         var intersections = iD.geo.pathIntersections(testPath, unmovedPath),
    //             zorros = diffMultiPoint(intersections, testPath);
    //         if (!zorros.length) break;

    //         var node = movedNodes[++index];
    //         (node.hasInterestingTags() ? keep : keep).push(node);
    //         testPath.splice(1, 1);

    //     } while (testPath.length > 2);

    //     // either movedPath ok, or testPath left with nothing but the 2 endpoints..
    //     if (index === 0 || testPath.length === 2) return graph;

    //     if (remove.length) {
    //         graph = iD.actions.DeleteMultiple(_.pluck(remove, 'id'))(graph);
    //     }

    //     for (var i = 0; i < keep.length; i++) {
    //         var point = iD.geo.interp(movedPath[0], movedPath[index+1], (i + 1) / keep.length);
    //         graph = graph.replace(keep[i].move(projection.invert(point)));
    //     }

    //     return graph;
    // }

    function isEndpoint(id, way) {
        return !way.isClosed() && !!way.affix(id);
    }

    function cleanupWay(id, graph) {
        var movedWay = graph.entity(id),
            movedNodes = graph.childNodes(movedWay),
            intersections = {};

        // consider only intersections with 1 moved and 1 unmoved way.
        _.each(movedNodes, function(node) {
            var parents = graph.parentWays(node);
            if (parents.length !== 2) return;

            var unmovedWay = _.find(parents, function(way) { return !cache.moving[way.id]; });
            if (!unmovedWay) return;

            intersections[node.id] = {
                movedWay: movedWay,
                unmovedWay: unmovedWay
            };
        });

        _.each(intersections, function(obj, id) {
            graph = replaceMovedVertex(id, obj.movedWay.id, graph, delta);
            graph = replaceMovedVertex(id, obj.unmovedWay.id, graph, null);
            graph = unZorroIntersection(id, graph);
        });

        // _.each(intersections, function(obj, id) {
        //     if (isEndpoint(id, obj.movedWay)) {
        //         graph = unZorroEndpoint(id, obj.movedWay.id, obj.unmovedWay.id, graph);
        //     }
        // });

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
