// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
iD.actions.Move = function(moveIds, delta, projection, cache) {

    function addIds(ids, nodes, ways, graph) {
        _.each(ids, function(id) {
            var entity = graph.entity(id);

            if (entity.type === 'node') {
                nodes.push(entity.id);
            } else if (entity.type === 'way') {
                ways.push(entity.id);
                addIds(entity.nodes, nodes, ways, graph);
            } else {
                addIds(_.pluck(entity.members, 'id'), nodes, ways, graph);
            }
        });
    }

    // Place a vertex where the moved vertex used to be, to preserve way shape..
    function replaceMovedVertex(nodeId, wayId, graph, delta) {
        if (!cache.startLoc[nodeId]) return graph;

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

        var start, end;
        if (delta) {
            start = projection(cache.startLoc[nodeId]);
            end = projection.invert([start[0] + delta[0], start[1] + delta[1]]);
        } else {
            end = cache.startLoc[nodeId];
        }

        var orig = iD.Node({loc: end}),
            angle = Math.abs(iD.geo.angle(orig, prev, projection) -
                iD.geo.angle(orig, next, projection)) * 180 / Math.PI;

        // Don't add orig vertex if it would just make a straight line..
        if (angle > 170 && angle < 190) return graph;

        // Don't add orig vertex if points are already close (within 20m)
        if (iD.geo.sphericalDistance(prev.loc, orig.loc) < 20 ||
            iD.geo.sphericalDistance(orig.loc, next.loc) < 20) return graph;

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

    function unZorro(nodeId, wayId1, wayId2, graph) {
        var vertex = graph.entity(nodeId),
            way1 = graph.entity(wayId1),
            way2 = graph.entity(wayId2),
            isEP1 = isEndpoint(nodeId, way1),
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

    function isEndpoint(id, way) {
        return !way.isClosed() && !!way.affix(id);
    }

    function cleanupWays(movedWays, graph) {
        _.each(movedWays, function(movedId) {
            var movedWay = graph.entity(movedId),
                intersections = _.filter(graph.childNodes(movedWay),
                function(vertex) { return (graph.parentWays(vertex).length === 2); });

            _.each(intersections, function(vertex) {
                var fixedWay = _.find(graph.parentWays(vertex),
                        function(way) { return way.id !== movedWay.id; });

                if (cache.startLoc[vertex.id]) {
                    graph = replaceMovedVertex(vertex.id, movedWay.id, graph, delta);
                    graph = replaceMovedVertex(vertex.id, fixedWay.id, graph, null);
                    delete cache.startLoc[vertex.id];
                }

                graph = unZorro(vertex.id, movedWay.id, fixedWay.id, graph);
            });
        });
        return graph;
    }

    // Don't move a vertex where >2 ways meet, unless all parentWays are moving too..
    function canMove(nodeId, graph) {
        var parents = graph.parentWays(graph.entity(nodeId));
        if (parents.length < 3) return true;

        return _.all(_.pluck(parents, 'id'), function(id) {
            return _.contains(moveIds, id);
        });
    }

    var action = function(graph) {
        if (_.isEqual(delta, [0,0])) return graph;

        var nodes = [],
            ways = [];

        addIds(moveIds, nodes, ways, graph);
        nodes = _.filter(nodes, function(id) { return canMove(id, graph); });

        _.uniq(nodes).forEach(function(id) {
            var node = graph.entity(id),
                start = projection(node.loc),
                end = projection.invert([start[0] + delta[0], start[1] + delta[1]]);
            graph = graph.replace(node.move(end));
        });

        if (cache) {
            graph = cleanupWays(_.uniq(ways), graph);
        }

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
