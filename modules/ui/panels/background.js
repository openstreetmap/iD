import _debounce from 'lodash-es/debounce';

import {
    event as d3_event
} from 'd3-selection';

import { t } from '../../core/localizer';


export function uiPanelBackground(context) {
    var background = context.background();
    var currSourceName = null;
    var metadata = {};
    var metadataKeys = [
        'zoom', 'vintage', 'source', 'description', 'resolution', 'accuracy'
    ];

    var debouncedRedraw = _debounce(redraw, 250);

    function redraw(selection) {
        var source = background.baseLayerSource();
        if (!source) return;

        var isDG = (source.id.match(/^DigitalGlobe/i) !== null);

        if (currSourceName !== source.name()) {
            currSourceName = source.name();
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
            // DigitalGlobe vintage is available in raster layers for now.
            if (isDG && k === 'vintage') return;

            list
                .append('li')
                .attr('class', 'background-info-list-' + k)
                .classed('hide', !metadata[k])
                .text(t('info_panels.background.' + k) + ':')
                .append('span')
                .attr('class', 'background-info-span-' + k)
                .text(metadata[k]);
        });

        debouncedGetMetadata(selection);

        var toggleTiles = context.getDebug('tile') ? 'hide_tiles' : 'show_tiles';

        selection
            .append('a')
            .text(t('info_panels.background.' + toggleTiles))
            .attr('href', '#')
            .attr('class', 'button button-toggle-tiles')
            .on('click', function() {
                d3_event.preventDefault();
                context.setDebug('tile', !context.getDebug('tile'));
                selection.call(redraw);
            });

        if (isDG) {
            var key = source.id + '-vintage';
            var sourceVintage = context.background().findSource(key);
            var showsVintage = context.background().showsLayer(sourceVintage);
            var toggleVintage = showsVintage ? 'hide_vintage' : 'show_vintage';
            selection
                .append('a')
                .text(t('info_panels.background.' + toggleVintage))
                .attr('href', '#')
                .attr('class', 'button button-toggle-vintage')
                .on('click', function() {
                    d3_event.preventDefault();
                    context.background().toggleOverlayLayer(sourceVintage);
                    selection.call(redraw);
                });
        }

        // disable if necessary
        ['DigitalGlobe-Premium', 'DigitalGlobe-Standard'].forEach(function(layerId) {
            if (source.id !== layerId) {
                var key = layerId + '-vintage';
                var sourceVintage = context.background().findSource(key);
                if (context.background().showsLayer(sourceVintage)) {
                    context.background().toggleOverlayLayer(sourceVintage);
                }
            }
        });
    }


    var debouncedGetMetadata = _debounce(getMetadata, 250);

    function getMetadata(selection) {
        var tile = context.container().select('.layer-background img.tile-center');   // tile near viewport center
        if (tile.empty()) return;

        var sourceName = currSourceName;
        var d = tile.datum();
        var zoom = (d && d.length >= 3 && d[2]) || Math.floor(context.map().zoom());
        var center = context.map().center();

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

            // update other metadata
            metadataKeys.forEach(function(k) {
                if (k === 'zoom' || k === 'vintage') return;  // done already
                var val = result[k];
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
