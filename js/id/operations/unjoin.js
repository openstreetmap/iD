iD.operations.Unjoin = function(entityId, mode) {
    var history = mode.map.history(),
        action = iD.actions.UnjoinNode(entityId);

    var operation = function() {
        history.perform(action, 'Unjoined lines.');
    };

    operation.available = function() {
        var graph = history.graph(),
            entity = graph.entity(entityId);
        return entity.geometry(graph) === 'vertex';
    };

    operation.enabled = function() {
        var graph = history.graph();
        return action.enabled(graph);
    };

    operation.id = "unjoin";
    operation.key = "⇧-J";
    operation.title = "Unjoin";
    operation.description = "Disconnect these ways from each other.";

    return operation;
};
