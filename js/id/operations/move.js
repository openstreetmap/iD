iD.operations.Move = function(entityId, mode) {
    var operation = function() {
        mode.controller.enter(iD.modes.MoveWay(entityId));
    };

    operation.available = function(graph) {
        return graph.entity(entityId).type === 'way';
    };

    operation.enabled = function() {
        return true;
    };

    operation.id = "move";
    operation.title = "Move";

    return operation;
};
