import { select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { uiTooltipHtml } from './tooltipHtml';
import { svgIcon } from '../svg/icon';

export function uiZoomToSelection(context) {

    var _button = d3_select(null);

    function click() {
        if (d3_select(this).classed('disabled')) return;

        var mode = context.mode();
        if (mode && mode.zoomToSelected) {
            mode.zoomToSelected();
        }
    }

    function setEnabledState() {
        var mode = context.mode();
        var isEnabled = mode && !!mode.zoomToSelected;
        _button.classed('disabled', !isEnabled);
    }

    context.on('enter.uiZoomToSelection', setEnabledState);

    return function(selection) {

        _button = selection
            .append('button')
            .on('click', click)
            .call(svgIcon('#iD-icon-framed-dot', 'light'))
            .call(tooltip()
                .placement((textDirection === 'rtl') ? 'right' : 'left')
                .html(true)
                .title(uiTooltipHtml(t('inspector.zoom_to.title'), t('inspector.zoom_to.key')))
            );

        setEnabledState();
    };
}
