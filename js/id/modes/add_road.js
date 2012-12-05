iD.modes.AddRoad = function() {
    var mode = {
        id: 'add-road',
        title: '+ Road'
    };

    mode.enter = function() {
        mode.map.dblclickEnable(false);

        mode.map.hint('Click on the map to start drawing an road, path, or route.');

        mode.map.surface.on('click.addroad', function() {
            var datum = d3.select(d3.event.target).datum() || {},
                node,
                direction = 'forward',
                start = true,
                way = iD.Way({ tags: { highway: 'residential', elastic: 'true' } });

            if (datum.type === 'node') {
                // continue an existing way
                node = datum;

                var id = datum.id;
                var parents = mode.history.graph().parents(id);
                if (parents.length) {
                    if (parents[0].nodes[0] === id) {
                        way = parents[0];
                        direction = 'backward';
                        start = false;
                    } else if (_.last(parents[0].nodes) === id) {
                        way = parents[0];
                        start = false;
                    }
                }
            } else if (datum.type === 'way') {
                // begin a new way starting from an existing way
                node = iD.Node({loc: mode.map.mouseCoordinates()});

                var index = iD.util.geo.chooseIndex(datum, d3.mouse(mode.map.surface.node()), mode.map);
                var connectedWay = mode.history.graph().entity(datum.id);
                mode.history.perform(iD.actions.addWayNode(connectedWay, node, index));
            } else {
                // begin a new way
                node = iD.Node({loc: mode.map.mouseCoordinates()});
            }

            if (start) {
                mode.history.perform(iD.actions.startWay(way));
                mode.history.perform(iD.actions.addWayNode(way, node));
            }

            mode.controller.enter(iD.modes.DrawRoad(way.id, direction));
        });

        mode.map.keybinding().on('⎋.addroad', function() {
            mode.controller.exit();
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
