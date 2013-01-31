iD.operations.Move = function(selection, context) {
    var entityId = selection[0];

    var operation = function() {
        context.enter(iD.modes.MoveWay(context, entityId));
    };

    operation.available = function() {
        return selection.length === 1 &&
            context.entity(entityId).type === 'way';
    };

    operation.enabled = function() {
        return true;
    };

    operation.id = "move";
    operation.key = t('operations.move.key');
    operation.title = t('operations.move.title');
    operation.description = t('operations.move.description');

    return operation;
};
