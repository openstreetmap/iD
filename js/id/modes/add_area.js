iD.modes.AddArea = function() {
    var mode = {
        id: 'add-area',
        button: 'area',
        title: 'Area',
        description: 'Add parks, buildings, lakes, or other areas to the map.'
    };

    var behavior;

    mode.enter = function() {
        var map = mode.map,
            surface = map.surface,
            history = mode.history,
            controller = mode.controller;

        map.dblclickEnable(false)
            .tail('Click on the map to start drawing an area, like a park, lake, or building.');

        function add() {
            var datum = d3.select(d3.event.target).datum() || {},
                way = iD.Way({tags: { area: 'yes' }}),
                node;

            if (datum.type === 'node') {
                // start from an existing node
                node = datum;
                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddWayNode(way.id, node.id),
                    iD.actions.AddWayNode(way.id, node.id));

            } else if (datum.type === 'way') {
                // begin a new way starting from an existing way
                var choice = iD.geo.chooseIndex(datum, d3.mouse(map.surface.node()), map);
                node = iD.Node({ loc: choice.loc });

                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddNode(node),
                    iD.actions.AddWayNode(datum.id, node.id, choice.index),
                    iD.actions.AddWayNode(way.id, node.id),
                    iD.actions.AddWayNode(way.id, node.id));

            } else {
                // start from a new node
                node = iD.Node({loc: map.mouseCoordinates()});
                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddNode(node),
                    iD.actions.AddWayNode(way.id, node.id),
                    iD.actions.AddWayNode(way.id, node.id));
            }

            node = iD.Node({loc: node.loc});

            history.replace(
                iD.actions.AddNode(node),
                iD.actions.AddWayNode(way.id, node.id, -1),
                'started an area');

            controller.enter(iD.modes.DrawArea(way.id));
        }

        function cancel() {
            controller.exit();
        }

        behavior = iD.behavior.Draw()
            .on('add', add)
            .on('cancel', cancel)
            .on('finish', cancel)
            (surface);
    };

    mode.exit = function() {
        var map = mode.map,
            surface = map.surface;

        window.setTimeout(function() {
            map.dblclickEnable(true);
        }, 1000);
        map.tail(false);
        behavior.off(surface);
    };

    return mode;
};
