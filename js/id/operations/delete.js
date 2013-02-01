iD.operations.Delete = function(selection, context) {
    var entityId = selection[0];

    var operation = function() {
        var entity = context.entity(entityId),
            action = {
                way: iD.actions.DeleteWay,
                node: iD.actions.DeleteNode,
                relation: iD.actions.DeleteRelation
            }[entity.type],
            annotation = t('operations.delete.annotation.' + context.geometry(entityId));

        context.perform(
            action(entityId),
            annotation);
    };

    operation.available = function() {
        return selection.length === 1;
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
