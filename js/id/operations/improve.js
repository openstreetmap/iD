iD.operations.ImproveWay = function(selection, context) {
    var entityId = selection[0];

    var operation = function() {
        context.enter(iD.modes.ImproveWay(context, entityId));
    };

    operation.available = function() {
        return selection.length === 1 &&
            context.entity(entityId).type === 'way';
    };

    operation.disabled = function() {
        return false;
    };

    operation.tooltip = function() {
        return t('operations.improve.description.' + context.geometry(entityId));
    };

    operation.id = "improve";
    operation.keys = [t('operations.improve.key')];
    operation.title = t('operations.improve.title');

    return operation;
};
