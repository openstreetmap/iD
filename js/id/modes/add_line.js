iD.modes.AddLine = function() {
    var mode = {
        id: 'add-line',
        button: 'line',
        title: 'Line',
        description: 'Lines can be highways, streets, pedestrian paths, or even canals.',
        key: 'l'
    };

    var behavior,
        defaultTags = {highway: 'residential'};

    mode.enter = function() {
        var map = mode.map,
            history = mode.history,
            controller = mode.controller;

        function startFromNode(node) {
            var graph = history.graph(),
                parent = graph.parentWays(node)[0],
                isLine = parent && parent.geometry(graph) === 'line';

            if (isLine && parent.first() === node.id) {
                controller.enter(iD.modes.DrawLine(parent.id, 'backward', graph));

            } else if (isLine && parent.last() === node.id) {
                controller.enter(iD.modes.DrawLine(parent.id, 'forward', graph));

            } else {
                var way = iD.Way({tags: defaultTags});

                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddWayNode(way.id, node.id));

                controller.enter(iD.modes.DrawLine(way.id, 'forward', graph));
            }
        }

        function startFromWay(other, loc, index) {
            var graph = history.graph(),
                node = iD.Node({loc: loc}),
                way = iD.Way({tags: defaultTags});

            history.perform(
                iD.actions.AddNode(node),
                iD.actions.AddWay(way),
                iD.actions.AddWayNode(way.id, node.id),
                iD.actions.AddWayNode(other.id, node.id, index));

            controller.enter(iD.modes.DrawLine(way.id, 'forward', graph));
        }

        function start(loc) {
            var graph = history.graph(),
                node = iD.Node({loc: loc}),
                way = iD.Way({tags: defaultTags});

            history.perform(
                iD.actions.AddNode(node),
                iD.actions.AddWay(way),
                iD.actions.AddWayNode(way.id, node.id));

            controller.enter(iD.modes.DrawLine(way.id, 'forward', graph));
        }

        behavior = iD.behavior.AddWay(mode)
            .on('startFromNode', startFromNode)
            .on('startFromWay', startFromWay)
            .on('start', start);

        mode.map.surface.call(behavior);
        mode.map.tail('Click on the map to start drawing an road, path, or route.', true);
    };

    mode.exit = function() {
        mode.map.surface.call(behavior.off);
    };

    return mode;
};
