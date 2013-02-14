iD.operations.Split = function(selection, context) {
    var entityId = selection[0],
        action = iD.actions.Split(entityId);

    var operation = function() {
        var annotation = t('operations.split.annotation'),
            difference = context.perform(action, annotation);
        context.enter(iD.modes.Select(context, difference.extantIDs()));
    };

    operation.available = function() {
        return selection.length === 1 &&
            context.geometry(entityId) === 'vertex';
    };

    operation.enabled = function() {
        return action.enabled(context.graph());
    };

    operation.id = "split";
    operation.key = t('operations.split.key');
    operation.title = t('operations.split.title');
    operation.description = t('operations.split.description');

    return operation;
};
