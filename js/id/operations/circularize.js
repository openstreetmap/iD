iD.operations.Circularize = function(selection, context) {
    var entityId = selection[0],
        action = iD.actions.Circularize(entityId, context.projection);

    var operation = function() {
        var annotation = t('operations.circularize.annotation.' + context.geometry(entityId));
        context.perform(action, annotation);
    };

    operation.available = function() {
        return selection.length === 1 &&
            context.entity(entityId).type === 'way';
    };

    operation.enabled = function() {
        return action.enabled(context.graph());
    };

    operation.id = "circularize";
    operation.keys = [t('operations.circularize.key')];
    operation.title = t('operations.circularize.title');
    operation.description = t('operations.circularize.description');

    return operation;
};
