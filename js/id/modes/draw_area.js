iD.modes.DrawArea = function(wayId, baseGraph) {
    var mode = {
        button: 'area',
        id: 'draw-area'
    };

    var behavior;

    mode.enter = function() {
        var way = mode.history.graph().entity(wayId),
            headId = way.nodes[way.nodes.length - 2],
            tailId = way.first();

        behavior = iD.behavior.DrawWay(wayId, -1, mode, baseGraph)
            .annotation(way.isDegenerate() ? 'started an area' : 'continued an area');

        var addNode = behavior.addNode;

        behavior.addNode = function(node) {
            if (node.id === headId || node.id === tailId) {
                behavior.finish();
            } else {
                addNode(node);
            }
        };

        mode.map.surface.call(behavior);
        mode.map.tail('Click to add points to your area. Click the first point to finish the area.', true);
    };

    mode.exit = function() {
        mode.map.surface.call(behavior.off);
    };

    return mode;
};
