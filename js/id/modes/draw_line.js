iD.modes.DrawLine = function(context, wayId, baseGraph, affix, option) {
    var mode = {
        button: 'line',
        id: 'draw-line',
        option: option
    };

    var behavior;

    mode.enter = function() {
        var way = context.entity(wayId),
            index = (affix === 'prefix') ? 0 : undefined,
            headId = (affix === 'prefix') ? way.first() : way.last();

        behavior = iD.behavior.DrawWay(context, wayId, (option === 'orthogonal' ? -1 : index), mode, baseGraph)
            .tail(t('modes.draw_line.tail'));

        var addNode = behavior.addNode;

        behavior.addNode = function(node, more) {
            if (node.id === headId) {
                behavior.finish();
            } else {
                addNode(node, more);
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
