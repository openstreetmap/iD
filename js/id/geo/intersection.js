iD.geo.Turn = function(turn) {
    turn = _.clone(turn);

    turn.key = function() {
        var components = [turn.from, turn.to, turn.via, turn.toward];
        if (turn.restriction)
            components.push(turn.restriction);
        return components.map(iD.Entity.key).join('-');
    };

    turn.angle = function(projection) {
        var v = projection(turn.via.loc),
            t = projection(turn.toward.loc);

        return Math.atan2(t[1] - v[1], t[0] - v[0]);
    };

    return turn;
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

    intersection.turns = function(wayId) {
        if (!wayId)
            return [];

        var way = graph.entity(wayId);
        if (way.first() === vertex.id && way.tags.oneway === 'yes')
            return [];
        if (way.last() === vertex.id && way.tags.oneway === '-1')
            return [];

        function withRestriction(turn) {
            graph.parentRelations(turn.from).forEach(function(relation) {
                if (relation.tags.type !== 'restriction')
                    return;

                var f = relation.memberByRole('from'),
                    t = relation.memberByRole('to'),
                    v = relation.memberByRole('via');

                if (f && f.id === turn.from.id &&
                    t && t.id === turn.to.id &&
                    v && v.id === turn.via.id) {
                    turn.restriction = relation;
                }
            });

            return iD.geo.Turn(turn);
        }

        var turns = [];

        highways.forEach(function(parent) {
            if (parent === way)
                return;

            var index = parent.nodes.indexOf(vertex.id);

            // backward
            if (parent.first() !== vertex.id && parent.tags.oneway !== 'yes') {
                turns.push(withRestriction({
                    from: way,
                    to: parent,
                    via: vertex,
                    toward: graph.entity(parent.nodes[index - 1])
                }));
            }

            // forward
            if (parent.last() !== vertex.id && parent.tags.oneway !== '-1') {
                turns.push(withRestriction({
                    from: way,
                    to: parent,
                    via: vertex,
                    toward: graph.entity(parent.nodes[index + 1])
                }));
            }
        });

        return turns;
    };

    return intersection;
};
