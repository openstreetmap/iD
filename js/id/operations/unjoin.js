iD.operations.Unjoin = function(selection, mode) {
    var entityId = selection[0],
        history = mode.map.history(),
        action = iD.actions.UnjoinNode(entityId);

    var operation = function() {
        history.perform(action, 'Unjoined lines.');
    };

    operation.available = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId);
        return selection.length === 1 &&
            entity.geometry(graph) === 'vertex';
    };

    operation.enabled = function() {
        var graph = history.graph();
        return action.enabled(graph);
    };

    operation.id = "unjoin";
    operation.key = t('operations.unjoin.key');
    operation.title = t('operations.unjoin.title');
    operation.description = t('operations.unjoin.description');

    return operation;
};
