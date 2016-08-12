import * as d3 from 'd3';
import { t } from '../util/locale';
import { tooltip } from '../util/tooltip';
import _ from 'lodash';
import { tooltipHtml } from './tooltipHtml';
export function FeatureInfo(context) {
    function update(selection) {
        var features = context.features(),
            stats = features.stats(),
            count = 0,
            hiddenList = _.compact(_.map(features.hidden(), function(k) {
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
                        return tooltipHtml(hiddenList.join('<br/>'));
                    });

            var warning = selection.append('a')
                .attr('href', '#')
                .attr('tabindex', -1)
                .html(t('feature_info.hidden_warning', { count: count }))
                .call(tooltipBehavior)
                .on('click', function() {
                    tooltipBehavior.hide(warning);
                    // open map data panel?
                    d3.event.preventDefault();
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
