iD.operations.Rotate = function(selectedIDs, context) {
    var entityId = selectedIDs[0];

    var operation = function() {
        context.enter(iD.modes.RotateWay(context, entityId));
    };

    operation.available = function() {
        return selectedIDs.length === 1 &&
            context.entity(entityId).type === 'way' &&
            context.geometry(entityId) === 'area';
    };

    operation.disabled = function() {
        return false;
    };

    operation.tooltip = function() {
        return t('operations.rotate.description');
    };

    operation.id = "rotate";
    operation.keys = [t('operations.rotate.key')];
    operation.title = t('operations.rotate.title');

    return operation;
};
