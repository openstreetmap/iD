iD.operations.Straighten = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        action = iD.actions.Straighten(entityId, context.projection);

    function operation() {
        var annotation = t('operations.straighten.annotation');
        context.perform(action, annotation);
    }

    operation.available = function() {
        var entity = context.entity(entityId);
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            !entity.isClosed() &&
            _.uniq(entity.nodes).length > 2;
    };

    operation.disabled = function() {
        var reason = context.geometryLocked(selectedIDs);
        if (reason) return reason;

        reason = action.disabled(context.graph());
        if (reason) return t('operations.straighten.' + reason);

        return false;
    };

    operation.tooltip = function() {
        return operation.disabled() || t('operations.straighten.description');
    };

    operation.id = 'straighten';
    operation.keys = [t('operations.straighten.key')];
    operation.title = t('operations.straighten.title');

    return operation;
};
