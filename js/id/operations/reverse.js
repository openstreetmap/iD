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

    operation.disabled = function() {
        return false;
    };

    operation.tooltip = function() {
        return t('operations.reverse.description');
    };

    operation.id = "reverse";
    operation.keys = [t('operations.reverse.key')];
    operation.title = t('operations.reverse.title');

    return operation;
};
