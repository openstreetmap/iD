iD.operations.Split = function(selection, context) {
    var entityId = selection[0],
        action = iD.actions.SplitWay(entityId);

    var operation = function() {
        context.perform(action, t('operations.split.annotation'));
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
