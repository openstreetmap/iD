iD.modes.Select = function (entity) {
    var mode = {
        id: 'select',
        button: 'browse',
        entity: entity
    };

    var inspector = iD.Inspector(),
        behaviors;

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
        var surface = mode.map.surface;

        behaviors = [
            iD.behavior.DragNode(mode),
            iD.behavior.DragWay(mode),
            iD.behavior.DragAccuracyHandle(mode)];

        behaviors.forEach(function(behavior) {
            behavior(surface);
        });

        d3.select('.inspector-wrap')
            .style('display', 'block')
            .style('opacity', 1)
            .datum(entity)
            .call(inspector);

        // Pan the map if the clicked feature intersects with the position
        // of the inspector
        var inspector_size = d3.select('.inspector-wrap').size(),
            map_size = mode.map.size(),
            entity_extent = entity.extent(mode.history.graph()),
            left_edge = map_size[0] - inspector_size[0],
            left = mode.map.projection(entity_extent[1])[0],
            right = mode.map.projection(entity_extent[0])[0];

        if (left > left_edge &&
            right > left_edge) mode.map.centerEase(
                iD.util.geo.interp(
                    entity_extent[0],
                    entity_extent[1], 0.5));

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

        function click() {
            var datum = d3.select(d3.event.target).datum();
            if (datum instanceof iD.Entity) {
                mode.controller.enter(iD.modes.Select(datum));
            } else {
                mode.controller.enter(iD.modes.Browse());
            }
        }

        function dblclick() {
            var datum = d3.select(d3.event.target).datum();
            if (datum instanceof iD.Entity &&
                (datum.geometry() === 'area' || datum.geometry() === 'line')) {
                var choice = iD.util.geo.chooseIndex(datum,
                        d3.mouse(mode.map.surface.node()), mode.map),
                    node = iD.Node({ loc: choice.loc });

                mode.history.perform(
                    iD.actions.AddNode(node),
                    iD.actions.AddWayNode(datum.id, node.id, choice.index),
                    'added a point to a road');

                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }

        surface.on('click.select', click)
            .on('dblclick.browse', dblclick);

        mode.map.keybinding().on('⌫.select', function(e) {
            remove();
            e.preventDefault();
        });

        surface.selectAll("*")
            .filter(function (d) { return d === entity; })
            .classed('selected', true);
    };

    mode.exit = function () {
        var surface = mode.map.surface;

        d3.select('.inspector-wrap')
            .style('display', 'none');

        behaviors.forEach(function(behavior) {
            behavior.off(surface);
        });

        surface.on("click.select", null);
        mode.map.keybinding().on('⌫.select', null);

        surface.selectAll(".selected")
            .classed('selected', false);
    };

    return mode;
};
