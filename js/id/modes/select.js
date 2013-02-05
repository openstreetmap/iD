iD.modes.Select = function(context, selection, initial) {
    var mode = {
        id: 'select',
        button: 'browse'
    };

    var inspector = iD.ui.inspector().initial(!!initial),
        keybinding = d3.keybinding('select'),
        behaviors = [
            iD.behavior.Hover(),
            iD.behavior.Select(context),
            iD.behavior.DragNode(context),
            iD.behavior.DragMidpoint(context)],
        radialMenu;

    function changeTags(d, tags) {
        if (!_.isEqual(singular().tags, tags)) {
            context.perform(
                iD.actions.ChangeTags(d.id, tags),
                t('operations.change_tags.annotation'));
        }
    }

    function singular() {
        if (selection.length === 1) {
            return context.entity(selection[0]);
        }
    }

    mode.selection = function() {
        return selection;
    };

    mode.enter = function() {
        var entity = singular();

        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        var operations = _.without(d3.values(iD.operations), iD.operations.Delete)
            .map(function(o) { return o(selection, context); })
            .filter(function(o) { return o.available(); });
        operations.unshift(iD.operations.Delete(selection, context));

        operations.forEach(function(operation) {
            keybinding.on(operation.key, function() {
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
            inspector.graph(context.graph());

            context.container()
                .select('.inspector-wrap')
                .style('display', 'block')
                .style('opacity', 1)
                .datum(entity)
                .call(inspector);

            if (d3.event) {
                // Pan the map if the clicked feature intersects with the position
                // of the inspector
                var inspector_size = context.container().select('.inspector-wrap').size(),
                    map_size = context.map().size(),
                    offset = 50,
                    shift_left = d3.event.x - map_size[0] + inspector_size[0] + offset,
                    center = (map_size[0] / 2) + shift_left + offset;

                if (shift_left > 0 && inspector_size[1] > d3.event.y) {
                    context.map().centerEase(context.projection.invert([center, map_size[1]/2]));
                }
            }

            inspector
                .on('changeTags', changeTags)
                .on('close', function() { context.enter(iD.modes.Browse(context)); });
        }

        context.history().on('change.select', function() {
            context.surface().call(radialMenu.close);

            if (_.any(selection, function(id) { return !context.entity(id); })) {
                // Exit mode if selected entity gets undone
                context.enter(iD.modes.Browse(context));

            } else if (entity) {
                var newEntity = context.entity(selection[0]);
                if (!_.isEqual(entity.tags, newEntity.tags)) {
                    inspector.tags(newEntity.tags);
                }
            }
        });

        context.map().on('move.select', function() {
            context.surface().call(radialMenu.close);
        });

        function dblclick() {
            var target = d3.select(d3.event.target),
                datum = target.datum();

            if (datum instanceof iD.Way && !target.classed('fill')) {
                var choice = iD.geo.chooseIndex(datum,
                        d3.mouse(context.surface().node()), context),
                    node = iD.Node({ loc: choice.loc });

                context.perform(
                    iD.actions.AddEntity(node),
                    iD.actions.AddVertex(datum.id, node.id, choice.index),
                    t('operations.add.annotation.vertex'));

                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }

        d3.select(document)
            .call(keybinding);

        context.surface()
            .on('dblclick.select', dblclick)
            .selectAll("*")
            .filter(function(d) { return d && selection.indexOf(d.id) >= 0; })
            .classed('selected', true);

        radialMenu = iD.ui.RadialMenu(operations);

        if (d3.event && !initial) {
            var loc = context.map().mouseCoordinates();

            if (entity && entity.type === 'node') {
                loc = entity.loc;
            }

            context.surface().call(radialMenu, context.projection(loc));
        }
    };

    mode.exit = function() {
        if (singular()) {
            changeTags(singular(), inspector.tags());
        }

        context.container()
            .select('.inspector-wrap')
            .style('display', 'none')
            .html('');

        // Firefox incorrectly implements blur, so typeahead elements
        // are not correctly removed. Remove any stragglers manually.
        d3.selectAll('div.typeahead').remove();

        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        var q = iD.util.stringQs(location.hash.substring(1));
        location.replace('#' + iD.util.qsString(_.omit(q, 'id'), true));

        keybinding.off();

        context.history()
            .on('change.select', null);

        context.surface()
            .call(radialMenu.close)
            .on('dblclick.select', null)
            .selectAll(".selected")
            .classed('selected', false);
    };

    return mode;
};
