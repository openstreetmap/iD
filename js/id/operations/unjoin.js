iD.operations.Unjoin = function(entityId) {
    var action = iD.actions.UnjoinNode(entityId);

    var operation = function(history) {
        history.perform(action, 'unjoined lines');
    };

    operation.available = function(graph) {
        var entity = graph.entity(entityId);
        return entity.geometry(graph) === 'vertex';
    };

    operation.enabled = function(graph) {
        return action.enabled(graph);
    };

    operation.id = "unjoin";
    operation.title = "Unjoin";

    return operation;
};
