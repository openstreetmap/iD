iD.operations.Split = function(entityId) {
    var action = iD.actions.SplitWay(entityId);

    var operation = function(history) {
        history.perform(action, 'split a way');
    };

    operation.available = function(graph) {
        var entity = graph.entity(entityId);
        return entity.geometry(graph) === 'vertex';
    };

    operation.enabled = function(graph) {
        return action.enabled(graph);
    };

    operation.id = "split";
    operation.title = "Split";

    return operation;
};
