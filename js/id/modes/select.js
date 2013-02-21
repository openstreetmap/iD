iD.modes.Select = function(context, selection, initial) {
    var mode = {
        id: 'select',
        button: 'browse'
    };

    var inspector = iD.ui.Inspector().initial(!!initial),
        keybinding = d3.keybinding('select'),
        timeout = null,
        behaviors = [
            iD.behavior.Hover(),
            iD.behavior.Select(context),
            iD.behavior.Lasso(context),
            iD.behavior.DragNode(context)],
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

    function positionMenu() {
        var entity = singular();

        if (entity && entity.type === 'node') {
            radialMenu.center(context.projection(entity.loc));
        } else {
            radialMenu.center(d3.mouse(context.surface().node()));
        }
    }

    function showMenu() {
        context.surface()
            .call(radialMenu.close)
            .call(radialMenu);
    }

    mode.selection = function() {
        return selection;
    };

    mode.reselect = function() {
        positionMenu();
        showMenu();
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

        keybinding.on('⎋', function() {
            context.enter(iD.modes.Browse(context));
        });

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
            inspector
                .context(context)
                .presetData(context.connection().presetData());

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
                    shift_left = d3.event.clientX - map_size[0] + inspector_size[0] + offset,
                    center = (map_size[0] / 2) + shift_left + offset;

                if (shift_left > 0 && inspector_size[1] > d3.event.clientY) {
                    context.map().centerEase(context.projection.invert([center, map_size[1]/2]));
                }
            }

            inspector
                .on('changeTags', changeTags)
                .on('close', function() { context.enter(iD.modes.Browse(context)); });
        }

        context.history()
            .on('undone.select', updateInspector)
            .on('redone.select', updateInspector);

        function updateInspector() {
            context.surface().call(radialMenu.close);

            if (_.any(selection, function(id) { return !context.entity(id); })) {
                // Exit mode if selected entity gets undone
                context.enter(iD.modes.Browse(context));

            } else if (entity) {
                var newEntity = context.entity(selection[0]);
                if (!_.isEqual(entity.tags, newEntity.tags)) {
                    inspector.tags(newEntity.tags);
                }
                entity = newEntity;
            }
        }

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

                var prev = datum.nodes[choice.index - 1],
                    next = datum.nodes[choice.index],
                    prevParents = context.graph().parentWays({ id: prev }),
                    ways = [];


                for (var i = 0; i < prevParents.length; i++) {
                    var p = prevParents[i];
                    for (var k = 0; k < p.nodes.length; k++) {
                        if (p.nodes[k] === prev) {
                            if (p.nodes[k-1] === next) {
                                ways.push({ id: p.id, index: k});
                                break;
                            } else if (p.nodes[k+1] === next) {
                                ways.push({ id: p.id, index: k+1});
                                break;
                            }
                        }
                    }
                }

                context.perform(iD.actions.AddEntity(node),
                    iD.actions.AddMidpoint({ ways: ways, loc: node.loc }, node),
                    t('operations.add.annotation.vertex'));

                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }

        function selected(entity) {
            if (!entity) return false;
            if (selection.indexOf(entity.id) >= 0) return true;
            return d3.select(this).classed('stroke') &&
                _.any(context.graph().parentRelations(entity), function(parent) {
                    return selection.indexOf(parent.id) >= 0;
                });
        }

        d3.select(document)
            .call(keybinding);

        context.surface()
            .selectAll("*")
            .filter(selected)
            .classed('selected', true);

        radialMenu = iD.ui.RadialMenu(operations);
        var show = d3.event && !initial;

        if (show) {
            positionMenu();
        }

        timeout = window.setTimeout(function() {
            if (show) {
                showMenu();
            }

            context.surface()
                .on('dblclick.select', dblclick);
        }, 200);
    };

    mode.exit = function() {
        /*
        if (singular()) {
            changeTags(singular(), inspector.tags());
        }
        */

        if (timeout) window.clearTimeout(timeout);

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
