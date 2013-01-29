iD.operations.Reverse = function(entityId) {
    var operation = function(history) {
        history.perform(
            iD.actions.ReverseWay(entityId),
            'reversed a line');
    };

    operation.available = function(graph) {
        var entity = graph.entity(entityId);
        return entity.geometry(graph) === 'line';
    };

    operation.enabled = function() {
        return true;
    };

    operation.id = "reverse";
    operation.title = "Reverse";
    operation.description = "Make this way go in the opposite direction";

    return operation;
};
