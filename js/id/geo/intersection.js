iD.geo.Turn = function(turn) {
    if (!(this instanceof iD.geo.Turn))
        return new iD.geo.Turn(turn);
    _.extend(this, turn);
};

iD.geo.Intersection = function(graph, vertexId) {
    var vertex = graph.entity(vertexId),
        highways = [];

    // Pre-split ways that would need to be split in
    // order to add a restriction. The real split will
    // happen when the restriction is added.
    graph.parentWays(vertex).forEach(function(way) {
        if (!way.tags.highway || way.isArea() || way.isDegenerate())
            return;

        if (way.affix(vertexId)) {
            highways.push(way);
        } else {
            var idx = _.indexOf(way.nodes, vertex.id, 1),
                wayA = iD.Way({id: way.id + '-a', tags: way.tags, nodes: way.nodes.slice(0, idx + 1)}),
                wayB = iD.Way({id: way.id + '-b', tags: way.tags, nodes: way.nodes.slice(idx)});

            graph = graph.replace(wayA);
            graph = graph.replace(wayB);

            highways.push(wayA);
            highways.push(wayB);
        }
    });

    var intersection = {
        highways: highways,
        graph: graph
    };

    intersection.turns = function(fromNodeID) {
        if (!fromNodeID)
            return [];

        var way = _.find(highways, function(way) { return way.contains(fromNodeID); });
        if (way.first() === vertex.id && way.tags.oneway === 'yes')
            return [];
        if (way.last() === vertex.id && way.tags.oneway === '-1')
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
                node: way.nodes[way.first() === vertex.id ? 1 : way.nodes.length - 2],
                way: way.id.split(/-(a|b)/)[0]
            },
            via = {node: vertex.id},
            turns = [];

        highways.forEach(function(parent) {
            if (parent === way)
                return;

            var index = parent.nodes.indexOf(vertex.id);

            // backward
            if (parent.first() !== vertex.id && parent.tags.oneway !== 'yes') {
                turns.push(withRestriction({
                    from: from,
                    via: via,
                    to: {node: parent.nodes[index - 1], way: parent.id.split(/-(a|b)/)[0]}
                }));
            }

            // forward
            if (parent.last() !== vertex.id && parent.tags.oneway !== '-1') {
                turns.push(withRestriction({
                    from: from,
                    via: via,
                    to: {node: parent.nodes[index + 1], way: parent.id.split(/-(a|b)/)[0]}
                }));
            }
        });

        // U-turn
        if (way.tags.oneway !== 'yes' && way.tags.oneway !== '-1') {
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
