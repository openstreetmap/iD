iD.operations.Merge = function(selection, context) {
    var action = iD.actions.Join(selection[0], selection[1]);

    var operation = function() {
        var annotation = t('operations.merge.annotation', {n: selection.length}),
            difference = context.perform(action, annotation);
        context.enter(iD.modes.Select(context, difference.extantIDs()));
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
