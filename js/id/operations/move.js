iD.operations.Move = function(selection, context) {

    var operation = function() {
        context.enter(iD.modes.Move(context, selection));
    };

    operation.available = function() {
        return selection.length > 1 ||
            context.entity(selection[0]).type !== 'node';
    };

    operation.enabled = function() {
        return true;
    };

    operation.id = "move";
    operation.keys = [t('operations.move.key')];
    operation.title = t('operations.move.title');
    operation.description = t('operations.move.description');

    return operation;
};
