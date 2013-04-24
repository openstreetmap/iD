iD.modes.DrawArea = function(context, wayId, baseGraph) {
    var mode = {
        button: 'area',
        id: 'draw-area'
    };

    var behavior;

    mode.enter = function() {
        var way = context.entity(wayId),
            headId = way.nodes[way.nodes.length - 2],
            tailId = way.first();

        behavior = iD.behavior.DrawWay(context, wayId, -1, mode, baseGraph);

        var addNode = behavior.addNode;

        behavior.addNode = function(node) {
            if (node.id === headId || node.id === tailId) {
                behavior.finish();
            } else {
                addNode(node);
            }
        };

        context.install(behavior);
        context.tail(t('modes.draw_area.tail'));
    };

    mode.exit = function() {
        context.uninstall(behavior);
    };

    mode.selection = function() {
        return [wayId];
    };

    return mode;
};
