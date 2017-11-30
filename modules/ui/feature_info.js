import _compact from 'lodash-es/compact';
import _map from 'lodash-es/map';

import { event as d3_event } from 'd3-selection';

import { t } from '../util/locale';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';


export function uiFeatureInfo(context) {
    function update(selection) {
        var features = context.features(),
            stats = features.stats(),
            count = 0,
            hiddenList = _compact(_map(features.hidden(), function(k) {
                if (stats[k]) {
                    count += stats[k];
                    return String(stats[k]) + ' ' + t('feature.' + k + '.description');
                }
            }));

        selection.html('');

        if (hiddenList.length) {
            var tooltipBehavior = tooltip()
                .placement('top')
                .html(true)
                .title(function() {
                    return uiTooltipHtml(hiddenList.join('<br/>'));
                });

            var warning = selection.append('a')
                .attr('href', '#')
                .attr('tabindex', -1)
                .html(t('feature_info.hidden_warning', { count: count }))
                .call(tooltipBehavior)
                .on('click', function() {
                    tooltipBehavior.hide(warning);
                    // open map data panel?
                    d3_event.preventDefault();
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
