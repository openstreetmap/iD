import _debounce from 'lodash-es/debounce';

import { t } from '../../core/localizer';


export function uiPanelBackground(context) {
    const background = context.background();
    let _currSourceName = null;
    let _metadata = {};
    const _metadataKeys = [
        'zoom', 'vintage', 'source', 'description', 'resolution', 'accuracy'
    ];

    const debouncedRedraw = _debounce(redraw, 250);

    function redraw(selection) {
        const source = background.baseLayerSource();
        if (!source) return;

        const isDG = (source.id.match(/^DigitalGlobe/i) !== null);

        const sourceLabel = source.label();
        if (_currSourceName !== sourceLabel) {
            _currSourceName = sourceLabel;
            _metadata = {};
        }

        selection.text('');

        const list = selection
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

        const toggleTiles = context.getDebug('tile') ? 'hide_tiles' : 'show_tiles';

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
            const key = source.id + '-vintage';
            const sourceVintage = context.background().findSource(key);
            const showsVintage = context.background().showsLayer(sourceVintage);
            const toggleVintage = showsVintage ? 'hide_vintage' : 'show_vintage';
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
                const key = layerId + '-vintage';
                const sourceVintage = context.background().findSource(key);
                if (context.background().showsLayer(sourceVintage)) {
                    context.background().toggleOverlayLayer(sourceVintage);
                }
            }
        });
    }


    const debouncedGetMetadata = _debounce(getMetadata, 250);

    function getMetadata(selection) {
        const tile = context.container().select('.layer-background img.tile-center');   // tile near viewport center
        if (tile.empty()) return;

        const sourceName = _currSourceName;
        const d = tile.datum();
        const zoom = (d && d.length >= 3 && d[2]) || Math.floor(context.map().zoom());
        const center = context.map().center();

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
            const vintage = result.vintage;
            _metadata.vintage = (vintage && vintage.range) || t('info_panels.background.unknown');
            selection.selectAll('.background-info-list-vintage')
                .classed('hide', false)
                .selectAll('.background-info-span-vintage')
                .text(_metadata.vintage);

            // update other _metadata
            _metadataKeys.forEach(function(k) {
                if (k === 'zoom' || k === 'vintage') return;  // done already
                const val = result[k];
                _metadata[k] = val;
                selection.selectAll('.background-info-list-' + k)
                    .classed('hide', !val)
                    .selectAll('.background-info-span-' + k)
                    .text(val);
            });
        });
    }


    const panel = function(selection) {
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
