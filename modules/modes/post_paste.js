import * as d3 from 'd3';
import _ from 'lodash';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { behaviorBreathe, behaviorHover, behaviorSelect } from '../behavior/index';
import { geoExtent,  geoPointInPolygon } from '../geo/index';
import { modeBrowse } from './browse';
import * as Operations from '../operations/index';
import { uiRadialMenu, uiSelectionList } from '../ui/index';

export function modePostPaste(context, selectedIDs) {
    var mode = {
        id: 'post-paste',
        button: 'browse'
    };

    var keybinding = d3keybinding('postPaste');
    var behaviors = [
        behaviorBreathe(context),
        behaviorHover(context),
        behaviorSelect(context)
    ];
    var radialMenu = null;
    var suppressMenu = false;
    var timeout = null;

    function closeMenu() {
        if (radialMenu) {
            context.surface().call(radialMenu.close);
        }
    }

    function singular() {
        if (selectedIDs.length === 1) {
            return context.hasEntity(selectedIDs[0]);
        }
    }

    function positionMenu() {
        if (suppressMenu || !radialMenu) {
            return;
        }

        var entity = singular();
        if (entity && context.geometry(entity.id) === 'relation') {
            suppressMenu = true;
        } else if (entity && entity.type === 'node') {
            radialMenu.center(context.projection(entity.loc));
        } else {
            var point = context.mouse(),
                viewport = geoExtent(context.projection.clipExtent()).polygon();
            if (geoPointInPolygon(point, viewport)) {
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

    // This is called by the select behavior
    mode.suppressMenu = function(_) {
        if (!arguments.length) return suppressMenu;
        suppressMenu = _;
        return mode;
    };

    mode.reselect = function() {
        var surfaceNode = context.surface().node();
        if (surfaceNode.focus) {   // FF doesn't support it
            surfaceNode.focus();
        }

        positionMenu();
        showMenu();
    };

    mode.selectedIDs = function() {
        return selectedIDs;
    };

    mode.enter = function () {
        function esc() {
            context.enter(modeBrowse(context));
        }

        behaviors.forEach(function (behavior) {
            context.install(behavior);
        });

        var operations = _.without(d3.values(Operations), Operations.operationDelete)
                .map(function(o) { return o(selectedIDs, context); })
                .filter(function(o) { return o.available(); });

        operations.unshift(Operations.operationDelete(selectedIDs, context));

        keybinding
            .on('⎋', esc)
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

        radialMenu = uiRadialMenu(context, operations);

        // Exit this mode when any movement is made on the map
        context.map()
            .on('move.select', esc);

        var show = d3.event && !suppressMenu;

        if (show) {
            positionMenu();
        }

        timeout = window.setTimeout(function() {
            if (show) {
                showMenu();
            }
        }, 200);

        // Display summary of selected elements in the side bar
        if (selectedIDs.length > 1) {
            var entities = uiSelectionList(context, selectedIDs);
            context.ui().sidebar.show(entities);
        }

        // Start with menu open
        toggleMenu();
    };

    mode.exit = function() {
        if (timeout) window.clearTimeout(timeout);

        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        keybinding.off();
        closeMenu();
        radialMenu = undefined;

        // Detach event listener
        context.map().on('move.select', null);
        context.ui().sidebar.hide();
    };

    return mode;
}