import {
    select as d3_select
} from 'd3-selection';

import { debounce } from 'es-toolkit';
import { uiToolDrawModes, uiToolNotes, uiToolSave, uiToolSidebarToggle, uiToolUndoRedo } from './tools';
import type { coreContext } from '../core';
import type { UiTool } from './tools/types.def';

type ToolbarItem = UiTool | 'spacer';

export function uiTopToolbar(context: coreContext) {

    var sidebarToggle = uiToolSidebarToggle(context),
        modes = uiToolDrawModes(context),
        notes = uiToolNotes(context),
        undoRedo = uiToolUndoRedo(context),
        save = uiToolSave(context);

    function notesEnabled() {
        var noteLayer = context.layers().layer('notes');
        return noteLayer && noteLayer.enabled();
    }

    function topToolbar(bar: d3.Selection) {

        bar.on('wheel.topToolbar', function(d3_event) {
            if (!d3_event.deltaX) {
                // translate vertical scrolling into horizontal scrolling in case
                // the user doesn't have an input device that can scroll horizontally
                bar.node()!.scrollLeft += d3_event.deltaY;
            }
        });

        var debouncedUpdate = debounce(update, 500, { edges: ['leading', 'trailing'] });
        context.layers()
            .on('change.topToolbar', debouncedUpdate);

        update();

        function update() {

            var tools: (ToolbarItem)[] = [
                sidebarToggle,
                'spacer',
                modes
            ];

            tools.push('spacer');

            if (notesEnabled()) {
                tools = tools.concat([notes, 'spacer']);
            }

            tools = tools.concat([undoRedo, save]);

            var toolbarItems = bar.selectAll<HTMLElement, ToolbarItem>('.toolbar-item')
                .data(tools, function(d) {
                    return typeof d === 'string' ? d : d.id;
                });

            toolbarItems.exit<ToolbarItem>()
                .each(function(d) {
                    if (d !== 'spacer' && d.uninstall) {
                        d.uninstall();
                    }
                })
                .remove();

            var itemsEnter = toolbarItems
                .enter()
                .append('div')
                .attr('class', function(d) {
                    var classes = 'toolbar-item ' + (d === 'spacer' ? d : d.id).replaceAll('_', '-');
                    if (d !== 'spacer' && d.klass) classes += ' ' + d.klass;
                    return classes;
                });

            var actionableItems = itemsEnter.filter(function(d) { return d !== 'spacer'; });

            actionableItems
                .append('div')
                .attr('class', 'item-content')
                .each(function(d) {
                    if (d === 'spacer') return;
                    d3_select(this).call(d.render);
                });

            actionableItems
                .append('div')
                .attr('class', 'item-label')
                .each(function(d) {
                    if (d === 'spacer') return;
                    d.label(d3_select(this));
                });
        }

    }

    return topToolbar;
}
