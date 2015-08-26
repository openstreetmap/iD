iD.operations.Disconnect = function(selectedIDs, context) {
    var vertices = _.filter(selectedIDs, function vertex(entityId) {
        return context.geometry(entityId) === 'vertex';
    });

    var entityId = vertices[0],
        action = iD.actions.Disconnect(entityId);

    if (selectedIDs.length > 1) {
        action.limitWays(_.without(selectedIDs, entityId));
    }

    var operation = function() {
        context.perform(action, t('operations.disconnect.annotation'));
    };

    operation.available = function() {
        return vertices.length === 1;
    };

    operation.disabled = function() {
        var reason = context.geometryLocked(selectedIDs);
        if (reason) return reason;

        reason = action.disabled(context.graph());
        if (reason) return t('operations.disconnect.' + reason);

        return false;
    };

    operation.tooltip = function() {
        return operation.disabled() || t('operations.disconnect.description');
    };

    operation.id = 'disconnect';
    operation.keys = [t('operations.disconnect.key')];
    operation.title = t('operations.disconnect.title');

    return operation;
};
