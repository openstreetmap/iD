iD.operations.Disconnect = function(selection, context) {
    var vertices = _.filter(selection, function vertex(entityId) {
        return context.geometry(entityId) === 'vertex';
    });

    var entityId = vertices[0],
        action = iD.actions.Disconnect(entityId);

    if (selection.length > 1) {
        action.limitWays(_.without(selection, entityId));
    }

    var operation = function() {
        context.perform(action, t('operations.disconnect.annotation'));
    };

    operation.available = function() {
        return vertices.length === 1;
    };

    operation.disabled = function() {
        return action.disabled(context.graph());
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.disconnect.' + disable) :
            t('operations.disconnect.description');
    };

    operation.id = "disconnect";
    operation.keys = [t('operations.disconnect.key')];
    operation.title = t('operations.disconnect.title');

    return operation;
};
