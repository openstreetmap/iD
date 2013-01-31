iD.operations.Split = function(entityId, mode) {
    var history = mode.map.history(),
        action = iD.actions.SplitWay(entityId);

    var operation = function() {
        history.perform(action, t('operations.split.annotation'));
    };

    operation.available = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId);
        return entity.geometry(graph) === 'vertex';
    };

    operation.enabled = function() {
        var graph = history.graph();
        return action.enabled(graph);
    };

    operation.id = "split";
    operation.key = t('operations.split.key');
    operation.title = t('operations.split.title');
    operation.description = t('operations.split.description');

    return operation;
};
