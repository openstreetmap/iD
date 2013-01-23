iD.modes.Select = function(entity, initial) {
    var mode = {
        id: 'select',
        button: 'browse',
        entity: entity
    };

    var inspector = iD.ui.inspector().initial(!!initial),
        keybinding = d3.keybinding('select'),
        behaviors,
        arcMenu;

    function remove() {
        if (entity.type === 'way') {
            mode.history.perform(
                iD.actions.DeleteWay(entity.id),
                'deleted a way');
        } else if (entity.type === 'node') {
            mode.history.perform(
                iD.actions.DeleteNode(entity.id),
                'deleted a node');
        }

        mode.controller.exit();
    }

    function changeTags(d, tags) {
        if (!_.isEqual(entity.tags, tags)) {
            mode.history.perform(
                iD.actions.ChangeEntityTags(d.id, tags),
                'changed tags');
        }
    }

    mode.enter = function() {
        var surface = mode.map.surface,
            history = mode.history;

        behaviors = [
            iD.behavior.Hover(),
            iD.behavior.DragNode(mode),
            iD.behavior.DragWay(mode),
            iD.behavior.DragMidpoint(mode)];

        behaviors.forEach(function(behavior) {
            behavior(surface);
        });

        var q = iD.util.stringQs(location.hash.substring(1));
        location.hash =  '#' + iD.util.qsString(_.assign(q, {
            id: entity.id
        }), true);

        d3.select('.inspector-wrap')
            .style('display', 'block')
            .style('opacity', 1)
            .datum(entity)
            .call(inspector);

        if (d3.event) {
            // Pan the map if the clicked feature intersects with the position
            // of the inspector
            var inspector_size = d3.select('.inspector-wrap').size(),
                map_size = mode.map.size(),
                offset = 50,
                shift_left = d3.event.x - map_size[0] + inspector_size[0] + offset,
                center = (map_size[0] / 2) + shift_left + offset;

            if (shift_left > 0 && inspector_size[1] > d3.event.y) {
                mode.map.centerEase(mode.map.projection.invert([center, map_size[1]/2]));
            }
        }

        inspector
            .on('changeTags', changeTags)
            .on('close', function() { mode.controller.exit(); });

        // Exit mode if selected entity gets undone
        history.on('change.entity-undone', function() {
            var old = entity;
            entity = history.graph().entity(entity.id);
            if (!entity) {
                mode.controller.enter(iD.modes.Browse());
            } else if(!_.isEqual(entity.tags, old.tags)) {
                inspector.tags(entity.tags);
            }
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
                var choice = iD.geo.chooseIndex(datum,
                        d3.mouse(mode.map.surface.node()), mode.map),
                    node = iD.Node({ loc: choice.loc });

                history.perform(
                    iD.actions.AddNode(node),
                    iD.actions.AddWayNode(datum.id, node.id, choice.index),
                    'added a point to a road');

                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }

        surface.on('click.select', click)
            .on('dblclick.select', dblclick);

        keybinding.on('⌫', remove);

        d3.select(document)
            .call(keybinding);

        surface.selectAll("*")
            .filter(function (d) {
                return d && entity && d.id === entity.id;
            })
            .classed('selected', true);

        arcMenu = iD.ui.ArcMenu(entity, history);

        if (d3.event) {
            surface.call(arcMenu, d3.mouse(surface.node()));
        }
    };

    mode.exit = function () {
        var surface = mode.map.surface,
            history = mode.history;

        if (entity) {
            changeTags(entity, inspector.tags());
        }

        d3.select('.inspector-wrap')
            .style('display', 'none')
            .html('');

        // Firefox incorrectly implements blur, so typeahead elements
        // are not correctly removed. Remove any stragglers manually.
        d3.selectAll('div.typeahead').remove();

        behaviors.forEach(function(behavior) {
            behavior.off(surface);
        });

        var q = iD.util.stringQs(location.hash.substring(1));
        location.hash =  '#' + iD.util.qsString(_.omit(q, 'id'), true);

        keybinding.off();

        surface.on('click.select', null)
            .on('dblclick.select', null);

        history.on('change.entity-undone', null);

        surface.selectAll(".selected")
            .classed('selected', false);

        surface.call(arcMenu.close);
    };

    return mode;
};
