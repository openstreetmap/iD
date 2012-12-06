iD.modes.DrawRoad = function(way_id, direction) {
    var mode = {
        button: 'road'
    };

    mode.enter = function() {
        mode.map.dblclickEnable(false)
            .dragEnable(false)
            .fastEnable(false)
            .hint('Click to add more points to the road. ' +
                      'Click on other roads to connect to them, and double-click to ' +
                      'end the road.');

        var index = (direction === 'forward') ? undefined : -1,
            node = iD.Node({loc: mode.map.mouseCoordinates(), tags: { elastic: true } }),
            way = mode.history.graph().entity(way_id),
            firstNode = way.nodes[0],
            lastNode = _.last(way.nodes);

        function finish(next) {
            way.tags = _.omit(way.tags, 'elastic');
            mode.history.perform(iD.actions.ChangeEntityTags(way, way.tags));
            return mode.controller.enter(next);
        }

        mode.history.perform(iD.actions.AddWayNode(way, node, index));

        mode.map.surface.on('mousemove.drawroad', function() {
            mode.history.replace(iD.actions.AddWayNode(way,
                node.update({ loc: mode.map.mouseCoordinates() }), index));
        });

        mode.map.surface.on('click.drawroad', function() {
            // d3.event.stopPropagation();

            var datum = d3.select(d3.event.target).datum() || {};

            if (datum.type === 'node') {
                if (datum.id == firstNode || datum.id == lastNode) {
                    // If mode is drawing a loop and mode is not the drawing
                    // end of the stick, finish the circle
                    if (direction === 'forward' && datum.id == firstNode) {
                        mode.history.replace(iD.actions.AddWayNode(way,
                            mode.history.graph().entity(firstNode), index));
                    } else if (direction === 'backward' && datum.id == lastNode) {
                        mode.history.replace(iD.actions.AddWayNode(way,
                            mode.history.graph().entity(lastNode), index));
                    }

                    mode.history.replace(iD.actions.DeleteNode(node));

                    return finish(iD.modes.Select(way));
                } else {
                    // connect a way to an existing way
                    mode.history.replace(iD.actions.DeleteNode(node));
                    mode.history.replace(iD.actions.AddWayNode(way, datum, index));
                }
            } else if (datum.type === 'way') {
                node = node.update({loc: mode.map.mouseCoordinates(), tags: {} });
                mode.history.replace(iD.actions.AddWayNode(way, node, index));

                var connectedWay = mode.history.graph().entity(datum.id);
                var connectedIndex = iD.modes.chooseIndex(datum,
                    d3.mouse(mode.map.surface.node()),
                    mode.map);
                mode.history.perform(iD.actions.AddWayNode(connectedWay,
                    node,
                    connectedIndex));
            } else {
                node = node.update({loc: mode.map.mouseCoordinates(), tags: {} });
                mode.history.replace(iD.actions.AddWayNode(way, node, index));
            }

            mode.controller.enter(iD.modes.DrawRoad(way_id, direction));
        });

        mode.map.keybinding().on('⎋.drawroad', function() {
            finish(iD.modes.Browse());
        });

        mode.map.keybinding().on('⌫.drawroad', function() {
            d3.event.preventDefault();
            mode.history.replace(iD.actions.RemoveWayNode(way,
                mode.history.graph().entity(lastNode)));
            mode.history.replace(iD.actions.DeleteNode(
                mode.history.graph().entity(lastNode)));
            mode.history.replace(iD.actions.DeleteNode(node));
            mode.controller.enter(iD.modes.DrawRoad(way_id, direction));
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
            mode.map.dragEnable(true);
        }, 1000);
    };

    return mode;
};
