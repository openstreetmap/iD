import { d3keybinding } from '../../js/lib/d3.keybinding.js';
import * as d3 from 'd3';
import { t } from '../util/locale';
import _ from 'lodash';
import * as Operations from '../operations/index';
import { Breathe, Copy, Hover, Lasso, Paste, Select as SelectBehavior } from '../behavior/index';
import { Extent, chooseEdge, pointInPolygon } from '../geo/index';
import { Node, Way } from '../core/index';
import { RadialMenu, SelectionList } from '../ui/index';
import { AddMidpoint } from '../actions/index';
import { Browse } from './browse';
import { DragNode } from './drag_node';
import { entityOrMemberSelector } from '../util/index';

export function Select(context, selectedIDs) {
    var mode = {
        id: 'select',
        button: 'browse'
    };

    var keybinding = d3keybinding('select'),
        timeout = null,
        behaviors = [
            Copy(context),
            Paste(context),
            Breathe(context),
            Hover(context),
            SelectBehavior(context),
            Lasso(context),
            DragNode(context)
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
            return context.hasEntity(selectedIDs[0]);
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
                viewport = Extent(context.projection.clipExtent()).polygon();
            if (pointInPolygon(point, viewport)) {
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

    function toggleMenu() {
        if (d3.select('.radial-menu').empty()) {
            showMenu();
        } else {
            closeMenu();
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
            if (_.some(selectedIDs, function(id) { return !context.hasEntity(id); })) {
                // Exit mode if selected entity gets undone
                context.enter(Browse(context));
            }
        }

        function dblclick() {
            var target = d3.select(d3.event.target),
                datum = target.datum();

            if (datum instanceof Way && !target.classed('fill')) {
                var choice = chooseEdge(context.childNodes(datum), context.mouse(), context.projection),
                    node = Node();

                var prev = datum.nodes[choice.index - 1],
                    next = datum.nodes[choice.index];

                context.perform(
                    AddMidpoint({loc: choice.loc, edge: [prev, next]}, node),
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
                    .selectAll(entityOrMemberSelector(selectedIDs, context.graph()));

            if (selection.empty()) {
                if (drawn) {  // Exit mode if selected DOM elements have disappeared..
                    context.enter(Browse(context));
                }
            } else {
                selection
                    .classed('selected', true);
            }
        }

        function esc() {
            if (!context.inIntro()) {
                context.enter(Browse(context));
            }
        }


        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        var operations = _.without(d3.values(Operations), Operations.Delete)
                .map(function(o) { return o(selectedIDs, context); })
                .filter(function(o) { return o.available(); });

        operations.unshift(Operations.Delete(selectedIDs, context));

        keybinding
            .on('⎋', esc, true)
            .on('space', toggleMenu);

        operations.forEach(function(operation) {
            operation.keys.forEach(function(key) {
                keybinding.on(key, function() {
                    if (!(context.inIntro() || operation.disabled())) {
                        operation();
                    }
                });
            });
        });

        d3.select(document)
            .call(keybinding);

        radialMenu = RadialMenu(context, operations);

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
            var entities = SelectionList(context, selectedIDs);
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
}
