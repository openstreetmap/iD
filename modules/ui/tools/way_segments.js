import {
    select as d3_select,
    selectAll as d3_selectAll,
} from 'd3-selection';

import { svgIcon } from '../../svg/icon';
import { t } from '../../util/locale';
import { uiTooltipHtml } from '../tooltipHtml';
import { tooltip } from '../../util/tooltip';

export function uiToolWaySegments(context) {

    var key = t('toolbar.segments.key');

    var tool = {
        id: 'way_segments',
        contentClass: 'joined',
        label: t('toolbar.segments.title')
    };

    function storedSegmentType() {
        return context.storage('line-segments') || 'straight';
    }

    function setStoredSegmentType(type) {
        context.storage('line-segments', type);

        d3_selectAll('.way-segments .bar-button.active')
            .classed('active', false);
        d3_selectAll('.way-segments .bar-button.' + type).classed('active', true);
    }

    tool.render = function(selection) {

        var waySegmentTypes = [
            {
                id: 'straight'
            },
            {
                id: 'orthogonal'
            }
        ];

        var buttons = selection.selectAll('.bar-button')
            .data(waySegmentTypes)
            .enter();

        buttons
            .append('button')
            .attr('class', function(d) {
                return 'bar-button ' + d.id + ' ' + (storedSegmentType() === d.id ? 'active' : '');
            })
            .attr('tabindex', -1)
            .on('click', function(d) {
                if (d3_select(this).classed('active')) return;

                setStoredSegmentType(d.id);
            })
            .each(function(d) {
                var tooltipBehavior = tooltip()
                    .placement('bottom')
                    .html(true)
                    .title(uiTooltipHtml(t('toolbar.segments.' + d.id + '.title'), key));

                d3_select(this)
                    .call(tooltipBehavior)
                    .call(svgIcon('#iD-segment-' + d.id, 'icon-30'));
            });

        context.keybinding()
            .on(key, toggleMode, true);
    };

    function toggleMode() {
        var type = storedSegmentType() === 'orthogonal' ? 'straight' : 'orthogonal';
        setStoredSegmentType(type);
    }

    tool.uninstall = function() {
        context.keybinding()
            .off(key, true);
    };

    return tool;
}
