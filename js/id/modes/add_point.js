iD.modes.AddPoint = function() {
    var mode = {
        id: 'add-point',
        title: t('modes.add_point.title'),
        description: t('modes.add_point.description'),
        key: t('modes.add_point.key')
    };

    var behavior;

    mode.enter = function() {
        var map = mode.map,
            history = mode.history,
            controller = mode.controller;

        function add(loc) {
            var node = iD.Node({loc: loc});

            history.perform(
                iD.actions.AddEntity(node),
                t('operations.add.annotation.point'));

            controller.enter(iD.modes.Select(node, true));
        }

        function addWay(way, loc, index) {
            add(loc);
        }

        function addNode(node) {
            add(node.loc);
        }

        function cancel() {
            controller.exit();
        }

        behavior = iD.behavior.Draw(map)
            .on('click', add)
            .on('clickWay', addWay)
            .on('clickNode', addNode)
            .on('clickMidpoint', addNode)
            .on('cancel', cancel)
            .on('finish', cancel);

        mode.map.surface.call(behavior);
        mode.map.tail(t('modes.add_point.tail'));
    };

    mode.exit = function() {
        var map = mode.map,
            surface = map.surface;

        map.tail(false);
        behavior.off(surface);
    };

    return mode;
};
