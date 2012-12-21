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

        surface.on('click.browse', function () {
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
        var surface = mode.map.surface;

        d3.select('.inspector-wrap')
            .style('display', 'none');

        behaviors.forEach(function(behavior) {
            behavior.off(surface);
        });

        surface.on("click.browse", null);
        surface.on('mousedown.latedrag', null);
        mode.map.keybinding().on('⌫.browse', null);
        mode.map.selection(null);
    };

    return mode;
};
