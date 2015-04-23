// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
iD.actions.Move = function(moveIds, tryDelta, projection, cache) {
    var delta = tryDelta;

    function vecAdd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
    function vecSub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }

    function setupCache(graph) {
        function canMove(nodeId) {
            var parents = _.pluck(graph.parentWays(graph.entity(nodeId)), 'id');
            if (parents.length < 3) return true;

            // Don't move a vertex where >2 ways meet, unless all parentWays are moving too..
            var parentsMoving = _.all(parents, function(id) { return cache.moving[id]; });
            if (!parentsMoving) delete cache.moving[nodeId];

            return parentsMoving;
        }

        function cacheEntities(ids) {
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
                    cacheEntities(entity.nodes);
                } else {
                    cacheEntities(_.pluck(entity.members, 'id'));
                }
            });
        }

        function cacheIntersections(ids) {
            function isEndpoint(way, id) { return !way.isClosed() && !!way.affix(id); }

            _.each(ids, function(id) {
                // consider only intersections with 1 moved and 1 unmoved way.
                _.each(graph.childNodes(graph.entity(id)), function(node) {
                    var parents = graph.parentWays(node);
                    if (parents.length !== 2) return;

                    var moved = graph.entity(id),
                        unmoved = _.find(parents, function(way) { return !cache.moving[way.id]; });
                    if (!unmoved) return;

                    // exclude ways that are overly connected..
                    if (_.intersection(moved.nodes, unmoved.nodes).length > 2) return;

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
            cache.nodes = _.filter(cache.nodes, canMove);

            cache.ok = true;
        }
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
            end = projection.invert(vecAdd(start, delta));
        } else {
            end = cache.startLoc[nodeId];
        }
        orig = orig.move(end);

        var angle = Math.abs(iD.geo.angle(orig, prev, projection) -
                iD.geo.angle(orig, next, projection)) * 180 / Math.PI;

        // Don't add orig vertex if it would just make a straight line..
        if (angle > 175 && angle < 185) return graph;

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

    // Reorder nodes around intersections that have moved..
    function unZorroIntersection(intersection, graph) {
        var vertex = graph.entity(intersection.nodeId),
            way1 = graph.entity(intersection.movedId),
            way2 = graph.entity(intersection.unmovedId),
            isEP1 = intersection.movedIsEP,
            isEP2 = intersection.unmovedIsEP;

        // don't move the vertex if it is the endpoint of both ways.
        if (isEP1 && isEP2) return graph;

        var nodes1 = _.without(graph.childNodes(way1), vertex),
            nodes2 = _.without(graph.childNodes(way2), vertex);

        if (way1.isClosed() && way1.first() === vertex.id) nodes1.push(nodes1[0]);
        if (way2.isClosed() && way2.first() === vertex.id) nodes2.push(nodes2[0]);

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
        _.each(cache.intersection, function(obj) {
            graph = replaceMovedVertex(obj.nodeId, obj.movedId, graph, delta);
            graph = replaceMovedVertex(obj.nodeId, obj.unmovedId, graph, null);
            graph = unZorroIntersection(obj, graph);
        });

        return graph;
    }

    // check if moving way endpoint can cross an unmoved way, if so limit delta..
    function limitDelta(graph) {
        _.each(cache.intersection, function(obj) {
            if (!obj.movedIsEP) return;

            var node = graph.entity(obj.nodeId),
                start = projection(node.loc),
                end = vecAdd(start, delta),
                movedNodes = graph.childNodes(graph.entity(obj.movedId)),
                movedPath = _.map(_.pluck(movedNodes, 'loc'),
                    function(loc) { return vecAdd(projection(loc), delta); }),
                unmovedNodes = graph.childNodes(graph.entity(obj.unmovedId)),
                unmovedPath = _.map(_.pluck(unmovedNodes, 'loc'), projection),
                hits = iD.geo.pathIntersections(movedPath, unmovedPath);

            for (var i = 0; i < hits.length; i++) {
                if (_.isEqual(hits[i], end)) continue;
                var edge = iD.geo.chooseEdge(unmovedNodes, end, projection);
                delta = vecSub(projection(edge.loc), start);
            }
        });
    }


    var action = function(graph) {
        if (delta[0] === 0 && delta[1] === 0) return graph;

        setupCache(graph);

        if (!_.isEmpty(cache.intersection)) {
            limitDelta(graph);
        }

        _.each(cache.nodes, function(id) {
            var node = graph.entity(id),
                start = projection(node.loc),
                end = vecAdd(start, delta);
            graph = graph.replace(node.move(projection.invert(end)));
        });

        if (!_.isEmpty(cache.intersection)) {
            graph = cleanupIntersections(graph);
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

    action.delta = function() {
        return delta;
    };

    return action;
};
