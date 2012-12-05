iD.modes.AddArea = function() {
    var mode = {
        id: 'add-area',
        title: '+ Area'
    };

    function way() {
        return iD.Way({
            tags: { building: 'yes', area: 'yes', elastic: 'true' }
        });
    }

    mode.enter = function() {
        mode.map.dblclickEnable(false);

        var surface = mode.map.surface;

        function click() {
            var datum = d3.select(d3.event.target).datum() || {},
                node, way = way();

            // connect a way to an existing way
            if (datum.type === 'node') {
                node = datum;
            } else {
                node = iD.Node({loc: mode.map.mouseCoordinates()});
            }

            mode.history.perform(iD.actions.startWay(way));
            mode.history.perform(iD.actions.addWayNode(way, node));

            mode.controller.enter(iD.modes.DrawArea(way.id));
        }

        surface.on('click.addarea', click);

        mode.map.keybinding().on('⎋.exit', function() {
            mode.controller.exit();
        });
    };

    mode.exit = function() {
        window.setTimeout(function() {
            mode.map.dblclickEnable(true);
        }, 1000);
        mode.map.surface.on('click.addarea', null);
        mode.map.keybinding().on('⎋.exit', null);
    };

    return mode;
};
