iD.modes.DrawLine = function(context, wayId, direction, baseGraph) {
    var mode = {
        button: 'line',
        id: 'draw-line'
    };

    var behavior;

    mode.enter = function() {
        var way = context.entity(wayId),
            index = (direction === 'forward') ? undefined : 0,
            headId = (direction === 'forward') ? way.last() : way.first();

        behavior = iD.behavior.DrawWay(context, wayId, index, mode, baseGraph)
            .tail(t('modes.draw_line.tail'));

        var addNode = behavior.addNode;

        behavior.addNode = function(node) {
            if (node.id === headId) {
                behavior.finish();
            } else {
                addNode(node);
            }
        };

        context.install(behavior);
    };

    mode.exit = function() {
        context.uninstall(behavior);
    };

    mode.selectedIDs = function() {
        return [wayId];
    };

    return mode;
};
