
import { t, textDirection } from '../../util/locale';
import { svgIcon } from '../../svg';
import { uiTooltipHtml } from '../tooltipHtml';
import { tooltip } from '../../util/tooltip';

export function uiToolTaskingToggle(context) {

    var tool = {
        id: 'tasking_toggle',
        label: t('toolbar.tasking')
    };

    tool.render = function(selection) {
        selection
            .append('button')
            .attr('class', 'bar-button')
            .attr('tabindex', -1)
            .on('click', function() {
                context.ui().tasking.toggle();
            })
            .call(tooltip()
                .placement('bottom')
                .html(true)
                .title(uiTooltipHtml(t('tasking.tooltip'), t('tasking.key')))
            )
            .call(svgIcon('#iD-icon-sidebar-' + (textDirection === 'rtl' ? 'right' : 'left'))); // TODO: add a new tasking manager icon - TAH
    };

    return tool;
}
