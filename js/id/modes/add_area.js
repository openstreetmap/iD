iD.modes.AddArea = function() {
    var mode = {
        id: 'add-area',
        title: '+ Area'
    };

    mode.enter = function() {
        mode.map.dblclickEnable(false);

        mode.map.surface.on('click.addarea', function() {
            var datum = d3.select(d3.event.target).datum() || {},
                node,
                way = iD.Way({tags: { building: 'yes', area: 'yes', elastic: 'true' }});

            // connect a way to an existing way
            if (datum.type === 'node') {
                node = datum;
            } else {
                node = iD.Node({loc: mode.map.mouseCoordinates()});
            }

            mode.history.perform(iD.actions.startWay(way));
            mode.history.perform(iD.actions.addWayNode(way, node));

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
        mode.map.surface.on('click.addarea', null);
        mode.map.keybinding().on('⎋.addarea', null);
    };

    return mode;
};
