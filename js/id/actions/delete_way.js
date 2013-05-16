// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteWayAction.as
iD.actions.DeleteWay = function(wayId) {
    function deleteNode(node, graph) {
        return !graph.parentWays(node).length &&
            !graph.parentRelations(node).length &&
            !node.hasInterestingTags();
    }

    var action = function(graph) {
        var way = graph.entity(wayId);

        graph.parentRelations(way)
            .forEach(function(parent) {
                graph = graph.replace(parent.removeMembersWithID(wayId));
            });

        _.uniq(way.nodes).forEach(function(nodeId) {
            graph = graph.replace(way.removeNode(nodeId));

            var node = graph.entity(nodeId);
            if (deleteNode(node, graph)) {
                graph = graph.remove(node);
            }
        });

        return graph.remove(way);
    };

    action.disabled = function() {
        return false;
    };

    return action;
};
