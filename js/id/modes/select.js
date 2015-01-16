iD.modes.Select = function(context, selectedIDs) {
    var mode = {
        id: 'select',
        button: 'browse'
    };

    var keybinding = d3.keybinding('select'),
        timeout = null,
        behaviors = [
            iD.behavior.Copy(context),
            iD.behavior.Paste(context),
            iD.behavior.Hover(context),
            iD.behavior.Select(context),
            iD.behavior.Lasso(context),
            iD.modes.DragNode(context)
                .selectedIDs(selectedIDs)
                .behavior],
        inspector,
        radialMenu,
        newFeature = false,
        suppressMenu = false;

    var wrap = context.container()
        .select('.inspector-wrap');


    function singular() {
        if (selectedIDs.length === 1) {
            return context.entity(selectedIDs[0]);
        }
    }

    function closeMenu() {
        if (radialMenu) {
            context.surface().call(radialMenu.close);
        }
    }

    function positionMenu() {
        if (suppressMenu || !radialMenu) { return; }

        var entity = singular();
        if (entity && context.geometry(entity.id) === 'relation') {
            suppressMenu = true;
        } else if (entity && entity.type === 'node') {
            radialMenu.center(context.projection(entity.loc));
        } else {
            var point = context.mouse(),
                viewport = iD.geo.Extent(context.projection.clipExtent()).polygon();
            if (iD.geo.pointInPolygon(point, viewport)) {
                radialMenu.center(point);
            } else {
                suppressMenu = true;
            }
        }
    }

    function showMenu() {
        closeMenu();
        if (!suppressMenu && radialMenu) {
            context.surface().call(radialMenu);
        }
    }

    mode.selectedIDs = function() {
        return selectedIDs;
    };

    mode.reselect = function() {
        var surfaceNode = context.surface().node();
        if (surfaceNode.focus) { // FF doesn't support it
            surfaceNode.focus();
        }

        positionMenu();
        showMenu();
    };

    mode.newFeature = function(_) {
        if (!arguments.length) return newFeature;
        newFeature = _;
        return mode;
    };

    mode.suppressMenu = function(_) {
        if (!arguments.length) return suppressMenu;
        suppressMenu = _;
        return mode;
    };

    mode.enter = function() {
        function update() {
            closeMenu();
            if (_.any(selectedIDs, function(id) { return !context.hasEntity(id); })) {
                // Exit mode if selected entity gets undone
                context.enter(iD.modes.Browse(context));
            }
        }

        function dblclick() {
            var target = d3.select(d3.event.target),
                datum = target.datum();

            if (datum instanceof iD.Way && !target.classed('fill')) {
                var choice = iD.geo.chooseEdge(context.childNodes(datum), context.mouse(), context.projection),
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

        function selectElements(drawn) {
            var entity = singular();
            if (entity && context.geometry(entity.id) === 'relation') {
                suppressMenu = true;
                return;
            }

            var selection = context.surface()
                    .selectAll(iD.util.entityOrMemberSelector(selectedIDs, context.graph()));

            if (selection.empty()) {
                if (drawn) {  // Exit mode if selected DOM elements have disappeared..
                    context.enter(iD.modes.Browse(context));
                }
            } else {
                selection
                    .classed('selected', true);
            }
        }


        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        var operations = _.without(d3.values(iD.operations), iD.operations.Delete)
                .map(function(o) { return o(selectedIDs, context); })
                .filter(function(o) { return o.available(); });

        operations.unshift(iD.operations.Delete(selectedIDs, context));

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

        d3.select(document)
            .call(keybinding);

        radialMenu = iD.ui.RadialMenu(context, operations);

        context.ui().sidebar
            .select(singular() ? singular().id : null, newFeature);

        context.history()
            .on('undone.select', update)
            .on('redone.select', update);

        context.map()
            .on('move.select', closeMenu)
            .on('drawn.select', selectElements);

        selectElements();

        var show = d3.event && !suppressMenu;

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

        if (selectedIDs.length > 1) {
            var entities = iD.ui.SelectionList(context, selectedIDs);
            context.ui().sidebar.show(entities);
        }
    };

    mode.exit = function() {
        if (timeout) window.clearTimeout(timeout);

        if (inspector) wrap.call(inspector.close);

        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        keybinding.off();
        closeMenu();
        radialMenu = undefined;

        context.history()
            .on('undone.select', null)
            .on('redone.select', null);

        context.surface()
            .on('dblclick.select', null)
            .selectAll('.selected')
            .classed('selected', false);

        context.map().on('drawn.select', null);
        context.ui().sidebar.hide();
    };

    return mode;
};
