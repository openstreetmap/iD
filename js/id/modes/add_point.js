iD.modes.AddPoint = function() {
    var mode = {
        id: 'add-point',
        title: 'Point',
        description: 'Restaurants, monuments, and postal boxes are points.',
        key: 'p'
    };

    var behavior;

    mode.enter = function() {
        var map = mode.map,
            surface = map.surface,
            history = mode.history,
            controller = mode.controller;

        map.tail('Click on the map to add a point.', true);

        function add(loc) {
            var node = iD.Node({loc: loc});

            history.perform(
                iD.actions.AddNode(node),
                'added a point');

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
            .on('finish', cancel)
            (surface);
    };

    mode.exit = function() {
        var map = mode.map,
            surface = map.surface;

        map.tail(false);
        behavior.off(surface);
    };

    return mode;
};
