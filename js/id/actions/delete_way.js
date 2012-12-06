// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteWayAction.as
iD.actions.DeleteWay = function(wayId) {
    return function(graph) {
        var way = graph.entity(wayId);

        graph.parentRelations(wayId)
            .forEach(function(parent) {
                graph = iD.actions.RemoveRelationMember(parent.id, wayId)(graph);
            });

        way.nodes.forEach(function (nodeId) {
            var node = graph.entity(nodeId);

            graph = iD.actions.RemoveWayNode(wayId, nodeId)(graph);

            if (!graph.parentWays(nodeId).length && !graph.parentRelations(nodeId).length) {
                if (!node.hasInterestingTags()) {
                    graph = graph.remove(node);
                } else {
                    graph = graph.replace(node.update({_poi: true}));
                }
            }
        });

        return graph.remove(way, 'removed a way');
    };
};
