iD.operations.Move = function(selection, mode) {
    var entityId = selection[0],
        history = mode.map.history();

    var operation = function() {
        mode.controller.enter(iD.modes.MoveWay(entityId));
    };

    operation.available = function() {
        var graph = history.graph();
        return selection.length === 1 &&
            graph.entity(entityId).type === 'way';
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
