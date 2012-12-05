iD.modes.AddRoad = function() {
    var mode = {
        id: 'add-road',
        title: '+ Road'
    };

    mode.enter = function() {
        mode.map.dblclickEnable(false);
        var surface = mode.map.surface;

        // http://bit.ly/SwUwIL
        // http://bit.ly/WxqGng
        function click() {
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

                var index = iD.util.geo.chooseIndex(datum, d3.mouse(surface.node()), mode.map);
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
        }

        surface.on('click.addroad', click);

        mode.map.keybinding().on('⎋.exit', function() {
            mode.controller.exit();
        });
    };

    mode.exit = function() {
        mode.map.dblclickEnable(true);
        mode.map.surface.on('click.addroad', null);
        mode.map.keybinding().on('⎋.exit', null);
        d3.selectAll('#addroad').remove();
    };

    return mode;
};
