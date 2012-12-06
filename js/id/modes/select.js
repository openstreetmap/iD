iD.modes.Select = function (entity) {
    var mode = {
        button: ''
    },
        inspector = iD.Inspector(),
        dragging, target;

    var dragWay = d3.behavior.drag()
        .origin(function(entity) {
            var p = mode.map.projection(entity.nodes[0].loc);
            return { x: p[0], y: p[1] };
        })
        .on('drag', function(entity) {
            if (!mode.map.dragEnable()) return;

            d3.event.sourceEvent.stopPropagation();

            if (!dragging) {
                dragging = iD.util.trueObj([entity.id].concat(
                    _.pluck(mode.history.graph().parentWays(entity.id), 'id')));
                mode.history.perform(iD.actions.Noop());
            }

            entity.nodes.forEach(function(node) {
                var start = mode.map.projection(node.loc);
                var end = mode.map.projection.invert([
                    start[0] + d3.event.dx,
                    start[1] + d3.event.dy]);
                node.loc = end;
                mode.history.replace(iD.actions.Move(node, end));
            });
        })
        .on('dragend', function () {
            if (!mode.map.dragEnable() || !dragging) return;
            dragging = undefined;
            mode.map.redraw();
        });

    function remove() {
        switch (entity.type) {
            case 'way':
                mode.history.perform(iD.actions.DeleteWay(entity));
                break;
            case 'node':
                mode.history.perform(iD.actions.DeleteNode(entity));
        }

        mode.controller.exit();
    }

    mode.enter = function () {
        target = mode.map.surface.selectAll("*")
            .filter(function (d) { return d === entity; });

        d3.select('.inspector-wrap')
            .style('display', 'block')
            .style('opacity', 1)
            .datum(entity)
            .call(inspector);

        inspector.on('changeTags', function(d, tags) {
            mode.history.perform(iD.actions.ChangeEntityTags(mode.history.graph().entity(d.id), tags));
        }).on('changeWayDirection', function(d) {
            mode.history.perform(iD.actions.ReverseWay(d));
        }).on('remove', function() {
            remove();
        }).on('close', function() {
            mode.controller.exit();
        });

        if (entity.type === 'way') {
            target.call(dragWay);
        }

        mode.map.surface.on("click.browse", function () {
            var datum = d3.select(d3.event.target).datum();
            if (datum instanceof iD.Entity) {
                mode.controller.enter(iD.modes.Select(datum));
            } else {
                mode.controller.enter(iD.modes.Browse());
            }
        });

        mode.map.keybinding().on('⌫.browse', function(e) {
            remove();
            e.preventDefault();
        });

        mode.map.selection(entity.id);
    };

    mode.exit = function () {
        d3.select('.inspector-wrap')
            .style('display', 'none');

        if (entity.type === 'way') {
            target.on('mousedown.drag', null)
                .on('touchstart.drag', null);
        }

        mode.map.surface.on("click.browse", null);
        mode.map.keybinding().on('⌫.browse', null);

        mode.map.selection(null);
    };

    return mode;
};
