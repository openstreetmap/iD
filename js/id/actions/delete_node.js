// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteNodeAction.as
iD.actions.DeleteNode = function(nodeId) {
    return function(graph) {
        var node = graph.entity(nodeId);

        graph.parentWays(nodeId)
            .forEach(function(parent) {
                graph = iD.actions.RemoveWayNode(parent.id, nodeId)(graph);
            });

        graph.parentRelations(nodeId)
            .forEach(function(parent) {
                graph = iD.actions.RemoveRelationMember(parent.id, nodeId)(graph);
            });

        return graph.remove(node);
    };
};
