iD.operations.Delete = function(selection, context) {
    var entityId = selection[0];

    var operation = function() {
        var entity = context.entity(entityId),
            action = {way: iD.actions.DeleteWay, node: iD.actions.DeleteNode}[entity.type],
            annotation = t('operations.delete.annotation.' + context.geometry(entityId));

        context.perform(
            action(entityId),
            annotation);
    };

    operation.available = function() {
        var entity = context.entity(entityId);
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
