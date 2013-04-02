iD.modes.Select = function(context, selection, initial) {
    var mode = {
        id: 'select',
        button: 'browse'
    };

    // Selecting non-multipolygon relations is not supported
    selection = selection.filter(function(d) {
        return context.entity(d).geometry(context.graph()) !== 'relation';
    });

    if (!selection.length) return iD.modes.Browse(context);

    var inspector = iD.ui.Inspector(context, singular()),
        keybinding = d3.keybinding('select'),
        timeout = null,
        behaviors = [
            iD.behavior.Hover(),
            iD.behavior.Select(context),
            iD.behavior.Lasso(context),
            iD.modes.DragNode(context).behavior],
        radialMenu;

    var wrap = context.container()
        .select('.inspector-wrap');

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
        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        var operations = _.without(d3.values(iD.operations), iD.operations.Delete)
            .map(function(o) { return o(selection, context); })
            .filter(function(o) { return o.available(); });
        operations.unshift(iD.operations.Delete(selection, context));

        keybinding.on('⎋', function() {
            context.enter(iD.modes.Browse(context));
        }, true);

        operations.forEach(function(operation) {
            operation.keys.forEach(function(key) {
                keybinding.on(key, function() {
                    if (!operation.disabled()) {
                        operation();
                    }
                });
            });
        });

        var q = iD.util.stringQs(location.hash.substring(1));
        location.replace('#' + iD.util.qsString(_.assign(q, {
            id: selection.join(',')
        }), true));

        if (singular()) {
            wrap.call(inspector);
        }

        context.history()
            .on('undone.select', update)
            .on('redone.select', update);

        function update() {
            context.surface().call(radialMenu.close);

            if (_.any(selection, function(id) { return !context.entity(id); })) {
                // Exit mode if selected entity gets undone
                context.enter(iD.modes.Browse(context));
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
                    node = iD.Node();

                var prev = datum.nodes[choice.index - 1],
                    next = datum.nodes[choice.index];

                context.perform(
                    iD.actions.AddMidpoint({loc: choice.loc, edge: [prev, next]}, node),
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

        function selectElements() {
            context.surface()
                .selectAll("*")
                .filter(selected)
                .classed('selected', true);
        }

        context.map().on('drawn.select', selectElements);
        selectElements();

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
        if (timeout) window.clearTimeout(timeout);

        wrap.call(inspector.close);

        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        var q = iD.util.stringQs(location.hash.substring(1));
        location.replace('#' + iD.util.qsString(_.omit(q, 'id'), true));

        keybinding.off();

        context.history()
            .on('undone.select', null)
            .on('redone.select', null);

        context.surface()
            .call(radialMenu.close)
            .on('dblclick.select', null)
            .selectAll(".selected")
            .classed('selected', false);

        context.map().on('drawn.select', null);
    };

    return mode;
};
