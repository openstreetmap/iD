iD.operations.Circularize = function(entityId, mode) {
    var history = mode.map.history(),
        action = iD.actions.Circularize(entityId, mode.map);

    var operation = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId),
            geometry = entity.geometry(graph);

        if (geometry === 'line') {
            history.perform(
                action,
                'made a line circular');

        } else if (geometry === 'area') {
            history.perform(
                action,
                'made an area circular');
        }
    };

    operation.available = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId);
        return entity.geometry(graph) === 'area' || entity.geometry(graph) === 'line';
    };

    operation.enabled = function() {
        var graph = history.graph();
        return action.enabled(graph);
    };

    operation.id = "circularize";
    operation.key = "O";
    operation.title = "Circularize";
    operation.description = "Make this round";

    return operation;
};
