iD.operations.Delete = function(entityId, mode) {
    var history = mode.map.history();

    var operation = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId),
            geometry = entity.geometry(graph);

        if (geometry === 'vertex') {
            history.perform(
                iD.actions.DeleteNode(entityId),
                'Deleted a vertex.');

        } else if (geometry === 'point') {
            history.perform(
                iD.actions.DeleteNode(entityId),
                'Deleted a point.');

        } else if (geometry === 'line') {
            history.perform(
                iD.actions.DeleteWay(entityId),
                'Deleted a line.');

        } else if (geometry === 'area') {
            history.perform(
                iD.actions.DeleteWay(entityId),
                'Deleted an area.');
        }
    };

    operation.available = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId);
        return _.contains(['vertex', 'point', 'line', 'area'], entity.geometry(graph));
    };

    operation.enabled = function() {
        return true;
    };

    operation.id = "delete";
    operation.key = "⌫";
    operation.title = "Delete";
    operation.description = "Remove this from the map.";

    return operation;
};
