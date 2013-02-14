iD.operations.Merge = function(selection, context) {
    var join = iD.actions.Join(selection),
        merge = iD.actions.Merge(selection);

    var operation = function() {
        var annotation = t('operations.merge.annotation', {n: selection.length}),
            action;

        if (join.enabled(context.graph())) {
            action = join;
        } else {
            action = merge;
        }

        var difference = context.perform(action, annotation);
        context.enter(iD.modes.Select(context, difference.extantIDs()));
    };

    operation.available = function() {
        return selection.length >= 2;
    };

    operation.enabled = function() {
        return join.enabled(context.graph()) ||
            merge.enabled(context.graph());
    };

    operation.id = "merge";
    operation.key = t('operations.merge.key');
    operation.title = t('operations.merge.title');
    operation.description = t('operations.merge.description');

    return operation;
};
