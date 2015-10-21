iD.geo.Turn = function(turn) {
    if (!(this instanceof iD.geo.Turn))
        return new iD.geo.Turn(turn);
    _.extend(this, turn);
};

iD.geo.Intersection = function(graph, vertexId) {
    var vertex = graph.entity(vertexId),
        parentWays = graph.parentWays(vertex),
        coincident = [],
        highways = {};

    function addHighway(way, adjacentNodeId) {
        if (highways[adjacentNodeId]) {
            coincident.push(adjacentNodeId);
        } else {
            highways[adjacentNodeId] = way;
        }
    }

    // Pre-split ways that would need to be split in
    // order to add a restriction. The real split will
    // happen when the restriction is added.
    parentWays.forEach(function(way) {
        if (!way.tags.highway || way.isArea() || way.isDegenerate())
            return;

        var isFirst = (vertexId === way.first()),
            isLast = (vertexId === way.last()),
            isAffix = (isFirst || isLast),
            isClosingNode = (isFirst && isLast);

        if (isAffix && !isClosingNode) {
            var index = (isFirst ? 1 : way.nodes.length - 2);
            addHighway(way, way.nodes[index]);

        } else {
            var splitIndex, wayA, wayB, indexA, indexB;
            if (isClosingNode) {
                splitIndex = Math.ceil(way.nodes.length / 2);  // split at midpoint
                wayA = iD.Way({id: way.id + '-a', tags: way.tags, nodes: way.nodes.slice(0, splitIndex)});
                wayB = iD.Way({id: way.id + '-b', tags: way.tags, nodes: way.nodes.slice(splitIndex)});
                indexA = 1;
                indexB = way.nodes.length - 2;
            } else {
                splitIndex = _.indexOf(way.nodes, vertex.id, 1);  // split at vertexid
                wayA = iD.Way({id: way.id + '-a', tags: way.tags, nodes: way.nodes.slice(0, splitIndex + 1)});
                wayB = iD.Way({id: way.id + '-b', tags: way.tags, nodes: way.nodes.slice(splitIndex)});
                indexA = splitIndex - 1;
                indexB = splitIndex + 1;
            }
            graph = graph.replace(wayA).replace(wayB);
            addHighway(wayA, way.nodes[indexA]);
            addHighway(wayB, way.nodes[indexB]);
        }
    });

    // remove any ways from this intersection that are coincident
    // (i.e. any adjacent node used by more than one intersecting way)
    coincident.forEach(function (n) {
        delete highways[n];
    });


    var intersection = {
        highways: highways,
        ways: _.values(highways),
        graph: graph
    };

    intersection.adjacentNodeId = function(fromWayId) {
        return _.find(_.keys(highways), function(k) {
            return highways[k].id === fromWayId;
        });
    };

    intersection.turns = function(fromNodeId) {
        var start = highways[fromNodeId];
        if (!start)
            return [];

        if (start.first() === vertex.id && start.tags.oneway === 'yes')
            return [];
        if (start.last() === vertex.id && start.tags.oneway === '-1')
            return [];

        function withRestriction(turn) {
            graph.parentRelations(graph.entity(turn.from.way)).forEach(function(relation) {
                if (relation.tags.type !== 'restriction')
                    return;

                var f = relation.memberByRole('from'),
                    t = relation.memberByRole('to'),
                    v = relation.memberByRole('via');

                if (f && f.id === turn.from.way &&
                    v && v.id === turn.via.node &&
                    t && t.id === turn.to.way) {
                    turn.restriction = relation.id;
                } else if (/^only_/.test(relation.tags.restriction) &&
                    f && f.id === turn.from.way &&
                    v && v.id === turn.via.node &&
                    t && t.id !== turn.to.way) {
                    turn.restriction = relation.id;
                    turn.indirect_restriction = true;
                }
            });

            return iD.geo.Turn(turn);
        }

        var from = {
                node: fromNodeId,
                way: start.id.split(/-(a|b)/)[0]
            },
            via = { node: vertex.id },
            turns = [];

        _.each(highways, function(end, adjacentNodeId) {
            if (end === start)
                return;

            // backward
            if (end.first() !== vertex.id && end.tags.oneway !== 'yes') {
                turns.push(withRestriction({
                    from: from,
                    via: via,
                    to: {
                        node: adjacentNodeId,
                        way: end.id.split(/-(a|b)/)[0]
                    }
                }));
            }

            // forward
            if (end.last() !== vertex.id && end.tags.oneway !== '-1') {
                turns.push(withRestriction({
                    from: from,
                    via: via,
                    to: {
                        node: adjacentNodeId,
                        way: end.id.split(/-(a|b)/)[0]
                    }
                }));
            }

        });

        // U-turn
        if (start.tags.oneway !== 'yes' && start.tags.oneway !== '-1') {
            turns.push(withRestriction({
                from: from,
                via: via,
                to: from,
                u: true
            }));
        }

        return turns;
    };

    return intersection;
};


iD.geo.inferRestriction = function(graph, from, via, to, projection) {
    var fromWay = graph.entity(from.way),
        fromNode = graph.entity(from.node),
        toWay = graph.entity(to.way),
        toNode = graph.entity(to.node),
        viaNode = graph.entity(via.node),
        fromOneWay = (fromWay.tags.oneway === 'yes' && fromWay.last() === via.node) ||
            (fromWay.tags.oneway === '-1' && fromWay.first() === via.node),
        toOneWay = (toWay.tags.oneway === 'yes' && toWay.first() === via.node) ||
            (toWay.tags.oneway === '-1' && toWay.last() === via.node),
        angle = iD.geo.angle(viaNode, fromNode, projection) -
                iD.geo.angle(viaNode, toNode, projection);

    angle = angle * 180 / Math.PI;

    while (angle < 0)
        angle += 360;

    if (fromNode === toNode)
        return 'no_u_turn';
    if ((angle < 23 || angle > 336) && fromOneWay && toOneWay)
        return 'no_u_turn';
    if (angle < 158)
        return 'no_right_turn';
    if (angle > 202)
        return 'no_left_turn';

    return 'no_straight_on';
};
