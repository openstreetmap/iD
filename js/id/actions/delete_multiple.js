iD.actions.DeleteMultiple = function(ids) {
    return function(graph) {
        var actions = {
            way: iD.actions.DeleteWay,
            node: iD.actions.DeleteNode,
            relation: iD.actions.DeleteRelation
        };

        ids.forEach(function (id) {
            graph = actions[graph.entity(id).type](id)(graph);
        });

        return graph;
    };
};
