iD.modes.AddLine = function() {
    var mode = {
        id: 'add-line',
        button: 'line',
        title: t('modes.add_line.title'),
        description: t('modes.add_line.description'),
        key: t('modes.add_line.key')
    };

    var behavior,
        defaultTags = {highway: 'residential'};

    mode.enter = function() {
        var map = mode.map,
            history = mode.history,
            controller = mode.controller;

        function start(loc) {
            var graph = history.graph(),
                node = iD.Node({loc: loc}),
                way = iD.Way({tags: defaultTags});

            history.perform(
                iD.actions.AddNode(node),
                iD.actions.AddWay(way),
                iD.actions.AddVertex(way.id, node.id));

            controller.enter(iD.modes.DrawLine(way.id, 'forward', graph));
        }

        function startFromWay(other, loc, index) {
            var graph = history.graph(),
                node = iD.Node({loc: loc}),
                way = iD.Way({tags: defaultTags});

            history.perform(
                iD.actions.AddNode(node),
                iD.actions.AddWay(way),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddVertex(other.id, node.id, index));

            controller.enter(iD.modes.DrawLine(way.id, 'forward', graph));
        }

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
                    iD.actions.AddVertex(way.id, node.id));

                controller.enter(iD.modes.DrawLine(way.id, 'forward', graph));
            }
        }

        function startFromMidpoint(midpoint) {
            var graph = history.graph(),
                node = iD.Node(),
                way = iD.Way({tags: defaultTags});

            history.perform(
                iD.actions.AddMidpoint(midpoint, node),
                iD.actions.AddWay(way),
                iD.actions.AddVertex(way.id, node.id));

            controller.enter(iD.modes.DrawLine(way.id, 'forward', graph));
        }

        behavior = iD.behavior.AddWay(mode)
            .on('start', start)
            .on('startFromWay', startFromWay)
            .on('startFromNode', startFromNode)
            .on('startFromMidpoint', startFromMidpoint);

        mode.map.surface.call(behavior);
        mode.map.tail(t('modes.add_line.tail'));
    };

    mode.exit = function() {
        mode.map.surface.call(behavior.off);
    };

    return mode;
};
