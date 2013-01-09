// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteWayAction.as
iD.actions.DeleteWay = function(wayId) {
    return function(graph) {
        var way = graph.entity(wayId);

        graph.parentRelations(way)
            .forEach(function(parent) {
                graph = iD.actions.RemoveRelationMember(parent.id, wayId)(graph);
            });

        way.nodes.forEach(function (nodeId) {
            var node = graph.entity(nodeId);

            // Circular ways include nodes more than once, so they
            // can be deleted on earlier iterations of this loop.
            if (!node) return;

            graph = iD.actions.RemoveWayNode(wayId, nodeId)(graph);

            if (!graph.parentWays(node).length &&
                !graph.parentRelations(node).length) {
                if (!node.hasInterestingTags()) {
                    graph = graph.remove(node);
                } else {
                    graph = graph.replace(node.update({_poi: true}));
                }
            }
        });

        return graph.remove(way);
    };
};
