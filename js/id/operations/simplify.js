iD.operations.Simplify = function(selection, context) {
    var entityId = selection[0],
        action = iD.actions.Simplify(entityId, context.projection);

    var operation = function() {
        var annotation = t('operations.simplify.annotation.' + context.geometry(entityId));
        context.perform(action, annotation);
    };

    operation.available = function() {
        return selection.length === 1 &&
            context.entity(entityId).type === 'way';
    };

    operation.enabled = function() {
        return action.enabled(context.graph());
    };

    operation.id = "simplify";
    operation.key = t('operations.simplify.key');
    operation.title = t('operations.simplify.title');
    operation.description = t('operations.simplify.description');

    return operation;
};
