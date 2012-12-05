iD.modes.DrawArea = function(way_id) {
    var mode = {};

    mode.enter = function() {
        mode.map.dblclickEnable(false);

        var surface = mode.map.surface,
            way = mode.history.graph().entity(way_id),
            firstnode_id = _.first(way.nodes),
            node = iD.Node({loc: mode.map.mouseCoordinates()});

        mode.history.perform(iD.actions.addWayNode(way, node));

        function mousemove() {
            mode.history.replace(iD.actions.addWayNode(way, node.update({loc: mode.map.mouseCoordinates()})));
        }

        function click() {
            d3.event.stopPropagation();

            var datum = d3.select(d3.event.target).datum();

            if (datum.type === 'node') {
                if (datum.id == firstnode_id) {
                    mode.history.replace(iD.actions.addWayNode(way,
                        mode.history.graph().entity(way.nodes[0])));

                    delete way.tags.elastic;
                    mode.history.perform(iD.actions.changeTags(way, way.tags));

                    // End by clicking on own tail
                    return mode.controller.enter(iD.modes.Select(way));
                } else {
                    // connect a way to an existing way
                    mode.history.replace(iD.actions.addWayNode(way, datum));
                }
            } else {
                node = node.update({loc: mode.map.mouseCoordinates()});
                mode.history.replace(iD.actions.addWayNode(way, node));
            }

            mode.controller.enter(iD.modes.DrawArea(way_id));
        }

        mode.map.keybinding().on('⎋.exit', function() {
            mode.controller.exit();
        });

        surface.on('click.drawarea', click)
            .on('mousemove.drawarea', mousemove);
    };

    mode.exit = function() {
        mode.map.surface.on('mousemove.drawarea', null)
            .on('click.drawarea', null);
        mode.map.keybinding().on('⎋.exit', null);
        window.setTimeout(function() {
            mode.map.dblclickEnable(true);
        }, 1000);
    };

    return mode;
};
