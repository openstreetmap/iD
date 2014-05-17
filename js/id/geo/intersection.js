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
                wayA = iD.Way({id: way.id + '.a', tags: way.tags, nodes: way.nodes.slice(0, idx + 1)}),
                wayB = iD.Way({id: way.id + '.b', tags: way.tags, nodes: way.nodes.slice(idx)});

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

    intersection.turns = function(wayId) {
        if (!wayId)
            return [];

        var way = graph.entity(wayId);
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
                }
            });

            return iD.geo.Turn(turn);
        }

        var from = {node: way.nodes[way.first() === vertex.id ? 1 : way.nodes.length - 2], way: way.id},
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
                    to: {node: parent.nodes[index - 1], way: parent.id.split('.')[0]}
                }));
            }

            // forward
            if (parent.last() !== vertex.id && parent.tags.oneway !== '-1') {
                turns.push(withRestriction({
                    from: from,
                    via: via,
                    to: {node: parent.nodes[index + 1], way: parent.id.split('.')[0]}
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
