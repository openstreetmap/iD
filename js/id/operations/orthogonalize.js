iD.operations.Orthogonalize = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        entity = context.entity(entityId),
        extent = entity.extent(context.graph()),
        geometry = context.geometry(entityId),
        action = iD.actions.Orthogonalize(entityId, context.projection);

    var operation = function() {
        var annotation = t('operations.orthogonalize.annotation.' + geometry);
        context.perform(action, annotation);
    };

    operation.available = function() {
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            entity.isClosed() &&
            _.uniq(entity.nodes).length > 2;
    };

    operation.disabled = function() {
        var reason;
        if (extent.percentContainedIn(context.extent()) < 0.8) {
            reason = 'too_large';
        } else if (context.hasHiddenConnections(entityId)) {
            reason = 'connected_to_hidden';
        }
        return action.disabled(context.graph()) || reason;
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.orthogonalize.' + disable) :
            t('operations.orthogonalize.description.' + geometry);
    };

    operation.id = 'orthogonalize';
    operation.keys = [t('operations.orthogonalize.key')];
    operation.title = t('operations.orthogonalize.title');

    return operation;
};
