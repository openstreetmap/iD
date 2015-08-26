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
        var reason = context.geometryLocked(selectedIDs);
        if (reason) return reason;

        reason = action.disabled(context.graph());
        if (reason) return t('operations.orthogonalize.' + reason);

        if (extent.percentContainedIn(context.extent()) < 0.8) {
            return t('operations.orthogonalize.too_large');
        }

        return false;
    };

    operation.tooltip = function() {
        return operation.disabled() || t('operations.orthogonalize.description.' + geometry);
    };

    operation.id = 'orthogonalize';
    operation.keys = [t('operations.orthogonalize.key')];
    operation.title = t('operations.orthogonalize.title');

    return operation;
};
