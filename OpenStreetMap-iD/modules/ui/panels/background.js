import _debounce from 'lodash-es/debounce';

import { t } from '../../core/localizer';


export function uiPanelBackground(context) {
    var background = context.background();
    var _currSourceName = null;
    var _metadata = {};
    var _metadataKeys = [
        'zoom', 'vintage', 'source', 'description', 'resolution', 'accuracy'
    ];

    var debouncedRedraw = _debounce(redraw, 250);

    function redraw(selection) {
        var source = background.baseLayerSource();
        if (!source) return;

        var isDG = (source.id.match(/^DigitalGlobe/i) !== null);

        var sourceLabel = source.label();
        if (_currSourceName !== sourceLabel) {
            _currSourceName = sourceLabel;
            _metadata = {};
        }

        selection.text('');

        var list = selection
            .append('ul')
            .attr('class', 'background-info');

        list
            .append('li')
            .call(_currSourceName);

        _metadataKeys.forEach(function(k) {
            // DigitalGlobe vintage is available in raster layers for now.
            if (isDG && k === 'vintage') return;

            list
                .append('li')
                .attr('class', 'background-info-list-' + k)
                .classed('hide', !_metadata[k])
                .call(t.append('info_panels.background.' + k, { suffix: ':' }))
                .append('span')
                .attr('class', 'background-info-span-' + k)
                .text(_metadata[k]);
        });

        debouncedGetMetadata(selection);

        var toggleTiles = context.getDebug('tile') ? 'hide_tiles' : 'show_tiles';

        selection
            .append('a')
            .call(t.append('info_panels.background.' + toggleTiles))
            .attr('href', '#')
            .attr('class', 'button button-toggle-tiles')
            .on('click', function(d3_event) {
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
                .call(t.append('info_panels.background.' + toggleVintage))
                .attr('href', '#')
                .attr('class', 'button button-toggle-vintage')
                .on('click', function(d3_event) {
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

        var sourceName = _currSourceName;
        var d = tile.datum();
        var zoom = (d && d.length >= 3 && d[2]) || Math.floor(context.map().zoom());
        var center = context.map().center();

        // update zoom
        _metadata.zoom = String(zoom);
        selection.selectAll('.background-info-list-zoom')
            .classed('hide', false)
            .selectAll('.background-info-span-zoom')
            .text(_metadata.zoom);

        if (!d || !d.length >= 3) return;

        background.baseLayerSource().getMetadata(center, d, function(err, result) {
            if (err || _currSourceName !== sourceName) return;

            // update vintage
            var vintage = result.vintage;
            _metadata.vintage = (vintage && vintage.range) || t('info_panels.background.unknown');
            selection.selectAll('.background-info-list-vintage')
                .classed('hide', false)
                .selectAll('.background-info-span-vintage')
                .text(_metadata.vintage);

            // update other _metadata
            _metadataKeys.forEach(function(k) {
                if (k === 'zoom' || k === 'vintage') return;  // done already
                var val = result[k];
                _metadata[k] = val;
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
    panel.label = t.append('info_panels.background.title');
    panel.key = t('info_panels.background.key');


    return panel;
}
