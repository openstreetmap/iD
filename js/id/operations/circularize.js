iD.operations.Circularize = function(entityId, mode) {
    var history = mode.map.history(),
        action = iD.actions.Circularize(entityId, mode.map);

    var operation = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId),
            annotation = t('operations.circularize.annotation.' + entity.geometry(graph));

        history.perform(action, annotation);
    };

    operation.available = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId);
        return entity.type === 'way';
    };

    operation.enabled = function() {
        var graph = history.graph();
        return action.enabled(graph);
    };

    operation.id = "circularize";
    operation.key = t('operations.circularize.key');
    operation.title = t('operations.circularize.title');
    operation.description = t('operations.circularize.description');

    return operation;
};
