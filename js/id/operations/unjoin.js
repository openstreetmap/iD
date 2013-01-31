iD.operations.Unjoin = function(selection, context) {
    var entityId = selection[0],
        action = iD.actions.UnjoinNode(entityId);

    var operation = function() {
        context.perform(action, 'Unjoined lines.');
    };

    operation.available = function() {
        return selection.length === 1 &&
            context.geometry(entityId) === 'vertex';
    };

    operation.enabled = function() {
        return action.enabled(context.graph());
    };

    operation.id = "unjoin";
    operation.key = t('operations.unjoin.key');
    operation.title = t('operations.unjoin.title');
    operation.description = t('operations.unjoin.description');

    return operation;
};
