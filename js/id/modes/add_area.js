iD.modes.AddArea = function() {
    var mode = {
        id: 'add-area',
        button: 'area',
        title: 'Area',
        description: 'Add parks, buildings, lakes, or other areas to the map.'
    };

    mode.enter = function() {
        d3.select('#map').attr('class', function() { return mode.id; });

        var map = mode.map,
            history = mode.history,
            controller = mode.controller;

        map.dblclickEnable(false)
            .hint('Click on the map to start drawing an area, like a park, lake, or building.');

        map.surface.on('click.addarea', function() {
            var datum = d3.select(d3.event.target).datum() || {},
                way = iD.Way({tags: { area: 'yes' }});

            if (datum.type === 'node') {
                // start from an existing node
                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddWayNode(way.id, datum.id),
                    iD.actions.AddWayNode(way.id, datum.id),
                    'started an area');

            } else {
                // start from a new node
                var node = iD.Node({loc: map.mouseCoordinates()});
                history.perform(
                    iD.actions.AddWay(way),
                    iD.actions.AddNode(node),
                    iD.actions.AddWayNode(way.id, node.id),
                    iD.actions.AddWayNode(way.id, node.id),
                    'started an area');
            }

            controller.enter(iD.modes.DrawArea(way.id));
        });

        map.keybinding().on('⎋.addarea', function() {
            controller.exit();
        });
    };

    mode.exit = function() {
        window.setTimeout(function() {
            mode.map.dblclickEnable(true);
        }, 1000);
        mode.map.hint(false);
        mode.map.surface.on('click.addarea', null);
        mode.map.keybinding().on('⎋.addarea', null);
        d3.select('#map').attr('class', null);
    };

    return mode;
};
