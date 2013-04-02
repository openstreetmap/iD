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
            _.uniq(context.entity(entityId).nodes).length > 2;
    };

    operation.disabled = function() {
        return action.disabled(context.graph());
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.orthogonalize.' + disable) :
            t('operations.orthogonalize.description');
    };

    operation.id = "orthogonalize";
    operation.keys = [t('operations.orthogonalize.key')];
    operation.title = t('operations.orthogonalize.title');
    operation.description = t('operations.orthogonalize.description');

    return operation;
};
