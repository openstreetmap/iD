iD.modes.DrawArea = function(wayId) {
    var mode = {
        button: 'area',
        id: 'draw-area'
    };

    var behavior;

    mode.enter = function() {
        var way = mode.history.graph().entity(wayId),
            index = -1,
            headId = way.nodes[way.nodes.length - 2],
            tailId = way.first(),
            annotation = way.isDegenerate() ? 'started an area' : 'continued an area';

        function addHeadTail() {
            behavior.finish();
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
            .on('addHead', addHeadTail)
            .on('addTail', addHeadTail)
            .on('addNode', addNode)
            .on('addWay', addWay)
            .on('add', add);

        mode.map.surface.call(behavior);
        mode.map.tail('Click to add points to your area. Click the first point to finish the area.', true);
    };

    mode.exit = function() {
        mode.map.surface.call(behavior.off);
    };

    return mode;
};
