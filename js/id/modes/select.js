iD.modes.Select = function(selection, initial) {
    var mode = {
        id: 'select',
        button: 'browse'
    };

    var inspector = iD.ui.inspector().initial(!!initial),
        keybinding = d3.keybinding('select'),
        behaviors,
        radialMenu;

    function changeTags(d, tags) {
        if (!_.isEqual(singular().tags, tags)) {
            mode.history.perform(
                iD.actions.ChangeTags(d.id, tags),
                t('operations.change_tags.annotation'));
        }
    }

    function singular() {
        if (selection.length === 1) {
            return mode.map.history().graph().entity(selection[0]);
        }
    }

    mode.selection = function() {
        return selection;
    };

    mode.enter = function() {
        var map = mode.map,
            history = map.history(),
            graph = history.graph(),
            surface = map.surface,
            entity = singular();

        behaviors = [
            iD.behavior.Hover(),
            iD.behavior.DragNode(mode),
            iD.behavior.DragMidpoint(mode)];

        behaviors.forEach(function(behavior) {
            behavior(surface);
        });

        var operations = d3.values(iD.operations)
            .map(function (o) { return o(selection, mode); })
            .filter(function (o) { return o.available(); });

        operations.forEach(function(operation) {
            keybinding.on(operation.key, function () {
                if (operation.enabled()) {
                    operation();
                }
            });
        });

        var q = iD.util.stringQs(location.hash.substring(1));
        location.replace('#' + iD.util.qsString(_.assign(q, {
            id: selection.join(',')
        }), true));

        if (entity) {
            inspector.graph(graph);

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

            history.on('change.select', function() {
                // Exit mode if selected entity gets undone
                var oldEntity = entity,
                    newEntity = history.graph().entity(selection[0]);

                if (!newEntity) {
                    mode.controller.enter(iD.modes.Browse());
                } else if (!_.isEqual(oldEntity.tags, newEntity.tags)) {
                    inspector.tags(newEntity.tags);
                }

                surface.call(radialMenu.close);
            });
        }

        map.on('move.select', function() {
            surface.call(radialMenu.close);
        });

        function click() {
            var datum = d3.select(d3.event.target).datum();
            if (datum instanceof iD.Entity) {
                mode.controller.enter(iD.modes.Select([datum.id]));
            } else {
                mode.controller.enter(iD.modes.Browse());
            }
        }

        function dblclick() {
            var target = d3.select(d3.event.target),
                datum = target.datum();

            if (datum instanceof iD.Way && !target.classed('fill')) {
                var choice = iD.geo.chooseIndex(datum,
                        d3.mouse(mode.map.surface.node()), mode.map),
                    node = iD.Node({ loc: choice.loc });

                history.perform(
                    iD.actions.AddEntity(node),
                    iD.actions.AddVertex(datum.id, node.id, choice.index),
                    t('operations.add.annotation.vertex'));

                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }

        surface.on('click.select', click)
            .on('dblclick.select', dblclick);

        d3.select(document)
            .call(keybinding);

        surface.selectAll("*")
            .filter(function (d) { return d && selection.indexOf(d.id) >= 0; })
            .classed('selected', true);

        radialMenu = iD.ui.RadialMenu(operations);

        if (d3.event && !initial) {
            var loc = map.mouseCoordinates();

            if (entity && entity.type === 'node') {
                loc = entity.loc;
            }

            surface.call(radialMenu, map.projection(loc));
        }
    };

    mode.exit = function () {
        var surface = mode.map.surface,
            history = mode.history;

        if (singular()) {
            changeTags(singular(), inspector.tags());
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
        location.replace('#' + iD.util.qsString(_.omit(q, 'id'), true));

        keybinding.off();

        surface.on('click.select', null)
            .on('dblclick.select', null);

        history.on('change.select', null);

        surface.selectAll(".selected")
            .classed('selected', false);

        surface.call(radialMenu.close);
    };

    return mode;
};
