iD.actions.DeleteMultiple = function(ids) {
    return function(graph) {
        var actions = {
            way: iD.actions.DeleteWay,
            node: iD.actions.DeleteNode,
            relation: iD.actions.DeleteRelation
        };

        ids.forEach(function (id) {
            var entity = graph.entity(id);
            if (entity) { // It may have been deleted aready.
                graph = actions[entity.type](id)(graph);
            }
        });

        return graph;
    };
};
