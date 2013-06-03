iD.operations.Split = function(selectedIDs, context) {
    var vertices = _.filter(selectedIDs, function vertex(entityId) {
        return context.geometry(entityId) === 'vertex';
    });

    var entityId = vertices[0],
        action = iD.actions.Split(entityId);

    if (selectedIDs.length > 1) {
        action.limitWays(_.without(selectedIDs, entityId));
    }

    var operation = function() {
        var annotation;

        var ways = action.ways(context.graph());
        if (ways.length === 1) {
            annotation = t('operations.split.annotation.' + context.geometry(ways[0].id));
        } else {
            annotation = t('operations.split.annotation.multiple', {n: ways.length});
        }

        var difference = context.perform(action, annotation);
        context.enter(iD.modes.Select(context, difference.extantIDs()));
    };

    operation.available = function() {
        return vertices.length === 1;
    };

    operation.disabled = function() {
        return action.disabled(context.graph());
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        if (disable) {
            return t('operations.split.' + disable);
        }

        var ways = action.ways(context.graph());
        if (ways.length === 1) {
            return t('operations.split.description.' + context.geometry(ways[0].id));
        } else {
            return t('operations.split.description.multiple');
        }
    };

    operation.id = "split";
    operation.keys = [t('operations.split.key')];
    operation.title = t('operations.split.title');

    return operation;
};
