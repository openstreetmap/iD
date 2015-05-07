iD.modes.DrawArea = function(context, wayId, baseGraph, option) {
    var mode = {
        button: 'area',
        id: 'draw-area',
        option: option
    };

    var behavior;

    mode.enter = function() {
        var way = context.entity(wayId),
            headId = way.nodes[way.nodes.length - 2],
            tailId = way.first();

        behavior = iD.behavior.DrawWay(context, wayId, -1, mode, baseGraph)
            .tail(t('modes.draw_area.tail'));

        var addNode = behavior.addNode;

        behavior.addNode = function(node, more) {
            if (node.id === headId || node.id === tailId) {
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
