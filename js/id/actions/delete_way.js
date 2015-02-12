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
                parent = parent.removeMembersWithID(wayId);
                graph = graph.replace(parent);

                if (parent.isDegenerate()) {
                    graph = iD.actions.DeleteRelation(parent.id)(graph);
                }
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

    action.disabled = function(graph) {
        var way = graph.entity(wayId);
        var reltypes = ['route','boundary','multipolygon'];
        var required_roles = { 'multipolygon': 'outer' };
        var disabled = false;
        graph.parentRelations(way)
            .forEach(function(parent) {
                if (reltypes.indexOf(parent.tags.type)>-1) {
                    if (!required_roles[parent.tags.type] || parent.containsEntityInRole(way,required_roles[parent.tags.type])) {
                        disabled = 'part_of_relation';
                    }
                }
            });
        return disabled;
    };

    return action;
};
