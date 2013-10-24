iD.operations.Merge = function(selectedIDs, context) {
    var join = iD.actions.Join(selectedIDs),
        merge = iD.actions.Merge(selectedIDs),
        mergePolygon = iD.actions.MergePolygon(selectedIDs);

    var operation = function() {
        var annotation = t('operations.merge.annotation', {n: selectedIDs.length}),
            action;

        if (!join.disabled(context.graph())) {
            action = join;
        } else if (!merge.disabled(context.graph())) {
            action = merge;
        } else {
            action = mergePolygon;
        }

        context.perform(action, annotation);
        context.enter(iD.modes.Select(context, selectedIDs.filter(function(id) { return context.hasEntity(id); }))
            .suppressMenu(true));
    };

    operation.available = function() {
        return selectedIDs.length >= 2;
    };

    operation.disabled = function() {
        return join.disabled(context.graph()) &&
            merge.disabled(context.graph()) &&
            mergePolygon.disabled(context.graph());
    };

    operation.tooltip = function() {
        var j = join.disabled(context.graph()),
            m = merge.disabled(context.graph()),
            p = mergePolygon.disabled(context.graph());

        if (j === 'restriction' && m && p)
            return t('operations.merge.restriction', {relation: context.presets().item('type/restriction').name()});

        if (j && m && p)
            return t('operations.merge.' + j);

        return t('operations.merge.description');
    };

    operation.id = 'merge';
    operation.keys = [t('operations.merge.key')];
    operation.title = t('operations.merge.title');

    return operation;
};
