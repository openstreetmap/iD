import {
    select as d3_select
} from 'd3-selection';

import { svgIcon } from '../../svg';
import { t } from '../../util/locale';

export function uiToolWaySegments(context) {

    var tool = {
        id: 'way_segments',
        contentClass: 'joined',
        label: t('toolbar.segments.title')
    };

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
                var segmentType = context.storage('line-segments') || 'straight';
                return 'bar-button ' + (segmentType === d.id ? 'active' : '');
            })
            .attr('tabindex', -1)
            .on('click', function(d) {
                if (d3_select(this).classed('active')) return;

                context.storage('line-segments', d.id);

                selection.selectAll('.bar-button')
                    .classed('active', false);
                d3_select(this).classed('active', true);
            })
            .each(function(d) {
                d3_select(this).call(svgIcon('#iD-segment-' + d.id, 'icon-30'));
            });
    };

    tool.update = function() {

    };

    tool.uninstall = function() {

    };

    return tool;
}
