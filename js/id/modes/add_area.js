iD.modes.AddArea = function() {
    var mode = {
        id: 'add-area',
        button: 'area',
        title: 'Area',
        description: 'Add parks, buildings, lakes, or other areas to the map.'
    };

    var keybinding = d3.keybinding('add-area');

    mode.enter = function() {
        var map = mode.map,
            history = mode.history,
            controller = mode.controller;

        map.dblclickEnable(false)
            .tail('Click on the map to start drawing an area, like a park, lake, or building.');

        map.surface.on('click.addarea', function() {
            var datum = d3.select(d3.event.target).datum() || {},
                way = iD.Way({tags: { area: 'yes' }});

            if (datum.type === 'node') {
                // start from an existing node
                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddWayNode(way.id, datum.id),
                    iD.actions.AddWayNode(way.id, datum.id));

            } else {
                // start from a new node
                var node = iD.Node({loc: map.mouseCoordinates()});
                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddNode(node),
                    iD.actions.AddWayNode(way.id, node.id),
                    iD.actions.AddWayNode(way.id, node.id));
            }

            controller.enter(iD.modes.DrawArea(way.id));
        });

        keybinding.on('⎋', function() {
            controller.exit();
        });

        d3.select(document)
            .call(keybinding);
    };

    mode.exit = function() {
        window.setTimeout(function() {
            mode.map.dblclickEnable(true);
        }, 1000);
        mode.map.tail(false);
        mode.map.surface.on('click.addarea', null);
        keybinding.off();
    };

    return mode;
};
