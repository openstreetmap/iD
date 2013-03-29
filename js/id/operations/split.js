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

    operation.disabled = function() {
        return action.disabled(context.graph());
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.split.' + disable) :
            t('operations.split.description');
    };

    operation.id = "split";
    operation.keys = [t('operations.split.key')];
    operation.title = t('operations.split.title');

    return operation;
};
