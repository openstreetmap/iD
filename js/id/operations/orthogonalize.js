iD.operations.Orthogonalize = function(selection, context) {
    var entityId = selection[0],
        action = iD.actions.Orthogonalize(entityId, context.projection);

    var operation = function() {
        var annotation = t('operations.orthogonalize.annotation.' + context.geometry(entityId));
        context.perform(action, annotation);
    };

    operation.available = function() {
        return selection.length === 1 &&
            context.entity(entityId).type === 'way' &&
            _.uniq(context.entity(entityId).nodes).length > 3;
    };

    operation.enabled = function() {
        return action.enabled(context.graph());
    };

    operation.id = "orthogonalize";
    operation.keys = [t('operations.orthogonalize.key')];
    operation.title = t('operations.orthogonalize.title');
    operation.description = t('operations.orthogonalize.description');

    return operation;
};
