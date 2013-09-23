iD.operations.Scale = function(selectedIDs, context) {
    var entityId = selectedIDs[0];

    var operation = function() {
        context.enter(iD.modes.Scale(context, entityId));
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
        return t('operations.scale.description');
    };

    operation.id = "scale";
    operation.keys = [t('operations.scale.key')];
    operation.title = t('operations.scale.title');

    return operation;
};
