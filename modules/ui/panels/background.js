import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';


export function uiPanelBackground(context) {
    var background = context.background();
    var currSourceName = null;
    var metadata = {};
    var metadataKeys = [
        'zoom', 'vintage', 'source', 'description', 'resolution', 'accuracy'
    ];

    var debouncedRedraw = _.debounce(redraw, 250);

    function redraw(selection) {
        if (currSourceName !== background.baseLayerSource().name()) {
            currSourceName = background.baseLayerSource().name();
            metadata = {};
        }

        selection.html('');

        var list = selection
            .append('ul')
            .attr('class', 'background-info');

        list
            .append('li')
            .text(currSourceName);

        metadataKeys.forEach(function(k) {
            list
                .append('li')
                .attr('class', 'background-info-list-' + k)
                .classed('hide', !metadata[k])
                .text(t('info_panels.background.' + k) + ': ')
                .append('span')
                .attr('class', 'background-info-span-' + k)
                .text(metadata[k]);
        });

        if (!metadata.zoom) {
            debouncedGetMetadata(selection);
        }

        var toggle = context.getDebug('tile') ? 'hide_tiles' : 'show_tiles';

        selection
            .append('a')
            .text(t('info_panels.background.' + toggle))
            .attr('href', '#')
            .attr('class', 'button button-toggle-tiles')
            .on('click', function() {
                d3.event.preventDefault();
                context.setDebug('tile', !context.getDebug('tile'));
                selection.call(redraw);
            });
    }


    var debouncedGetMetadata = _.debounce(getMetadata, 250);

    function getMetadata(selection) {
        var tile = d3.select('.layer-background img.tile-center');   // tile near viewport center
        if (tile.empty()) return;

        var sourceName = currSourceName,
            d = tile.datum(),
            zoom = (d && d.length >= 3 && d[2]) || Math.floor(context.map().zoom()),
            center = context.map().center();

        // update zoom
        metadata.zoom = String(zoom);
        selection.selectAll('.background-info-list-zoom')
            .classed('hide', false)
            .selectAll('.background-info-span-zoom')
            .text(metadata.zoom);

        if (!d || !d.length >= 3) return;

        background.baseLayerSource().getMetadata(center, d, function(err, result) {
            if (err || currSourceName !== sourceName) return;

            // update vintage
            var vintage = result.vintage;
            metadata.vintage = (vintage && vintage.range) || t('info_panels.background.unknown');
            selection.selectAll('.background-info-list-vintage')
                .classed('hide', false)
                .selectAll('.background-info-span-vintage')
                .text(metadata.vintage);

            // update other metdata
            _.without(metadataKeys, 'zoom', 'vintage')
                .forEach(function(k) {
                    var val = result[k];

                    // append units to numeric data
                    if (k === 'resolution' || k === 'accuracy') {
                        if (val && isFinite(val)) {
                            val += ' m';
                        }
                    }

                    metadata[k] = val;
                    selection.selectAll('.background-info-list-' + k)
                        .classed('hide', !val)
                        .selectAll('.background-info-span-' + k)
                        .text(val);
                });
        });
    }


    var panel = function(selection) {
        selection.call(redraw);

        context.map()
            .on('drawn.info-background', function() {
                selection.call(debouncedRedraw);
            })
            .on('move.info-background', function() {
                selection.call(debouncedGetMetadata);
            });

    };

    panel.off = function() {
        context.map()
            .on('drawn.info-background', null)
            .on('move.info-background', null);
    };

    panel.id = 'background';
    panel.title = t('info_panels.background.title');
    panel.key = t('info_panels.background.key');


    return panel;
}
