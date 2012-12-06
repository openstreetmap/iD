iD.modes.DrawArea = function(way_id) {
    var mode = {
        button: 'area'
    };

    mode.enter = function() {

        mode.map.hint('Click on the map to add points to your area. Finish the ' +
                      'area by clicking on your first point');
        mode.map.dblclickEnable(false);

        var way = mode.history.graph().entity(way_id),
            firstnode_id = _.first(way.nodes),
            node = iD.Node({loc: mode.map.mouseCoordinates()});

        mode.history.perform(iD.actions.AddWayNode(way, node));

        mode.map.surface.on('mousemove.drawarea', function() {
            mode.history.replace(iD.actions.AddWayNode(way, node.update({loc: mode.map.mouseCoordinates()})));
        });

        mode.map.surface.on('click.drawarea', function() {
            d3.event.stopPropagation();

            var datum = d3.select(d3.event.target).datum();

            if (datum.type === 'node') {
                if (datum.id == firstnode_id) {
                    mode.history.replace(iD.actions.DeleteNode(node));
                    mode.history.replace(iD.actions.AddWayNode(way,
                        mode.history.graph().entity(way.nodes[0])));
                    way = mode.history.graph().entity(way.id);
                    way.tags = _.omit(way.tags, 'elastic');
                    mode.history.perform(iD.actions.ChangeEntityTags(way, way.tags));

                    // End by clicking on own tail
                    return mode.controller.enter(iD.modes.Select(way));
                } else {
                    // connect a way to an existing way
                    mode.history.replace(iD.actions.AddWayNode(way, datum));
                }
            } else {
                node = node.update({loc: mode.map.mouseCoordinates()});
                mode.history.replace(iD.actions.AddWayNode(way, node));
            }

            mode.controller.enter(iD.modes.DrawArea(way_id));
        });

        mode.map.keybinding().on('⎋.drawarea', function() {
            mode.controller.exit();
        })
        .on('⌫.drawarea', function() {
            d3.event.preventDefault();
            var lastNode = _.last(way.nodes);
            mode.history.replace(iD.actions.removeWayNode(way,
                mode.history.graph().entity(lastNode)));
            mode.history.replace(iD.actions.DeleteNode(
                mode.history.graph().entity(lastNode)));
            mode.history.replace(iD.actions.DeleteNode(node));
            mode.controller.enter(iD.modes.DrawArea(way_id));
        });
    };

    mode.exit = function() {
        mode.map.hint(false);
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
