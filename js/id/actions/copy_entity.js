iD.actions.CopyEntity = function(entity, deep) {
    return function(graph) {
        var newEntities = entity.copy(deep, graph);

        for (var i = 0, imax = newEntities.length; i !== imax; i++) {
            graph = graph.replace(newEntities[i]);
        }

        return graph;
    };
};
