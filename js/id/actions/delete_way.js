// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteWayAction.as
iD.actions.DeleteWay = function(wayId) {
    var action = function(graph) {
        var way = graph.entity(wayId);

        graph.parentRelations(way)
            .forEach(function(parent) {
                graph = graph.replace(parent.removeMember(wayId));
            });

        way.nodes.forEach(function (nodeId) {
            var node = graph.entity(nodeId);

            // Circular ways include nodes more than once, so they
            // can be deleted on earlier iterations of this loop.
            if (!node) return;

            graph = graph.replace(way.removeNode(nodeId));

            if (!graph.parentWays(node).length &&
                !graph.parentRelations(node).length) {
                if (!node.hasInterestingTags()) {
                    graph = graph.remove(node);
                }
            }
        });

        return graph.remove(way);
    };

    action.enabled = function(graph) {
        return true;
    };

    return action;
};
