iD.operations.Straighten = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        action = iD.actions.Straighten(entityId, context.projection);

    var operation = function() {
        var annotation = t('operations.straighten.annotation');
        context.perform(action, annotation);
    };

    operation.available = function() {
        return selectedIDs.length === 1 &&
            context.entity(entityId).type === 'way' &&
            _.uniq(context.entity(entityId).nodes).length > 2;
    };

    operation.disabled = function() {
        return action.disabled(context.graph());
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.straighten.' + disable) :
            t('operations.straighten.description');
    };

    operation.id = "straighten";
    operation.keys = [t('operations.straighten.key')];
    operation.title = "title";
    operation.description = "description";

    return operation;
};
