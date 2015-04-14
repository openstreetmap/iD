iD.actions.CopyEntity = function(id, fromGraph, deep) {
    var newEntities = [];

    var action = function(graph) {
        var entity = fromGraph.entity(id);

        newEntities = entity.copy(deep, fromGraph);

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
