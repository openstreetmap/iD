iD.modes.DrawArea = function(wayId) {
    var mode = {
        button: 'area',
        id: 'draw-area'
    };

    mode.enter = function() {
        d3.select('#map').attr('class', function() { return mode.id});
        var map = mode.map,
            history = mode.history,
            controller = mode.controller,
            way = history.graph().entity(wayId),
            headId = (way.nodes.length == 1) ?
                way.nodes[0] :
                way.nodes[way.nodes.length - 2],
            tailId = _.first(way.nodes),
            node = iD.Node({loc: map.mouseCoordinates()});

        map.dblclickEnable(false)
            .fastEnable(false);
        map.hint('Click on the map to add points to your area. Finish the ' +
                      'area by clicking on your first point');

        history.perform(
            iD.actions.AddNode(node),
            iD.actions.AddWayNode(way.id, node.id, -1));

        function mousemove() {
            history.replace(iD.actions.MoveNode(node.id, map.mouseCoordinates()));
        }

        function mouseover() {
            var datum = d3.select(d3.event.target).datum() || {};
            if (datum.id === tailId) {
                d3.select('#map').attr('class', 'finish-area draw-area');
            } else if ( (d3.select('#map').classed('draw-area')) && (datum.id !== tailId)) {
                d3.select('#map').attr('class', 'draw-area');
            }
        }

        function click() {
            var datum = d3.select(d3.event.target).datum() || {};

            if (datum.id === tailId) {
                history.replace(
                    iD.actions.DeleteNode(node.id),
                    iD.actions.AddWayNode(way.id, tailId, -1),
                    'added to an area');

                controller.enter(iD.modes.Select(way));

            } else if (datum.id === headId) {

                // finish the way
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

            if (history.graph().fetch(wayId).nodes.length === 2) {
                history.replace(
                    iD.actions.DeleteNode(way.nodes[0]),
                    iD.actions.DeleteWay(wayId));
                controller.enter(iD.modes.Browse());
            } else {
                controller.enter(iD.modes.DrawArea(wayId));
            }
        }

        function del() {
            d3.event.preventDefault();
            history.replace(iD.actions.DeleteWay(wayId));
            controller.enter(iD.modes.Browse());
        }

        function ret() {
            d3.event.preventDefault();
            history.replace(
                    iD.actions.DeleteNode(node.id),
                    iD.actions.AddWayNode(way.id, tailId, -1),
                    'added to an area');
            controller.enter(iD.modes.Browse());
        }

        map.surface
            .on('mousemove.drawarea', mousemove)
            .on('mouseover.drawarea', mouseover)
            .on('click.drawarea', click);

        map.keybinding()
            .on('⎋.drawarea', esc)
            .on('⌫.drawarea', backspace)
            .on('⌦.drawarea', del)
            .on('↩.drawarea', ret);
    };

    mode.exit = function() {
        d3.select('#map').attr('class', null);
        mode.map.hint(false);
        mode.map.fastEnable(true);

        mode.map.surface
            .on('mousemove.drawarea', null)
            .on('click.drawarea', null);

        mode.map.keybinding()
            .on('⎋.drawarea', null)
            .on('⌫.drawarea', null)
            .on('⌦.drawarea', null)
            .on('↩.drawarea', null);

        window.setTimeout(function() {
            mode.map.dblclickEnable(true);
        }, 1000);
    };

    return mode;
};
