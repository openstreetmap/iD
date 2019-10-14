import { event as d3_event, select as d3_select } from 'd3-selection';

import { t } from '../util/locale';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';


export function uiFeatureInfo(context) {
    function update(selection) {
        var features = context.features();
        var stats = features.stats();
        var count = 0;
        var hiddenList = features.hidden().map(function(k) {
            if (stats[k]) {
                count += stats[k];
                return String(stats[k]) + ' ' + features.features()[k].title;
            }
        }).filter(Boolean);

        selection.html('');

        if (hiddenList.length) {
            var tooltipBehavior = tooltip()
                .placement('top')
                .html(true)
                .title(function() {
                    return uiTooltipHtml(hiddenList.join('<br/>'));
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
                    context.ui().togglePanes(d3_select('.map-panes .map-data-pane'));
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
