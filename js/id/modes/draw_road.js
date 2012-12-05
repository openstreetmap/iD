iD.modes.DrawRoad = function(way_id, direction) {
    var mode = {};

    mode.enter = function() {
        mode.map.dblclickEnable(false);
        mode.map.hint('Click to add more points to the road. ' +
                      'Click on other roads to connect to them, and double-click to ' +
                      'end the road.');
        mode.map.dragEnable(false);

        var index = (direction === 'forward') ? undefined : -1,
            node = iD.Node({loc: mode.map.mouseCoordinates()}),
            way = mode.history.graph().entity(way_id),
            firstNode = way.nodes[0],
            lastNode = _.last(way.nodes);

        mode.history.perform(iD.actions.addWayNode(way, node, index));

        mode.map.surface.on('mousemove.drawroad', function() {
            mode.history.replace(iD.actions.addWayNode(way, node.update({loc: mode.map.mouseCoordinates()}), index));
        });

        mode.map.surface.on('click.drawroad', function() {
            d3.event.stopPropagation();

            var datum = d3.select(d3.event.target).datum() || {};

            if (datum.type === 'node') {
                if (datum.id == firstNode || datum.id == lastNode) {
                    // If mode is drawing a loop and mode is not the drawing
                    // end of the stick, finish the circle
                    if (direction === 'forward' && datum.id == firstNode) {
                        mode.history.replace(iD.actions.addWayNode(way,
                            mode.history.graph().entity(firstNode), index));
                    } else if (direction === 'backward' && datum.id == lastNode) {
                        mode.history.replace(iD.actions.addWayNode(way,
                            mode.history.graph().entity(lastNode), index));
                    }

                    mode.history.perform(iD.actions.changeTags(way, _.omit(way.tags, 'elastic')));

                    // End by clicking on own tail
                    return mode.controller.enter(iD.modes.Select(way));
                } else {
                    // connect a way to an existing way
                    mode.history.replace(iD.actions.addWayNode(way, datum, index));
                }
            } else if (datum.type === 'way') {
                node = node.update({loc: mode.map.mouseCoordinates()});
                mode.history.replace(iD.actions.addWayNode(way, node, index));

                var connectedWay = mode.history.graph().entity(datum.id);
                var connectedIndex = iD.modes.chooseIndex(datum, d3.mouse(mode.map.surface.node()), mode.map);
                mode.history.perform(iD.actions.addWayNode(connectedWay, node, connectedIndex));
            } else {
                node = node.update({loc: mode.map.mouseCoordinates()});
                mode.history.replace(iD.actions.addWayNode(way, node, index));
            }

            mode.controller.enter(iD.modes.DrawRoad(way_id, direction));
        });

        mode.map.keybinding().on('⎋.drawroad', function() {
            mode.controller.exit();
        });
    };

    mode.exit = function() {
        mode.map.hint(false);
        mode.map.surface
            .on('mousemove.drawroad', null)
            .on('click.drawroad', null);
        mode.map.keybinding().on('⎋.drawroad', null);
        window.setTimeout(function() {
            mode.map.dblclickEnable(true);
            mode.map.dragEnable(true);
        }, 1000);
    };

    return mode;
};
