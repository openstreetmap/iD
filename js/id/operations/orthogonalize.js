iD.operations.Orthogonalize = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        geometry = context.geometry(entityId),
        action = iD.actions.Orthogonalize(entityId, context.projection);

    function operation() {
        var annotation = t('operations.orthogonalize.annotation.' + geometry);
        context.perform(action, annotation);
    }

    operation.available = function() {
        var entity = context.entity(entityId);
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            entity.isClosed() &&
            _.uniq(entity.nodes).length > 2;
    };

    operation.disabled = function() {
        return action.disabled(context.graph());
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.orthogonalize.' + disable) :
            t('operations.orthogonalize.description.' + geometry);
    };

    operation.id = "orthogonalize";
    operation.keys = [t('operations.orthogonalize.key')];
    operation.title = t('operations.orthogonalize.title');

    return operation;
};
