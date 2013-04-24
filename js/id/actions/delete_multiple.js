iD.actions.DeleteMultiple = function(ids) {
    return function(graph) {
        var actions = {
            way: iD.actions.DeleteWay,
            node: iD.actions.DeleteNode,
            relation: iD.actions.DeleteRelation
        };

        ids.forEach(function(id) {
            if (graph.hasEntity(id)) { // It may have been deleted aready.
                graph = actions[graph.entity(id).type](id)(graph);
            }
        });

        return graph;
    };
};
