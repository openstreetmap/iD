
import { svgIcon } from '../svg';
import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';

import { uiFullScreen } from './full_screen';
import { uiModes } from './modes';
import { uiNotes } from './notes';
import { uiSave } from './save';
import { uiSearchAdd } from './search_add';
import { uiTooltipHtml } from './tooltipHtml';
import { uiUndoRedo } from './undo_redo';


export function uiTopToolbar(context) {


    function topToolbar(bar) {

        // Leading area button group (Sidebar toggle)
        var leadingArea = bar
            .append('div')
            .attr('class', 'tool-group leading-area');

        var sidebarButton = leadingArea
            .append('div')
            .append('button')
            .attr('class', 'sidebar-toggle bar-button')
            .attr('tabindex', -1)
            .on('click', function() {
                context.ui().sidebar.toggle();
            })
            .call(tooltip()
                .placement('bottom')
                .html(true)
                .title(uiTooltipHtml(t('sidebar.tooltip'), t('sidebar.key')))
            );

        var iconSuffix = textDirection === 'rtl' ? 'right' : 'left';
        sidebarButton
            .call(svgIcon('#iD-icon-sidebar-' + iconSuffix));

        leadingArea
            .append('div')
            .attr('class', 'full-screen bar-group')
            .call(uiFullScreen(context));


        // Center area button group (Point/Line/Area/Note mode buttons)
        var centerArea = bar
            .append('div')
            .attr('class', 'tool-group center-area');

        var addArea = centerArea.append('div')
            .attr('class', 'search-add');

        addArea.call(uiSearchAdd(context), bar);
        addArea.call(uiModes(context), bar);

        centerArea.append('div')
            .attr('class', 'notes')
            .call(uiNotes(context), bar);


        // Trailing area button group (Undo/Redo save buttons)
        var trailingArea = bar
            .append('div')
            .attr('class', 'tool-group trailing-area');

        trailingArea
            .append('div')
            .attr('class', 'joined')
            .call(uiUndoRedo(context));

        trailingArea
            .append('div')
            .attr('class', 'save-wrap')
            .call(uiSave(context));
    }

    return topToolbar;
}
