iD.modes.AddLine = function() {
    var mode = {
        id: 'add-line',
        button: 'line',
        title: 'Line',
        description: 'Lines can be highways, streets, pedestrian paths, or even canals.'
    };

    var keybinding = d3.keybinding('add-line');

    mode.enter = function() {
        var map = mode.map,
            node,
            history = mode.history,
            controller = mode.controller;

        map.dblclickEnable(false)
            .tail('Click on the map to start drawing an road, path, or route.');

        map.surface.on('click.addline', function() {
            var datum = d3.select(d3.event.target).datum() || {},
                way = iD.Way({ tags: { highway: 'residential' } }),
                direction = 'forward';

            if (datum.type === 'node') {
                // continue an existing way
                var id = datum.id;
                var parents = history.graph().parentWays(datum);
                var isLine = parents.length && parents[0].geometry() === 'line';
                if (isLine && parents[0].nodes[0] === id ) {
                    way = parents[0];
                    direction = 'backward';
                } else if (isLine && _.last(parents[0].nodes) === id) {
                    way = parents[0];
                } else {
                    history.perform(
                        iD.actions.AddWay(way),
                        iD.actions.AddWayNode(way.id, datum.id));
                }

            } else if (datum.type === 'way') {
                // begin a new way starting from an existing way
                var choice = iD.util.geo.chooseIndex(datum, d3.mouse(map.surface.node()), map);
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

            controller.enter(iD.modes.DrawLine(way.id, direction));
        });

        keybinding.on('⎋', function() {
            controller.exit();
        });

        d3.select(document)
            .call(keybinding);
    };

    mode.exit = function() {
        mode.map.dblclickEnable(true);
        mode.map.tail(false);
        mode.map.surface.on('click.addline', null);
        keybinding.off();
    };

    return mode;
};
