iD.operations.Rotate = function(selection, context) {
    var entityId = selection[0];

    var operation = function() {
        context.enter(iD.modes.RotateWay(context, entityId));
    };

    operation.available = function() {
        return selection.length === 1 &&
            context.entity(entityId).type === 'way' &&
            context.entity(entityId).geometry() === 'area';
    };

    operation.enabled = function() {
        return true;
    };

    operation.id = "rotate";
    operation.keys = [t('operations.rotate.key')];
    operation.title = t('operations.rotate.title');
    operation.description = t('operations.rotate.description');

    return operation;
};
