import _compact from 'lodash-es/compact';
import _map from 'lodash-es/map';
import _difference from 'lodash-es/difference';

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
            })),
            hiddenNotesList = [];


        var notes = context.layers().layer('notes');

        if (notes.enabled()) {
            hiddenNotesList = _difference(notes.data(), notes.filteredData());
        }

        selection.html('');

        if (hiddenList.length || hiddenNotesList.length) {
            var hiddenItems = hiddenList.join('<br/>');
            if (hiddenNotesList) {
                if (hiddenList.length) { hiddenItems += '<br/>'; }
                hiddenItems += hiddenNotesList.length + t('feature_info.notes');
            }

            var tooltipBehavior = tooltip()
                .placement('top')
                .html(true)
                .title(function() {
                    return uiTooltipHtml(hiddenItems);
                });

            var warning = selection.append('a')
                .attr('href', '#')
                .attr('tabindex', -1)
                .html(function () {
                    var warning = '';

                    if (hiddenList.length) { warning += t('feature_info.hidden_warning', { count: count }); }
                    if (hiddenList.length && hiddenNotesList.length) { warning += t('feature_info.both_hidden'); }
                    if (hiddenNotesList.length) { warning += t('feature_info.hidden_note_warning', { count: hiddenNotesList.length }); }

                    return warning;
                })
                .call(tooltipBehavior)
                .on('click', function() {
                    tooltipBehavior.hide(warning);
                    // open map data panel?
                    d3_event.preventDefault();
                });
        }

        selection
            .classed('hide', !hiddenList.length && !hiddenNotesList.length);
    }


    return function(selection) {
        update(selection);

        context.features().on('change.feature_info', function() {
            update(selection);
        });
    };
}
