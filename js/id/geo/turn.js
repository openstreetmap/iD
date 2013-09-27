iD.geo.turns = function(graph, entityID) {
    var way = graph.entity(entityID);
    if (way.type !== 'way' || !way.tags.highway || way.isArea())
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

        return turn;
    }

    var turns = [];

    [way.first(), way.last()].forEach(function(nodeID) {
        var node = graph.entity(nodeID);
        graph.parentWays(node).forEach(function(parent) {
            if (parent === way || parent.isDegenerate() || !parent.tags.highway)
                return;
            if (way.first() === node.id && way.tags.oneway === 'yes')
                return;
            if (way.last() === node.id && way.tags.oneway === '-1')
                return;

            var index = parent.nodes.indexOf(node.id);

            // backward
            if (parent.first() !== node.id && parent.tags.oneway !== 'yes') {
                turns.push(withRestriction({
                    from: way,
                    to: parent,
                    via: node,
                    toward: graph.entity(parent.nodes[index - 1])
                }));
            }

            // forward
            if (parent.last() !== node.id && parent.tags.oneway !== '-1') {
                turns.push(withRestriction({
                    from: way,
                    to: parent,
                    via: node,
                    toward: graph.entity(parent.nodes[index + 1])
                }));
            }
       });
    });

    return turns;
};
