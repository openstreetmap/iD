iD.modes.AddArea = function() {
    var mode = {
        id: 'add-area',
        button: 'area',
        title: '+ Area',
        description: 'Add parks, buildings, lakes, or other areas to the map.'
    };

    mode.enter = function() {
        mode.map.dblclickEnable(false);
        mode.map.hint('Click on the map to start drawing an area, like a park, lake, or building.');

        mode.map.surface.on('click.addarea', function() {
            var datum = d3.select(d3.event.target).datum() || {},
                way = iD.Way({tags: { building: 'yes', area: 'yes' }});

            // connect a way to an existing way
            if (datum.type === 'node') {
                mode.history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddWayNode(way.id, datum.id));
            } else {
                var node = iD.Node({loc: mode.map.mouseCoordinates()});
                mode.history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddNode(node),
                    iD.actions.AddWayNode(way.id, node.id));
            }

            mode.controller.enter(iD.modes.DrawArea(way.id));
        });

        mode.map.keybinding().on('⎋.addarea', function() {
            mode.controller.exit();
        });
    };

    mode.exit = function() {
        window.setTimeout(function() {
            mode.map.dblclickEnable(true);
        }, 1000);
        mode.map.hint(false);
        mode.map.surface.on('click.addarea', null);
        mode.map.keybinding().on('⎋.addarea', null);
    };

    return mode;
};
