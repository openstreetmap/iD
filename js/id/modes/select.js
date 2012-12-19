iD.modes.Select = function (entity) {
    var mode = {
        id: 'select',
        button: 'browse',
        entity: entity
    };

    var inspector = iD.Inspector(),
        dragging, target;

    var dragWay = d3.behavior.drag()
        .origin(function(entity) {
            var p = mode.map.projection(entity.nodes[0].loc);
            return { x: p[0], y: p[1] };
        })
        .on('drag', function(entity) {
            d3.event.sourceEvent.stopPropagation();

            if (!dragging) {
                dragging = true;
                mode.history.perform(iD.actions.Noop());
            }

            mode.history.replace(iD.actions.MoveWay(entity.id, [d3.event.dx, d3.event.dy], mode.map.projection));
        })
        .on('dragend', function () {
            if (!dragging) return;
            dragging = undefined;

            mode.history.replace(
                iD.actions.Noop(),
                'moved a way');
        });

    function remove() {
        if (entity.type === 'way') {
            mode.history.perform(
                iD.actions.DeleteWay(entity.id),
                'deleted a way');
        } else if (entity.type === 'node') {
            var parents = mode.history.graph().parentWays(entity.id),
                operations = [iD.actions.DeleteNode(entity.id)];
            parents.forEach(function(parent) {
                if (_.uniq(parent.nodes).length === 1) operations.push(iD.actions.DeleteWay(parent.id));
            });
            mode.history.perform.apply(mode.history,
                operations.concat(['deleted a node']));
        }

        mode.controller.exit();
    }

    mode.enter = function () {
        target = mode.map.surface.selectAll('*')
            .filter(function (d) { return d === entity; });

        iD.modes._dragFeatures(mode);

        d3.select('.inspector-wrap')
            .style('display', 'block')
            .style('opacity', 1)
            .datum(entity)
            .call(inspector);

        inspector.on('changeTags', function(d, tags) {
            mode.history.perform(
                iD.actions.ChangeEntityTags(d.id, tags),
                'changed tags');

        }).on('changeWayDirection', function(d) {
            mode.history.perform(
                iD.actions.ReverseWay(d.id),
                'reversed a way');

        }).on('splitWay', function(d) {
            mode.history.perform(
                iD.actions.SplitWay(d.id),
                'split a way on a node');

        }).on('remove', function() {
            remove();

        }).on('close', function() {
            mode.controller.exit();
        });

        if (entity.type === 'way') {
            target.call(dragWay);
        }

        mode.map.surface.on('click.browse', function () {
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
        mode.map.surface.on('mousedown.latedrag', null);
        mode.map.keybinding().on('⌫.browse', null);

        mode.map.selection(null);
    };

    return mode;
};
