iD.operations.Split = function(entityId, mode) {
    var history = mode.map.history(),
        action = iD.actions.SplitWay(entityId);

    var operation = function() {
        history.perform(action, 'split a way');
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

    operation.id = "split";
    operation.key = "X";
    operation.title = "Split";
    operation.description = "Split this into two ways at this point";

    return operation;
};
