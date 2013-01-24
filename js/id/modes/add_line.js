iD.modes.AddLine = function() {
    var mode = {
        id: 'add-line',
        button: 'line',
        title: 'Line',
        description: 'Lines can be highways, streets, pedestrian paths, or even canals.'
    };

    var behavior;

    mode.enter = function() {
        var map = mode.map,
            surface = map.surface,
            graph = map.history().graph(),
            history = mode.history,
            controller = mode.controller;

        map.dblclickEnable(false)
            .tail('Click on the map to start drawing an road, path, or route.', true);

        function add() {
            var datum = d3.select(d3.event.target).datum() || {},
                way = iD.Way({ tags: { highway: 'residential' } }),
                direction = 'forward',
                node;

            if (datum.type === 'node') {
                // continue an existing way
                node = datum;
                var parents = history.graph(graph).parentWays(node);
                var isLine = parents.length && parents[0].geometry(graph) === 'line';
                if (isLine && parents[0].first() === node.id) {
                    way = parents[0];
                    direction = 'backward';
                } else if (isLine && parents[0].last() === node.id) {
                    way = parents[0];
                } else {
                    history.perform(
                        iD.actions.AddWay(way),
                        iD.actions.AddWayNode(way.id, node.id));
                }

            } else if (datum.type === 'way') {
                // begin a new way starting from an existing way
                var choice = iD.geo.chooseIndex(datum, d3.mouse(map.surface.node()), map);
                node = iD.Node({ loc: choice.loc });

                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddNode(node),
                    iD.actions.AddWayNode(datum.id, node.id, choice.index),
                    iD.actions.AddWayNode(way.id, node.id));

            } else {
                // begin a new way
                node = iD.Node({loc: map.mouseCoordinates()});

                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddNode(node),
                    iD.actions.AddWayNode(way.id, node.id));
            }

            var index = (direction === 'forward') ? way.nodes.length : 0,

            node = iD.Node({loc: node.loc});

            history.replace(
                iD.actions.AddNode(node),
                iD.actions.AddWayNode(way.id, node.id, index),
                'started a line');

            controller.enter(iD.modes.DrawLine(way.id, direction, node));
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

        map.dblclickEnable(true);
        map.tail(false);
        behavior.off(surface);
    };

    return mode;
};
