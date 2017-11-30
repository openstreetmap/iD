import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';


export function uiMapData(context) {
    var key = t('map_data.key'),
        features = context.features().keys(),
        layers = context.layers(),
        fills = ['wireframe', 'partial', 'full'],
        fillDefault = context.storage('area-fill') || 'partial',
        fillSelected = fillDefault;


    function map_data(selection) {

        function showsFeature(d) {
            return context.features().enabled(d);
        }


        function autoHiddenFeature(d) {
            return context.features().autoHidden(d);
        }


        function clickFeature(d) {
            context.features().toggle(d);
            update();
        }


        function showsFill(d) {
            return fillSelected === d;
        }


        function setFill(d) {
            fills.forEach(function(opt) {
                context.surface().classed('fill-' + opt, Boolean(opt === d));
            });

            fillSelected = d;
            if (d !== 'wireframe') {
                fillDefault = d;
                context.storage('area-fill', d);
            }
            update();
        }


        function showsLayer(which) {
            var layer = layers.layer(which);
            if (layer) {
                return layer.enabled();
            }
            return false;
        }


        function setLayer(which, enabled) {
            var layer = layers.layer(which);
            if (layer) {
                layer.enabled(enabled);
                update();
            }
        }


        function toggleLayer(which) {
            setLayer(which, !showsLayer(which));
        }


        function drawPhotoItems(selection) {
            var photoKeys = ['mapillary-images', 'mapillary-signs', 'openstreetcam-images'];
            var photoLayers = layers.all().filter(function(obj) { return photoKeys.indexOf(obj.id) !== -1; });
            var data = photoLayers.filter(function(obj) { return obj.layer.supported(); });

            function layerSupported(d) {
                return d.layer && d.layer.supported();
            }
            function layerEnabled(d) {
                return layerSupported(d) && d.layer.enabled();
            }

            var ul = selection
                .selectAll('.layer-list-photos')
                .data([0]);

            ul = ul.enter()
                .append('ul')
                .attr('class', 'layer-list layer-list-photos')
                .merge(ul);

            var li = ul.selectAll('.list-item-photos')
                .data(data);

            li.exit()
                .remove();

            var liEnter = li.enter()
                .append('li')
                .attr('class', function(d) { return 'list-item-photos list-item-' + d.id; });

            var labelEnter = liEnter
                .append('label')
                .each(function(d) {
                    d3_select(this)
                        .call(tooltip()
                            .title(t(d.id.replace('-', '_') + '.tooltip'))
                            .placement('top')
                        );
                });

            labelEnter
                .append('input')
                .attr('type', 'checkbox')
                .on('change', function(d) { toggleLayer(d.id); });

            labelEnter
                .append('span')
                .text(function(d) { return t(d.id.replace('-', '_') + '.title'); });


            // Update
            li = li
                .merge(liEnter);

            li
                .classed('active', layerEnabled)
                .selectAll('input')
                .property('checked', layerEnabled);
        }


        function drawOsmItem(selection) {
            var osm = layers.layer('osm'),
                showsOsm = osm.enabled();

            var ul = selection
                .selectAll('.layer-list-osm')
                .data(osm ? [0] : []);

            // Exit
            ul.exit()
                .remove();

            // Enter
            var ulEnter = ul.enter()
                .append('ul')
                .attr('class', 'layer-list layer-list-osm');

            var liEnter = ulEnter
                .append('li')
                .attr('class', 'list-item-osm');

            var labelEnter = liEnter
                .append('label')
                .call(tooltip()
                    .title(t('map_data.layers.osm.tooltip'))
                    .placement('top')
                );

            labelEnter
                .append('input')
                .attr('type', 'checkbox')
                .on('change', function() { toggleLayer('osm'); });

            labelEnter
                .append('span')
                .text(t('map_data.layers.osm.title'));

            // Update
            ul = ul
                .merge(ulEnter);

            ul.selectAll('.list-item-osm')
                .classed('active', showsOsm)
                .selectAll('input')
                .property('checked', showsOsm);
        }


        function drawGpxItem(selection) {
            var gpx = layers.layer('gpx'),
                hasGpx = gpx && gpx.hasGpx(),
                showsGpx = hasGpx && gpx.enabled();

            var ul = selection
                .selectAll('.layer-list-gpx')
                .data(gpx ? [0] : []);

            // Exit
            ul.exit()
                .remove();

            // Enter
            var ulEnter = ul.enter()
                .append('ul')
                .attr('class', 'layer-list layer-list-gpx');

            var liEnter = ulEnter
                .append('li')
                .attr('class', 'list-item-gpx');

            liEnter
                .append('button')
                .attr('class', 'list-item-gpx-extent')
                .call(tooltip()
                    .title(t('gpx.zoom'))
                    .placement((textDirection === 'rtl') ? 'right' : 'left'))
                .on('click', function() {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                    gpx.fitZoom();
                })
                .call(svgIcon('#icon-search'));

            liEnter
                .append('button')
                .attr('class', 'list-item-gpx-browse')
                .call(tooltip()
                    .title(t('gpx.browse'))
                    .placement((textDirection === 'rtl') ? 'right' : 'left')
                )
                .on('click', function() {
                    d3_select(document.createElement('input'))
                        .attr('type', 'file')
                        .on('change', function() {
                            gpx.files(d3_event.target.files);
                        })
                        .node().click();
                })
                .call(svgIcon('#icon-geolocate'));

            var labelEnter = liEnter
                .append('label')
                .call(tooltip()
                    .title(t('gpx.drag_drop'))
                    .placement('top')
                );

            labelEnter
                .append('input')
                .attr('type', 'checkbox')
                .on('change', function() { toggleLayer('gpx'); });

            labelEnter
                .append('span')
                .text(t('gpx.local_layer'));

            // Update
            ul = ul
                .merge(ulEnter);

            ul.selectAll('.list-item-gpx')
                .classed('active', showsGpx)
                .selectAll('label')
                .classed('deemphasize', !hasGpx)
                .selectAll('input')
                .property('disabled', !hasGpx)
                .property('checked', showsGpx);
        }


        function drawList(selection, data, type, name, change, active) {
            var items = selection.selectAll('li')
                .data(data);

            // Exit
            items.exit()
                .remove();

            // Enter
            var enter = items.enter()
                .append('li')
                .attr('class', 'layer')
                .call(tooltip()
                    .html(true)
                    .title(function(d) {
                        var tip = t(name + '.' + d + '.tooltip'),
                            key = (d === 'wireframe' ? t('area_fill.wireframe.key') : null);

                        if (name === 'feature' && autoHiddenFeature(d)) {
                            var msg = showsLayer('osm') ? t('map_data.autohidden') : t('map_data.osmhidden');
                            tip += '<div>' + msg + '</div>';
                        }
                        return uiTooltipHtml(tip, key);
                    })
                    .placement('top')
                );

            var label = enter
                .append('label');

            label
                .append('input')
                .attr('type', type)
                .attr('name', name)
                .on('change', change);

            label
                .append('span')
                .text(function(d) { return t(name + '.' + d + '.description'); });

            // Update
            items = items
                .merge(enter);

            items
                .classed('active', active)
                .selectAll('input')
                .property('checked', active)
                .property('indeterminate', function(d) {
                    return (name === 'feature' && autoHiddenFeature(d));
                });
        }


        function update() {
            dataLayerContainer
                .call(drawOsmItem)
                .call(drawPhotoItems)
                .call(drawGpxItem);

            fillList
                .call(drawList, fills, 'radio', 'area_fill', setFill, showsFill);

            featureList
                .call(drawList, features, 'checkbox', 'feature', clickFeature, showsFeature);
        }


        function hidePanel() {
            setVisible(false);
        }


        function togglePanel() {
            if (d3_event) d3_event.preventDefault();
            tooltipBehavior.hide(button);
            setVisible(!button.classed('active'));
        }


        function toggleWireframe() {
            if (d3_event) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
            }
            setFill((fillSelected === 'wireframe' ? fillDefault : 'wireframe'));
            context.map().pan([0,0]);  // trigger a redraw
        }


        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;

                if (show) {
                    update();
                    selection.on('mousedown.map_data-inside', function() {
                        return d3_event.stopPropagation();
                    });
                    content.style('display', 'block')
                        .style('right', '-300px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');
                } else {
                    content.style('display', 'block')
                        .style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-300px')
                        .on('end', function() {
                            d3_select(this).style('display', 'none');
                        });
                    selection.on('mousedown.map_data-inside', null);
                }
            }
        }


        var content = selection
                .append('div')
                .attr('class', 'fillL map-overlay col3 content hide'),
            tooltipBehavior = tooltip()
                .placement((textDirection === 'rtl') ? 'right' : 'left')
                .html(true)
                .title(uiTooltipHtml(t('map_data.description'), key)),
            button = selection
                .append('button')
                .attr('tabindex', -1)
                .on('click', togglePanel)
                .call(svgIcon('#icon-data', 'light'))
                .call(tooltipBehavior),
            shown = false;

        content
            .append('h4')
            .text(t('map_data.title'));


        // data layers
        content
            .append('a')
            .text(t('map_data.data_layers'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', true)
            .on('click', function() {
                var exp = d3_select(this).classed('expanded');
                dataLayerContainer.style('display', exp ? 'none' : 'block');
                d3_select(this).classed('expanded', !exp);
                d3_event.preventDefault();
            });

        var dataLayerContainer = content
            .append('div')
            .attr('class', 'data-data-layers')
            .style('display', 'block');


        // area fills
        content
            .append('a')
            .text(t('map_data.fill_area'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var exp = d3_select(this).classed('expanded');
                fillContainer.style('display', exp ? 'none' : 'block');
                d3_select(this).classed('expanded', !exp);
                d3_event.preventDefault();
            });

        var fillContainer = content
            .append('div')
            .attr('class', 'data-area-fills')
            .style('display', 'none');

        var fillList = fillContainer
            .append('ul')
            .attr('class', 'layer-list layer-fill-list');


        // feature filters
        content
            .append('a')
            .text(t('map_data.map_features'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                var exp = d3_select(this).classed('expanded');
                featureContainer.style('display', exp ? 'none' : 'block');
                d3_select(this).classed('expanded', !exp);
                d3_event.preventDefault();
            });

        var featureContainer = content
            .append('div')
            .attr('class', 'data-feature-filters')
            .style('display', 'none');

        var featureList = featureContainer
            .append('ul')
            .attr('class', 'layer-list layer-feature-list');


        context.features()
            .on('change.map_data-update', update);

        setFill(fillDefault);

        var keybinding = d3_keybinding('features')
            .on(key, togglePanel)
            .on(t('area_fill.wireframe.key'), toggleWireframe)
            .on([t('background.key'), t('help.key')], hidePanel);

        d3_select(document)
            .call(keybinding);
    }

    return map_data;
}
