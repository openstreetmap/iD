iD.operations.Reverse = function(entityId, mode) {
    var history = mode.map.history();

    var operation = function() {
        history.perform(
            iD.actions.ReverseWay(entityId),
            'reversed a line');
    };

    operation.available = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId);
        return entity.geometry(graph) === 'line';
    };

    operation.enabled = function() {
        return true;
    };

    operation.id = "reverse";
    operation.key = "V";
    operation.title = "Reverse";
    operation.description = "Make this way go in the opposite direction";

    return operation;
};
