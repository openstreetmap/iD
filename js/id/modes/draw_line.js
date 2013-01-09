iD.modes.DrawLine = function(wayId, direction) {
    var mode = {
        button: 'line',
        id: 'draw-line'
    };

    mode.enter = function() {
        var map = mode.map,
            surface = map.surface,
            history = mode.history,
            controller = mode.controller,
            way = history.graph().entity(wayId),
            node = iD.Node({loc: map.mouseCoordinates()}),
            index = (direction === 'forward') ? undefined : 0,
            headId = (direction === 'forward') ? _.last(way.nodes) : _.first(way.nodes),
            tailId = (direction === 'forward') ? _.first(way.nodes) : _.last(way.nodes);

        iD.behavior.Hover()(surface);

        map.dblclickEnable(false)
            .fastEnable(false)
            .hint('Click to add more points to the line. ' +
                      'Click on other lines to connect to them, and double-click to ' +
                      'end the line.');

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
                history.replace(
                    iD.actions.DeleteNode(node.id),
                    iD.actions.AddWayNode(wayId, tailId, index),
                    'added to a line');

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
                    'added to a line');

                controller.enter(iD.modes.DrawLine(wayId, direction));

            } else if (datum.type === 'way') {
                // connect the way to an existing way
                var choice = iD.util.geo.chooseIndex(datum, d3.mouse(surface.node()), map);

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

        function esc() {
            history.replace(
                iD.actions.DeleteNode(node.id));

            controller.enter(iD.modes.Browse());
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
            controller.enter(iD.modes.Browse());
        }

        surface
            .on('mousemove.drawline', mousemove)
            .on('click.drawline', click);

        map.keybinding()
            .on('⎋.drawline', esc)
            .on('⌫.drawline', backspace)
            .on('⌦.drawline', del)
            .on('↩.drawline', ret);
    };

    mode.exit = function() {
        var surface = mode.map.surface;

        surface.selectAll('.way, .node')
            .classed('active', false);

        mode.map.hint(false);
        mode.map.fastEnable(true);

        surface
            .on('mousemove.drawline', null)
            .on('click.drawline', null);

        mode.map.keybinding()
            .on('⎋.drawline', null)
            .on('⌫.drawline', null)
            .on('⌦.drawline', null)
            .on('↩.drawline', null);

        window.setTimeout(function() {
            mode.map.dblclickEnable(true);
        }, 1000);
    };

    return mode;
};
