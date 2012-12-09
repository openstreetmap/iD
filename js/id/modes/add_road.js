iD.modes.AddRoad = function() {
    var mode = {
        id: 'add-road',
        button: 'road',
        title: 'Road',
        description: 'Roads can be highways, streets, pedestrian paths, or even canals'
    };

    mode.enter = function() {
        var map = mode.map,
            node,
            history = mode.history,
            controller = mode.controller;

        map.dblclickEnable(false)
            .hint('Click on the map to start drawing an road, path, or route.');

        map.surface.on('click.addroad', function() {
            var datum = d3.select(d3.event.target).datum() || {},
                way = iD.Way({ tags: { highway: 'residential' } }),
                direction = 'forward';

            if (datum.type === 'node') {
                // continue an existing way
                var id = datum.id;
                var parents = history.graph().parentWays(id);
                if (parents.length && parents[0].nodes[0] === id) {
                    way = parents[0];
                    direction = 'backward';
                } else if (parents.length && _.last(parents[0].nodes) === id) {
                    way = parents[0];
                } else {
                    history.perform(
                        iD.actions.AddWay(way),
                        iD.actions.AddWayNode(way.id, datum.id),
                        'started a road');
                }

            } else if (datum.type === 'way') {
                // begin a new way starting from an existing way
                var choice = iD.util.geo.chooseIndex(datum, d3.mouse(map.surface.node()), map);
                node = iD.Node({ loc: choice.loc }),

                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddNode(node),
                    iD.actions.AddWayNode(datum.id, node.id, choice.index),
                    iD.actions.AddWayNode(way.id, node.id),
                    'started a road');

            } else {
                // begin a new way
                node = iD.Node({loc: map.mouseCoordinates()});

                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddNode(node),
                    iD.actions.AddWayNode(way.id, node.id),
                    'started a road');
            }

            controller.enter(iD.modes.DrawRoad(way.id, direction));
        });

        map.keybinding().on('⎋.addroad', function() {
            controller.exit();
        });
    };

    mode.exit = function() {
        mode.map.dblclickEnable(true);
        mode.map.hint(false);
        mode.map.surface.on('click.addroad', null);
        mode.map.keybinding().on('⎋.addroad', null);
    };

    return mode;
};
