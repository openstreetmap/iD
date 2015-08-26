iD.operations.Circularize = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        entity = context.entity(entityId),
        extent = entity.extent(context.graph()),
        geometry = context.geometry(entityId),
        action = iD.actions.Circularize(entityId, context.projection);

    var operation = function() {
        var annotation = t('operations.circularize.annotation.' + geometry);
        context.perform(action, annotation);
    };

    operation.available = function() {
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            _.uniq(entity.nodes).length > 1;
    };

    operation.disabled = function() {
        var reason = context.geometryLocked(selectedIDs);
        if (reason) return reason;

        reason = action.disabled(context.graph());
        if (reason) return t('operations.circularize.' + reason);

        if (extent.percentContainedIn(context.extent()) < 0.8) {
            return t('operations.circularize.too_large');
        }

        return false;
    };

    operation.tooltip = function() {
        return operation.disabled() || t('operations.circularize.description.' + geometry);
    };

    operation.id = 'circularize';
    operation.keys = [t('operations.circularize.key')];
    operation.title = t('operations.circularize.title');

    return operation;
};
