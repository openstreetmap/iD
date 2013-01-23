// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteNodeAction.as
iD.actions.DeleteNode = function(nodeId) {
    return function(graph) {
        var node = graph.entity(nodeId);

        graph.parentWays(node)
            .forEach(function(parent) {
                graph = graph.replace(parent.removeNode(nodeId));
            });

        graph.parentRelations(node)
            .forEach(function(parent) {
                graph = graph.replace(parent.removeMember(nodeId));
            });

        return graph.remove(node);
    };
};
