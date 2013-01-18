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
    return function(graph) {
        var node = graph.entity(nodeId),
            parents = graph.parentWays(node);

        // splitting ways at intersections TODO
        if (parents.length !== 1) return graph;

        var way = parents[0],
            idx = _.indexOf(way.nodes, nodeId);

        // Create a 'b' way that contains all of the tags in the second
        // half of this way
        var newWay = iD.Way({id: newWayId, tags: way.tags, nodes: way.nodes.slice(idx)});
        graph = graph.replace(newWay);

        // Reduce the original way to only contain the first set of nodes
        graph = graph.replace(way.update({nodes: way.nodes.slice(0, idx + 1)}));

        graph.parentRelations(way).forEach(function(relation) {
            if (relation.isRestriction()) {
                var via    = relation.memberByRole('via'),
                    member = relation.memberById(way.id);

                if (via && newWay.contains(via.id)) {
                    graph = iD.actions.UpdateRelationMember(relation.id, member.index, {id: newWay.id})(graph);
                }
            }
        });

        return graph;
    };
};
