import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';
import {
    utilUnicodeCharsCount,
    utilCleanOsmString
} from '../util';
import { uiPopover } from './popover';


export function uiLengthIndicator(maxChars) {
    var _wrap = d3_select(null);
    var _tooltip = uiPopover('tooltip max-length-warning')
        .placement('bottom')
        .hasArrow(true)
        .content(() => selection => {
            selection.text('');
            t.append('inspector.max_length_reached', { maxChars })(selection);
        });

    var lengthIndicator = function(selection) {
        _wrap = selection.selectAll('span.length-indicator-wrap').data([0]);
        _wrap = _wrap.enter()
            .append('span')
            .merge(_wrap)
            .classed('length-indicator-wrap', true);
        selection.call(_tooltip);
    };

    lengthIndicator.update = function(val) {
        const strLen = utilUnicodeCharsCount(utilCleanOsmString(val, Number.POSITIVE_INFINITY));

        let indicator = _wrap.selectAll('span.length-indicator')
            .data([strLen]);

        indicator.enter()
            .append('span')
            .merge(indicator)
            .classed('length-indicator', true)
            .classed('limit-reached', d => d > maxChars)
            .style('border-right-width', d => `${Math.abs(maxChars - d) * 2}px`)
            .style('margin-right', d => d > maxChars
                ? `${(maxChars - d) * 2}px`
                : 0)
            .style('opacity', d => d > maxChars * 0.8
                ? Math.min(1, (d / maxChars - 0.8) / (1 - 0.8))
                : 0)
            .style('pointer-events', d => d > maxChars * 0.8 ? null: 'none');

        if (strLen > maxChars) {
            _tooltip.show();
        } else {
            _tooltip.hide();
        }
    };

    return lengthIndicator;
}
