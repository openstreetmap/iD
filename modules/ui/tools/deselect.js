import {
    event as d3_event,
} from 'd3-selection';

import { modeBrowse } from '../../modes/browse';
import { svgIcon } from '../../svg';
import { uiTooltipHtml } from '../tooltipHtml';
import { t } from '../../util/locale';
import { tooltip } from '../../util/tooltip';

export function uiToolDeselect(context) {

    var tool = {
        id: 'deselect',
        label: t('toolbar.deselect.title')
    };

    tool.render = function(selection) {

        var tooltipBehavior = tooltip()
            .placement('bottom')
            .html(true)
            .title(uiTooltipHtml(null, 'Esc'));

        selection
            .append('button')
            .attr('class', 'bar-button')
            .attr('tabindex', -1)
            .call(tooltipBehavior)
            .on('click', function() {
                d3_event.stopPropagation();
                context.enter(modeBrowse(context));
            })
            .call(svgIcon('#iD-icon-close'));
    };

    return tool;
}
