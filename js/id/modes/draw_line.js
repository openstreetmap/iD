iD.modes.DrawLine = function(wayId, direction, baseGraph) {
    var mode = {
        button: 'line',
        id: 'draw-line'
    };

    var behavior;

    mode.enter = function() {
        var way = mode.history.graph().entity(wayId),
            index = (direction === 'forward') ? undefined : 0,
            headId = (direction === 'forward') ? way.last() : way.first();

        behavior = iD.behavior.DrawWay(wayId, index, mode, baseGraph)
            .annotation(way.isDegenerate() ? 'Started a line.' : 'Continued a line.');

        var addNode = behavior.addNode;

        behavior.addNode = function(node) {
            if (node.id === headId) {
                behavior.finish();
            } else {
                addNode(node);
            }
        };

        mode.map.surface.call(behavior);
        mode.map.tail('Click to add more points to the line. ' +
                      'Click on other lines to connect to them, and double-click to ' +
                      'end the line.', true);
    };

    mode.exit = function() {
        mode.map.surface.call(behavior.off);
    };

    return mode;
};
