iD.modes.DrawRoad = function(wayId, direction) {
    var mode = {
        button: 'road'
    };

    mode.enter = function() {

        var map = mode.map,
            history = mode.history,
            controller = mode.controller,
            way = history.graph().entity(wayId),
            node = iD.Node({loc: map.mouseCoordinates()}),
            index = (direction === 'forward') ? undefined : 0,
            headId = (direction === 'forward') ? _.last(way.nodes) : _.first(way.nodes),
            tailId = (direction === 'forward') ? _.first(way.nodes) : _.last(way.nodes);

        map.dblclickEnable(false)
            .fastEnable(false)
            .hint('Click to add more points to the road. ' +
                      'Click on other roads to connect to them, and double-click to ' +
                      'end the road.');

        history.perform(
            iD.actions.AddNode(node),
            iD.actions.AddWayNode(wayId, node.id, index));

        map.surface.on('mousemove.drawroad', function() {
            history.replace(iD.actions.Move(node.id, map.mouseCoordinates()));
        });

        map.surface.on('click.drawroad', function() {
            var datum = d3.select(d3.event.target).datum() || {};

            if (datum.id === tailId) {
                // connect the way in a loop
                history.replace(
                    iD.actions.DeleteNode(node.id),
                    iD.actions.AddWayNode(wayId, tailId, index),
                    'added to a road');

                controller.enter(iD.modes.Select(way));

            } else if (datum.id === headId) {
                // finish the way
                history.replace(iD.actions.DeleteNode(node.id));

                controller.enter(iD.modes.Select(way));

            } else if (datum.type === 'node' && datum.id !== node.id) {
                // connect the way to an existing node
                history.replace(
                    iD.actions.DeleteNode(node.id),
                    iD.actions.AddWayNode(wayId, datum.id, index),
                    'added to a road');

                controller.enter(iD.modes.DrawRoad(wayId, direction));

            } else if (datum.type === 'way') {
                // connect the way to an existing way
                var connectedIndex = iD.util.geo.chooseIndex(datum, d3.mouse(map.surface.node()), map);

                history.replace(
                    iD.actions.AddWayNode(datum.id, node.id, connectedIndex),
                    'added to a road');

                controller.enter(iD.modes.DrawRoad(wayId, direction));

            } else {
                history.replace(
                    iD.actions.Noop(),
                    'added to a road');

                controller.enter(iD.modes.DrawRoad(wayId, direction));
            }
        });

        map.keybinding().on('⎋.drawroad', function() {
            history.replace(
                iD.actions.DeleteNode(node.id));

            controller.enter(iD.modes.Browse());
        });

        map.keybinding().on('⌫.drawroad', function() {
            d3.event.preventDefault();

            history.replace(
                iD.actions.DeleteNode(node.id),
                iD.actions.DeleteNode(headId));

            controller.enter(iD.modes.DrawRoad(wayId, direction));
        });
    };

    mode.exit = function() {
        mode.map.hint(false);
        mode.map.fastEnable(true);

        mode.map.surface
            .on('mousemove.drawroad', null)
            .on('click.drawroad', null);
        mode.map.keybinding().on('⎋.drawroad', null)
            .on('⌫.drawroad', null);
        window.setTimeout(function() {
            mode.map.dblclickEnable(true);
        }, 1000);
    };

    return mode;
};
