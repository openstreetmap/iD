iD.operations.Move = function(entityId, mode) {
    var history = mode.map.history();

    var operation = function() {
        mode.controller.enter(iD.modes.MoveWay(entityId));
    };

    operation.available = function() {
        var graph = history.graph();
        return graph.entity(entityId).type === 'way';
    };

    operation.enabled = function() {
        return true;
    };

    operation.id = "move";
    operation.key = t('operations.move.key');
    operation.title = t('operations.move.title');
    operation.description = t('operations.move.description');

    return operation;
};
