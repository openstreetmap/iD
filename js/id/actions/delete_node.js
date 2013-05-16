// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteNodeAction.as
iD.actions.DeleteNode = function(nodeId) {
    var action = function(graph) {
        var node = graph.entity(nodeId);

        graph.parentWays(node)
            .forEach(function(parent) {
                parent = parent.removeNode(nodeId);
                graph = graph.replace(parent);

                if (parent.isDegenerate()) {
                    graph = iD.actions.DeleteWay(parent.id)(graph);
                }
            });

        graph.parentRelations(node)
            .forEach(function(parent) {
                graph = graph.replace(parent.removeMember(nodeId));
            });

        return graph.remove(node);
    };

    action.disabled = function() {
        return false;
    };

    return action;
};
