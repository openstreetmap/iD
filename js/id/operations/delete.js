iD.operations.Delete = function(selection, context) {
    var action = iD.actions.DeleteMultiple(selection);

    var operation = function() {
        var annotation;

        if (selection.length === 1) {
            annotation = t('operations.delete.annotation.' + context.geometry(selection[0]));
        } else {
            annotation = t('operations.delete.annotation.multiple', {n: selection.length});
        }

        context.perform(
            action,
            annotation);

        context.enter(iD.modes.Browse(context));
    };

    operation.available = function() {
        return true;
    };

    operation.disabled = function() {
        return action.disabled(context.graph());
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.delete.' + disable) :
            t('operations.delete.description');
    };

    operation.id = "delete";
    operation.keys = [iD.ui.cmd('⌫'), iD.ui.cmd('⌦')];
    operation.title = t('operations.delete.title');

    return operation;
};
