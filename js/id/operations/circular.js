iD.operations.Circular = function(entityId, mode) {
    var action = iD.actions.Circular(entityId, mode.map);

    var operation = function(history) {
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

    operation.available = function(graph) {
        var entity = graph.entity(entityId);
        return entity.geometry(graph) === 'area' || entity.geometry(graph) === 'line';
    };

    operation.enabled = function(graph) {
        return action.enabled(graph);
    };

    operation.id = "circular";
    operation.title = "Circular";

    return operation;
};
