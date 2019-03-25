
import { t, textDirection } from '../../util/locale';
import { svgIcon } from '../../svg';
import { uiTooltipHtml } from '../tooltipHtml';
import { tooltip } from '../../util/tooltip';

export function uiToolSidebarToggle(context) {

    var tool = {
        id: 'sidebar_toggle',
        label: t('toolbar.inspect')
    };

    tool.render = function(selection) {
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

    return tool;
}
