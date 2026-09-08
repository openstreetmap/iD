import {
    select as d3_select
} from 'd3-selection';

import { debounce } from 'es-toolkit';
import { uiToolDrawModes, uiToolNotes, uiToolSave, uiToolSidebarToggle, uiToolSplit, uiToolUndoRedo } from './tools';


export function uiTopToolbar(context) {

    var sidebarToggle = uiToolSidebarToggle(context),
        modes = uiToolDrawModes(context),
        split = uiToolSplit(context),
        notes = uiToolNotes(context),
        undoRedo = uiToolUndoRedo(context),
        save = uiToolSave(context);

    function notesEnabled() {
        var noteLayer = context.layers().layer('notes');
        return noteLayer && noteLayer.enabled();
    }

    function topToolbar(bar) {

        bar.on('wheel.topToolbar', function(d3_event) {
            if (!d3_event.deltaX) {
                // translate vertical scrolling into horizontal scrolling in case
                // the user doesn't have an input device that can scroll horizontally
                bar.node().scrollLeft += d3_event.deltaY;
            }
        });

        var debouncedUpdate = debounce(update, 500, { edges: ['leading', 'trailing'] });
        context.layers()
            .on('change.topToolbar', debouncedUpdate);

        update();

        function update() {

            var tools = [
                sidebarToggle,
                'spacer',
                modes,
                split
            ];

            tools.push('spacer');

            if (notesEnabled()) {
                tools = tools.concat([notes, 'spacer']);
            }

            tools = tools.concat([undoRedo, save]);

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
                    var classes = 'toolbar-item ' + (d.id || d).replaceAll('_', '-');
                    if (d.klass) classes += ' ' + d.klass;
                    return classes;
                });

            var actionableItems = itemsEnter.filter(function(d) { return d !== 'spacer'; });

            actionableItems
                .append('div')
                .attr('class', 'item-content')
                .each(function(d) {
                    d3_select(this).call(d.render, bar);
                });

            actionableItems
                .append('div')
                .attr('class', 'item-label')
                .each(function(d) { d.label(d3_select(this)); });
        }

    }

    return topToolbar;
}
