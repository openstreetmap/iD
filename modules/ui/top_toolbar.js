
import {
    select as d3_select
} from 'd3-selection';

import _debounce from 'lodash-es/debounce';
import { uiToolAddRecent, uiToolNotes, uiToolSave, uiToolSearchAdd, uiToolSidebarToggle, uiToolUndoRedo } from './tools';


export function uiTopToolbar(context) {

    var sidebarToggle = uiToolSidebarToggle(context),
        searchAdd = uiToolSearchAdd(context),
        addRecent = uiToolAddRecent(context),
        notes = uiToolNotes(context),
        undoRedo = uiToolUndoRedo(context),
        save = uiToolSave(context);

    function notesEnabled() {
        var noteLayer = context.layers().layer('notes');
        return noteLayer && noteLayer.enabled();
    }

    function topToolbar(bar) {

        var debouncedUpdate = _debounce(update, 500, { leading: true, trailing: true });
        context.layers()
            .on('change.topToolbar', debouncedUpdate);

        update();

        function update() {

            var tools = [
                sidebarToggle,
                'spacer',
                searchAdd,
                addRecent,
                'spacer'
            ];

            if (notesEnabled()) {
                tools = tools.concat([notes, 'spacer']);
            }

            tools = tools.concat([undoRedo, save]);

            var toolbarItems = bar.selectAll('.toolbar-item')
                .data(tools, function(d) {
                    return d.id || d;
                });

            toolbarItems.exit()
                .remove();

            var itemsEnter = toolbarItems
                .enter()
                .append('div')
                .attr('class', function(d) {
                    return 'toolbar-item ' + (d.id || d).replace('_', '-');
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
                .text(function(d) {
                    return d.label;
                });
        }

    }

    return topToolbar;
}
