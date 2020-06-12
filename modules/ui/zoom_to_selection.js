import { event as d3_event } from 'd3-selection';

import { t, localizer } from '../core/localizer';
import { uiTooltip } from './tooltip';
import { svgIcon } from '../svg/icon';

export function uiZoomToSelection(context) {

    function isDisabled() {
        var mode = context.mode();
        return !mode || !mode.zoomToSelected;
    }

    function click() {
        d3_event.preventDefault();

        if (isDisabled()) return;

        var mode = context.mode();
        if (mode && mode.zoomToSelected) {
            mode.zoomToSelected();
        }
    }

    return function(selection) {

        var tooltipBehavior = uiTooltip()
            .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            .title(function() {
                if (isDisabled()) {
                    return t('inspector.zoom_to.no_selection');
                }
                return t('inspector.zoom_to.title');
            })
            .keys([t('inspector.zoom_to.key')]);

        var button = selection
            .append('button')
            .on('click', click)
            .call(svgIcon('#iD-icon-framed-dot', 'light'))
            .call(tooltipBehavior);

        function setEnabledState() {
            button.classed('disabled', isDisabled());
            if (!button.select('.tooltip.in').empty()) {
                button.call(tooltipBehavior.updateContent);
            }
        }

        context.on('enter.uiZoomToSelection', setEnabledState);

        setEnabledState();
    };
}
