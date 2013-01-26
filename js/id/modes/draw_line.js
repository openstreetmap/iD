iD.modes.DrawLine = function(wayId, direction) {
    var mode = {
        button: 'line',
        id: 'draw-line'
    };

    var behavior;

    mode.enter = function() {
        var way = mode.history.graph().entity(wayId),
            index = (direction === 'forward') ? undefined : 0,
            headId = (direction === 'forward') ? way.last() : way.first(),
            tailId = (direction === 'forward') ? way.first() : way.last(),
            annotation = way.isDegenerate() ? 'started a line' : 'continued a line';

        function addHead() {
            behavior.finish();
        }

        function addTail(node) {
            // connect the way in a loop
            if (way.nodes.length > 2) {
                behavior.addNode(node, annotation);
            } else {
                behavior.cancel();
            }
        }

        function addNode(node) {
            behavior.addNode(node, annotation);
        }

        function addWay(way, loc, index) {
            behavior.addWay(way, loc, index, annotation);
        }

        function add(loc) {
            behavior.add(loc, annotation);
        }

        behavior = iD.behavior.DrawWay(wayId, headId, tailId, index, mode)
            .on('addHead', addHead)
            .on('addTail', addTail)
            .on('addNode', addNode)
            .on('addWay', addWay)
            .on('add', add);

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
