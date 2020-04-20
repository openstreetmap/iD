import { event as d3_event } from 'd3-selection';

import { t } from '../core/localizer';
import { uiTooltip } from './tooltip';


export function uiFeatureInfo(context) {
    function update(selection) {
        var features = context.features();
        var stats = features.stats();
        var count = 0;
        var hiddenList = features.hidden().map(function(k) {
            if (stats[k]) {
                count += stats[k];
                return String(stats[k]) + ' ' + t('feature.' + k + '.description');
            }
        }).filter(Boolean);

        selection.html('');

        if (hiddenList.length) {
            var tooltipBehavior = uiTooltip()
                .placement('top')
                .title(function() {
                    return hiddenList.join('<br/>');
                });

            selection.append('a')
                .attr('class', 'chip')
                .attr('href', '#')
                .attr('tabindex', -1)
                .html(t('feature_info.hidden_warning', { count: count }))
                .call(tooltipBehavior)
                .on('click', function() {
                    tooltipBehavior.hide();
                    d3_event.preventDefault();
                    // open the Map Data pane
                    context.ui().togglePanes(context.container().select('.map-panes .map-data-pane'));
                });
        }

        selection
            .classed('hide', !hiddenList.length);
    }


    return function(selection) {
        update(selection);

        context.features().on('change.feature_info', function() {
            update(selection);
        });
    };
}
