iD.operations.Merge = function(selection, context) {
    var action = iD.actions.Join(selection[0], selection[1]);

    var operation = function() {
        context.perform(
            action,
            t('operations.merge.annotation', {n: selection.length}));
    };

    operation.available = function() {
        return selection.length === 2 &&
            _.all(selection, function (id) {
                return context.geometry(id) === 'line';
            });
    };

    operation.enabled = function() {
        return action.enabled(context.graph());
    };

    operation.id = "merge";
    operation.key = t('operations.merge.key');
    operation.title = t('operations.merge.title');
    operation.description = t('operations.merge.description');

    return operation;
};
