iD.operations.Delete = function(selection, mode) {
    var entityId = selection[0],
        history = mode.map.history();

    var operation = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId),
            action = {way: iD.actions.DeleteWay, node: iD.actions.DeleteNode}[entity.type],
            annotation = t('operations.delete.annotation.' + entity.geometry(graph));

        history.perform(
            action(entityId),
            annotation);
    };

    operation.available = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId);
        return selection.length === 1 &&
            (entity.type === 'way' || entity.type === 'node');
    };

    operation.enabled = function() {
        return true;
    };

    operation.id = "delete";
    operation.key = t('operations.delete.key');
    operation.title = t('operations.delete.title');
    operation.description = t('operations.delete.description');

    return operation;
};
