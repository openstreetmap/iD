iD.modes.DrawLine = function(wayId, direction) {
    var mode = {
        button: 'line',
        id: 'draw-line'
    };

    var keybinding = d3.keybinding('draw-line');

    mode.enter = function() {
        var map = mode.map,
            surface = map.surface,
            history = mode.history,
            controller = mode.controller,
            way = history.graph().entity(wayId),
            node = iD.Node({loc: map.mouseCoordinates()}),
            index = (direction === 'forward') ? undefined : 0,
            headId = (direction === 'forward') ? way.last() : way.first(),
            tailId = (direction === 'forward') ? way.first() : way.last();

        iD.behavior.Hover()(surface);

        map.dblclickEnable(false)
            .fastEnable(false)
            .tail('Click to add more points to the line. ' +
                      'Click on other lines to connect to them, and double-click to ' +
                      'end the line.');

        map.minzoom(16);

        history.perform(
            iD.actions.AddNode(node),
            iD.actions.AddWayNode(wayId, node.id, index));

        surface.selectAll('.way, .node')
            .filter(function (d) { return d.id === wayId || d.id === node.id; })
            .classed('active', true);

        function mousemove() {
            history.replace(iD.actions.MoveNode(node.id, map.mouseCoordinates()));
        }

        function click() {
            var datum = d3.select(d3.event.target).datum() || {};

            if (datum.id === tailId) {
                // connect the way in a loop
                if (way.nodes.length > 2) {
                    history.replace(
                        iD.actions.DeleteNode(node.id),
                        iD.actions.AddWayNode(wayId, tailId, index),
                        'added to a line');

                    controller.enter(iD.modes.Select(way, true));

                } else {
                    history.replace(iD.actions.DeleteWay(way.id));
                    controller.enter(iD.modes.Browse());
                }

            } else if (datum.id === headId) {
                // finish the way
                history.undo();

                controller.enter(iD.modes.Select(way, true));

            } else if (datum.type === 'node' && datum.id !== node.id) {
                // connect the way to an existing node
                history.replace(
                    iD.actions.DeleteNode(node.id),
                    iD.actions.AddWayNode(wayId, datum.id, index),
                    'added to a line');

                controller.enter(iD.modes.DrawLine(wayId, direction));

            } else if (datum.type === 'way' || datum.midpoint) {
                var choice;
                // connect the way to an existing way
                if (datum.midpoint) {
                    // if clicked on midpoint
                    datum.id = datum.way;
                    choice = datum;
                } else {
                    choice = iD.geo.chooseIndex(datum, d3.mouse(surface.node()), map);
                }

                history.replace(
                    iD.actions.MoveNode(node.id, choice.loc),
                    iD.actions.AddWayNode(datum.id, node.id, choice.index),
                    'added to a line');

                controller.enter(iD.modes.DrawLine(wayId, direction));

            } else {
                history.replace(
                    iD.actions.Noop(),
                    'added to a line');

                controller.enter(iD.modes.DrawLine(wayId, direction));
            }
        }

        function backspace() {
            d3.event.preventDefault();

            history.replace(
                iD.actions.DeleteNode(node.id),
                iD.actions.DeleteNode(headId));

            if (history.graph().fetch(wayId).nodes.length === 0) {
                history.replace(iD.actions.DeleteWay(wayId));
                controller.enter(iD.modes.Browse());
            } else {
                controller.enter(iD.modes.DrawLine(wayId, direction));
            }
        }

        function del() {
            d3.event.preventDefault();
            history.replace(iD.actions.DeleteWay(wayId));
            controller.enter(iD.modes.Browse());
        }

        function ret() {
            d3.event.preventDefault();
            history.replace(iD.actions.DeleteNode(node.id));
            controller.enter(iD.modes.Select(way, true));
        }

        surface
            .on('mousemove.drawline', mousemove)
            .on('click.drawline', click);

        keybinding
            .on('⌫', backspace)
            .on('⌦', del)
            .on('⎋', ret)
            .on('↩', ret);

        d3.select(document)
            .call(keybinding);

        history.on('undone.drawline', function () {
            controller.enter(iD.modes.Browse());
        });
    };

    mode.exit = function() {
        var map = mode.map,
            surface = map.surface,
            history = mode.history;

        surface.selectAll('.way, .node')
            .classed('active', false);

        map.tail(false);
        map.fastEnable(true);
        map.minzoom(0);

        surface
            .on('mousemove.drawline', null)
            .on('click.drawline', null);

        keybinding.off();

        history.on('undone.drawline', null);

        window.setTimeout(function() {
            mode.map.dblclickEnable(true);
        }, 1000);
    };

    return mode;
};
