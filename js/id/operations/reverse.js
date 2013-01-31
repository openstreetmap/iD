iD.operations.Reverse = function(selection, mode) {
    var entityId = selection[0],
        history = mode.map.history();

    var operation = function() {
        history.perform(
            iD.actions.ReverseWay(entityId),
            t('operations.reverse.annotation'));
    };

    operation.available = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId);
        return selection.length === 1 &&
            entity.geometry(graph) === 'line';
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
