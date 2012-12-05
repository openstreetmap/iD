// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteNodeAction.as
iD.actions.DeleteNode = function(node) {
    return function(graph) {
        graph.parentWays(node.id)
            .forEach(function(parent) {
                graph = iD.actions.RemoveWayNode(parent, node)(graph);
            });

        graph.parentRelations(node.id)
            .forEach(function(parent) {
                graph = iD.actions.RemoveRelationMember(parent, node)(graph);
            });

        return graph.remove(node, 'removed a node');
    };
};
