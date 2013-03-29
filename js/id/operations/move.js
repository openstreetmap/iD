iD.operations.Move = function(selection, context) {
    var operation = function() {
        context.enter(iD.modes.Move(context, selection));
    };

    operation.available = function() {
        return selection.length > 1 ||
            context.entity(selection[0]).type !== 'node';
    };

    operation.disabled = function() {
        return iD.actions.Move(selection)
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
