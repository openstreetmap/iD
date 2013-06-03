iD.operations.Circularize = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        geometry = context.geometry(entityId),
        action = iD.actions.Circularize(entityId, context.projection);

    var operation = function() {
        var annotation = t('operations.circularize.annotation.' + geometry);
        context.perform(action, annotation);
    };

    operation.available = function() {
        return selectedIDs.length === 1 &&
            context.entity(entityId).type === 'way';
    };

    operation.disabled = function() {
        return action.disabled(context.graph());
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.circularize.' + disable) :
            t('operations.circularize.description.' + geometry);
    };

    operation.id = "circularize";
    operation.keys = [t('operations.circularize.key')];
    operation.title = t('operations.circularize.title');

    return operation;
};
