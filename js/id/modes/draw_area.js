iD.modes.DrawArea = function(wayId) {
    var mode = {
        button: 'area'
    };

    mode.enter = function() {
        var map = mode.map,
            history = mode.history,
            controller = mode.controller,
            way = history.graph().entity(wayId),
            headId = _.last(way.nodes),
            tailId = _.first(way.nodes),
            node = iD.Node({loc: map.mouseCoordinates()});

        map.dblclickEnable(false)
            .fastEnable(false)
            .hint('Click on the map to add points to your area. Finish the ' +
                      'area by clicking on your first point');

        history.perform(
            iD.actions.AddNode(node),
            iD.actions.AddWayNode(way.id, node.id, -1));

        map.surface.on('mousemove.drawarea', function() {
            history.replace(iD.actions.Move(node.id, map.mouseCoordinates()));
        });

        map.surface.on('click.drawarea', function() {
            var datum = d3.select(d3.event.target).datum() || {};

            if (datum.id === tailId) {
                history.replace(
                    iD.actions.DeleteNode(node.id),
                    iD.actions.AddWayNode(way.id, tailId, -1),
                    'added to an area');

                controller.enter(iD.modes.Select(way));

            } else if (datum.type === 'node' && datum.id !== node.id) {
                // connect the way to an existing node
                history.replace(
                    iD.actions.DeleteNode(node.id),
                    iD.actions.AddWayNode(way.id, datum.id, -1),
                    'added to an area');

                controller.enter(iD.modes.DrawArea(wayId));

            } else {
                history.replace(
                    iD.actions.Noop(),
                    'added to an area');

                controller.enter(iD.modes.DrawArea(wayId));
            }
        });

        map.keybinding().on('⎋.drawarea', function() {
            history.replace(
                iD.actions.DeleteNode(node.id));

            controller.enter(iD.modes.Browse());
        });

        map.keybinding().on('⌫.drawarea', function() {
            d3.event.preventDefault();

            history.replace(
                iD.actions.DeleteNode(node.id),
                iD.actions.DeleteNode(headId));

            controller.enter(iD.modes.DrawArea(wayId));
        });
    };

    mode.exit = function() {
        mode.map.hint(false);
        mode.map.fastEnable(true);
        mode.map.surface
            .on('mousemove.drawarea', null)
            .on('click.drawarea', null);
        mode.map.keybinding().on('⎋.drawarea', null)
            .on('⌫.drawarea', null);
        window.setTimeout(function() {
            mode.map.dblclickEnable(true);
        }, 1000);
    };

    return mode;
};
