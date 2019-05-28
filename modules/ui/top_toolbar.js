
import {
    select as d3_select
} from 'd3-selection';

import _debounce from 'lodash-es/debounce';
import { uiToolAddFavorite, uiToolAddRecent, uiToolNotes, uiToolOperation, uiToolSave, uiToolSearchAdd, uiToolSidebarToggle, uiToolUndoRedo } from './tools';
import { uiToolDeselect } from './tools/deselect';

export function uiTopToolbar(context) {

    var sidebarToggle = uiToolSidebarToggle(context),
        deselect = uiToolDeselect(context),
        searchAdd = uiToolSearchAdd(context),
        addFavorite = uiToolAddFavorite(context),
        addRecent = uiToolAddRecent(context),
        notes = uiToolNotes(context),
        undoRedo = uiToolUndoRedo(context),
        save = uiToolSave(context);

    var supportedOperationIDs = ['circularize', 'delete', 'disconnect', 'merge', 'orthogonalize', 'split', 'straighten'];

    var operationToolsByID = {};

    function notesEnabled() {
        var noteLayer = context.layers().layer('notes');
        return noteLayer && noteLayer.enabled();
    }

    function operationTool(operation) {
        if (!operationToolsByID[operation.id]) {
            // cache the tools
            operationToolsByID[operation.id] = uiToolOperation(context);
        }
        var tool = operationToolsByID[operation.id];
        tool.setOperation(operation);
        return tool;
    }

    function toolsToShow() {

        var tools = [];

        var mode = context.mode();
        if (mode &&
            mode.id === 'select' &&
            !mode.newFeature() &&
            mode.selectedIDs().every(function(id) { return context.graph().hasEntity(id); })) {

            tools.push(sidebarToggle);
            tools.push('spacer-half');

            tools.push(deselect);
            tools.push('spacer');

            var operationTools = [];
            var operations = mode.operations().filter(function(operation) {
                return supportedOperationIDs.indexOf(operation.id) !== -1;
            });
            var deleteTool;
            for (var i in operations) {
                var operation = operations[i];
                var tool = operationTool(operation);
                if (operation.id !== 'delete') {
                    operationTools.push(tool);
                } else {
                    deleteTool = tool;
                }
            }
            if (operationTools.length > 0) {
                tools = tools.concat(operationTools);
                tools.push('spacer');
            }
            if (deleteTool) {
                // give the delete button its own space
                tools.push(deleteTool);
                tools.push('spacer');
            }
        } else {
            tools.push(sidebarToggle);
            tools.push('spacer');

            tools.push(searchAdd);

            if (context.presets().getFavorites().length > 0) {
                tools.push(addFavorite);
            }

            if (addRecent.shouldShow()) {
                tools.push(addRecent);
            }

            tools.push('spacer');

            if (notesEnabled()) {
                tools = tools.concat([notes, 'spacer-flex']);
            }
        }
        tools = tools.concat([undoRedo, save]);

        return tools;
    }

    function topToolbar(bar) {

        var debouncedUpdate = _debounce(update, 250, { leading: true, trailing: true });
        context.history()
            .on('change.topToolbar', debouncedUpdate);
        context.layers()
            .on('change.topToolbar', debouncedUpdate);
        context.map()
            .on('move.topToolbar', debouncedUpdate)
            .on('drawn.topToolbar', debouncedUpdate);

        context.on('enter.topToolbar', update);

        context.presets()
            .on('favoritePreset.topToolbar', update)
            .on('recentsChange.topToolbar', update);


        update();

        function update() {

            var tools = toolsToShow();

            var toolbarItems = bar.selectAll('.toolbar-item')
                .data(tools, function(d) {
                    return d.id || d;
                });

            toolbarItems.exit()
                .each(function(d) {
                    if (d.uninstall) {
                        d.uninstall();
                    }
                })
                .remove();

            var itemsEnter = toolbarItems
                .enter()
                .append('div')
                .attr('class', function(d) {
                    var classes = 'toolbar-item ' + (d.id || d).replace('_', '-');
                    if (d.klass) classes += ' ' + d.klass;
                    return classes;
                });

            var actionableItems = itemsEnter.filter(function(d) { return typeof d !== 'string'; });

            actionableItems
                .append('div')
                .attr('class', 'item-content')
                .each(function(d) {
                    d3_select(this).call(d.render, bar);
                });

            actionableItems
                .append('div')
                .attr('class', 'item-label')
                .text(function(d) {
                    return d.label;
                });

            toolbarItems.merge(itemsEnter)
                .each(function(d){
                    if (d.update) d.update();
                });
        }

    }

    return topToolbar;
}
