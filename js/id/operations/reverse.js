iD.operations.Reverse = function(selection, context) {
    var entityId = selection[0];

    var operation = function() {
        context.perform(
            iD.actions.Reverse(entityId),
            t('operations.reverse.annotation'));
    };

    operation.available = function() {
        return selection.length === 1 &&
            context.geometry(entityId) === 'line';
    };

    operation.enabled = function() {
        return true;
    };

    operation.id = "reverse";
    operation.key = t('operations.reverse.key');
    operation.title = t('operations.reverse.title');
    operation.description = t('operations.reverse.description');

    return operation;
};
