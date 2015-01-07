iD.actions.CopyEntity = function(entity, deep) {
    var newEntities = [];

    var action = function(graph) {
        newEntities = entity.copy(deep, graph);

        for (var i = 0; i < newEntities.length; i++) {
            graph = graph.replace(newEntities[i]);
        }

        return graph;
    };

    action.newEntities = function() {
        return newEntities;
    };

    return action;
};
