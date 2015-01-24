// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
iD.actions.Move = function(moveIds, delta, projection, cache) {

    function addIds(ids, nodes, ways, graph) {
        _.each(ids, function(id) {
            var entity = graph.entity(id);

            if (entity.type === 'node') {
                nodes.push(entity);
            } else if (entity.type === 'way') {
                ways.push(entity);
                addIds(entity.nodes, nodes, ways, graph);
            } else {
                addIds(_.pluck(entity.members, 'id'), nodes, ways, graph);
            }
        });
    }

    // Place a vertex where the moved vertex used to be, to preserve way shape..
    function replaceMovedVertex(nodeId, wayId, graph) {
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

        var orig = iD.Node({loc: cache.startLoc[nodeId]}),
            angle = Math.abs(iD.geo.angle(orig, prev, projection) -
                iD.geo.angle(orig, next, projection)) * 180 / Math.PI;

        // Don't add orig vertex if it would just make a straight line..
        if (angle > 175 && angle < 185) return graph;

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

    function isEndpoint(id, way) {
        return !way.isClosed() && way.affix(id);
    }

    function cleanupWays(movedWays, graph) {
        _.each(movedWays, function(movedWay) {
            var movedVertices = _.filter(graph.childNodes(movedWay),
                function(vertex) { return (graph.parentWays(vertex).length === 2); });

            _.each(movedVertices, function(movedVertex) {
                var id = movedVertex.id,
                    loc = movedVertex.loc,
                    firstTime = !cache.lastEdge[id],
                    way = _.find(graph.parentWays(movedVertex),
                        function(way) { return way.id !== movedWay.id; });

                if (firstTime) {
                    graph = replaceMovedVertex(id, way.id, graph);
                    way = graph.entity(way.id);
                }

                // get closest edge on connected way..
                var nodes = _.without(graph.childNodes(way), movedVertex);
                if (way.isClosed() && way.first() === id) nodes.push(nodes[0]);

                var lastEdge = cache.lastEdge[id],
                    currEdge = iD.geo.chooseEdge(nodes, projection(loc), projection);

                // zorro happened, reorder nodes..
                if (lastEdge && lastEdge.index !== currEdge.index) {
                    way = way.removeNode(id).addNode(id, currEdge.index);
                    graph = graph.replace(way);
                }

                // snap movedVertex to edge of connected way..
                if (!isEndpoint(id, way)) {
                    graph = graph.replace(movedVertex.move(currEdge.loc));
                }

                // TODO:
                //  extend search to a connected way beyond end of way?
                //  don't mess up points between two intersections

                cache.lastEdge[id] = currEdge;

            });
        });
        return graph;
    }

    // Don't move a vertex where >2 ways meet, unless all parentWays are moving too..
    function canMove(entity, graph) {
        var parents = graph.parentWays(entity);
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
        nodes = _.filter(nodes, function(node) { return canMove(node, graph); });

        _.uniq(nodes).forEach(function(node) {
            var start = projection(node.loc),
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
