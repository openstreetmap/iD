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

    operation.disabled = function() {
        return action.disabled(context.graph());
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.disconnect.' + disable) :
            t('operations.disconnect.description');
    };

    operation.id = "disconnect";
    operation.keys = [t('operations.disconnect.key')];
    operation.title = t('operations.disconnect.title');

    return operation;
};
