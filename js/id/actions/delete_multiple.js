iD.actions.DeleteMultiple = function(ids) {
    var actions = {
        way: iD.actions.DeleteWay,
        node: iD.actions.DeleteNode,
        relation: iD.actions.DeleteRelation
    };

    var action = function(graph) {
        ids.forEach(function(id) {
            if (graph.hasEntity(id)) { // It may have been deleted aready.
                graph = actions[graph.entity(id).type](id)(graph);
            }
        });

        return graph;
    };

    action.disabled = function(graph) {
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i],
                disabled = actions[graph.entity(id).type](id).disabled(graph);
            if (disabled) return disabled;
        }
    };

    return action;
};
