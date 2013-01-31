iD.modes.AddArea = function() {
    var mode = {
        id: 'add-area',
        button: 'area',
        title: t('modes.add_area.title'),
        description: t('modes.add_area.description'),
        key: t('modes.add_area.key')
    };

    var behavior,
        defaultTags = {area: 'yes'};

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
                iD.actions.AddWayNode(way.id, node.id),
                iD.actions.AddWayNode(way.id, node.id));

            controller.enter(iD.modes.DrawArea(way.id, graph));
        }

        function startFromWay(other, loc, index) {
            var graph = history.graph(),
                node = iD.Node({loc: loc}),
                way = iD.Way({tags: defaultTags});

            history.perform(
                iD.actions.AddNode(node),
                iD.actions.AddWay(way),
                iD.actions.AddWayNode(way.id, node.id),
                iD.actions.AddWayNode(way.id, node.id),
                iD.actions.AddWayNode(other.id, node.id, index));

            controller.enter(iD.modes.DrawArea(way.id, graph));
        }

        function startFromNode(node) {
            var graph = history.graph(),
                way = iD.Way({tags: defaultTags});

            history.perform(
                iD.actions.AddWay(way),
                iD.actions.AddWayNode(way.id, node.id),
                iD.actions.AddWayNode(way.id, node.id));

            controller.enter(iD.modes.DrawArea(way.id, graph));
        }

        function startFromMidpoint(midpoint) {
            var graph = history.graph(),
                node = iD.Node(),
                way = iD.Way({tags: defaultTags});

            history.perform(
                iD.actions.AddMidpoint(midpoint, node),
                iD.actions.AddWay(way),
                iD.actions.AddWayNode(way.id, node.id),
                iD.actions.AddWayNode(way.id, node.id));

            controller.enter(iD.modes.DrawArea(way.id, graph));
        }

        behavior = iD.behavior.AddWay(mode)
            .on('start', start)
            .on('startFromWay', startFromWay)
            .on('startFromNode', startFromNode)
            .on('startFromMidpoint', startFromMidpoint);

        mode.map.surface.call(behavior);
        mode.map.tail(t('modes.add_area.tail'), true);
    };

    mode.exit = function() {
        mode.map.surface.call(behavior.off);
    };

    return mode;
};
