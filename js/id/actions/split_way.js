// Split a way at the given node.
//
// For testing convenience, accepts an ID to assign to the new way.
// Normally, this will be undefined and the way will automatically
// be assigned a new ID.
//
// Reference:
//   https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/SplitWayAction.as
//
iD.actions.SplitWay = function(nodeId, newWayId) {
    function candidateWays(graph) {
        var node = graph.entity(nodeId),
            parents = graph.parentWays(node);

        return parents.filter(function (parent) {
            return parent.first() !== nodeId &&
                   parent.last()  !== nodeId;
        })
    }

    var action = function(graph) {
        if (!action.permitted(graph))
            return graph;

        var way = candidateWays(graph)[0],
            idx = _.indexOf(way.nodes, nodeId);

        // Create a 'b' way that contains all of the tags in the second
        // half of this way
        var newWay = iD.Way({id: newWayId, tags: way.tags, nodes: way.nodes.slice(idx)});
        graph = graph.replace(newWay);

        // Reduce the original way to only contain the first set of nodes
        graph = graph.replace(way.update({nodes: way.nodes.slice(0, idx + 1)}));

        graph.parentRelations(way).forEach(function(relation) {
            if (relation.isRestriction()) {
                var via = relation.memberByRole('via');
                if (via && newWay.contains(via.id)) {
                    graph = iD.actions.UpdateRelationMember(
                        relation.id,
                        {id: newWay.id},
                        relation.memberById(way.id).index
                    )(graph);
                }
            } else {
                var role = relation.memberById(way.id).role,
                    last = newWay.last(),
                    i = relation.memberById(way.id).index,
                    j;

                for (j = 0; j < relation.members.length; j++) {
                    if (relation.members[j].type === 'way' && graph.entity(relation.members[j].id).contains(last)) {
                        break;
                    }
                }

                graph = iD.actions.AddRelationMember(
                    relation.id,
                    {id: newWay.id, type: 'way', role: role},
                    i <= j ? i + 1 : i
                )(graph);
            }
        });

        return graph;
    };

    action.permitted = function(graph) {
        return candidateWays(graph).length === 1;
    };

    return action;
};
