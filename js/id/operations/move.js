iD.operations.Move = function(selectedIDs, context) {
    var operation = function() {
        context.enter(iD.modes.Move(context, selectedIDs));
    };

    operation.available = function() {
        return selectedIDs.length > 1 ||
            context.entity(selectedIDs[0]).type !== 'node';
    };

    operation.disabled = function() {
        return iD.actions.Move(selectedIDs)
            .disabled(context.graph());
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.move.' + disable) :
            t('operations.move.description');
    };

    operation.id = "move";
    operation.keys = [t('operations.move.key')];
    operation.title = t('operations.move.title');

    return operation;
};
