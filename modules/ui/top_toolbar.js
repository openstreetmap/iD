
import {
    select as d3_select
} from 'd3-selection';

import _debounce from 'lodash-es/debounce';

import { svgIcon } from '../svg';
import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';

import { uiModes } from './modes';
import { uiNotes } from './notes';
import { uiSave } from './save';
import { uiSearchAdd } from './search_add';
import { uiTooltipHtml } from './tooltipHtml';
import { uiUndoRedo } from './undo_redo';


export function uiTopToolbar(context) {

    var searchAdd = uiSearchAdd(context),
        modes = uiModes(context),
        notes = uiNotes(context),
        undoRedo = uiUndoRedo(context),
        save = uiSave(context);

    var sidebarToggle = function(selection) {

        selection
            .append('button')
            .attr('class', 'bar-button')
            .attr('tabindex', -1)
            .on('click', function() {
                context.ui().sidebar.toggle();
            })
            .call(tooltip()
                .placement('bottom')
                .html(true)
                .title(uiTooltipHtml(t('sidebar.tooltip'), t('sidebar.key')))
            )
            .call(svgIcon('#iD-icon-sidebar-' + (textDirection === 'rtl' ? 'right' : 'left')));
    };

    var itemContentByID = {
        sidebar_toggle: sidebarToggle,
        search_add: searchAdd,
        modes: modes,
        notes: notes,
        undo_redo: undoRedo,
        save: save
    };

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

            var toolbarItemIDs = [
                'sidebar_toggle',
                'spacer',
                'search_add',
                'modes',
                'spacer'
            ];

            if (notesEnabled()) {
                toolbarItemIDs = toolbarItemIDs.concat(['notes', 'spacer']);
            }

            toolbarItemIDs = toolbarItemIDs.concat(['undo_redo', 'save']);

            var toolbarItems = bar.selectAll('.toolbar-item')
                .data(toolbarItemIDs, function(d) {
                    return d;
                });

            toolbarItems.exit()
                .remove();

            toolbarItems
                .enter()
                .append('div')
                .attr('class', function(d) {
                    return 'toolbar-item ' + d.replace('_', '-');
                })
                .each(function(d) {
                    if (itemContentByID[d]) {
                        d3_select(this).call(itemContentByID[d], bar);
                    }
                });
        }

    }

    return topToolbar;
}
