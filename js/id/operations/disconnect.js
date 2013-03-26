iD.operations.Disconnect = function(selection, context) {
    var entityId = selection[0],
        action = iD.actions.Disconnect(entityId);

    var operation = function() {
        context.perform(action, t('operations.disconnect.annotation'));
    };

    operation.available = function() {
        return selection.length === 1 &&
            context.geometry(entityId) === 'vertex';
    };

    operation.enabled = function() {
        return action.enabled(context.graph());
    };

    operation.id = "disconnect";
    operation.keys = [t('operations.disconnect.key')];
    operation.title = t('operations.disconnect.title');
    operation.description = t('operations.disconnect.description');

    return operation;
};
