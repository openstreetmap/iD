import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { svgIcon } from '../svg';
import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { geoExtent } from '../geo';
import { modeBrowse } from '../modes';
import { uiBackground } from './background';
import { uiDisclosure } from './disclosure';
import { uiHelp } from './help';
import { uiSettingsCustomData } from './settings/custom_data';
import { uiTooltipHtml } from './tooltipHtml';


export function uiMapData(context) {
    var key = t('map_data.key');
    var features = context.features().keys();
    var layers = context.layers();
    var fills = ['wireframe', 'partial', 'full'];

    var settingsCustomData = uiSettingsCustomData(context)
        .on('change', customChanged);

    var _fillSelected = context.storage('area-fill') || 'partial';
    var _shown = false;
    var _dataLayerContainer = d3_select(null);
    var _fillList = d3_select(null);
    var _featureList = d3_select(null);


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
        return _fillSelected === d;
    }


    function setFill(d) {
        fills.forEach(function(opt) {
            context.surface().classed('fill-' + opt, Boolean(opt === d));
        });

        _fillSelected = d;
        context.storage('area-fill', d);
        if (d !== 'wireframe') {
            context.storage('area-fill-toggle', d);
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

            if (!enabled && (which === 'osm' || which === 'notes')) {
                context.enter(modeBrowse(context));
            }

            update();
        }
    }


    function toggleLayer(which) {
        setLayer(which, !showsLayer(which));
    }


    function drawPhotoItems(selection) {
        var photoKeys = ['streetside', 'mapillary-images', 'mapillary-signs', 'openstreetcam-images'];
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
        li
            .merge(liEnter)
            .classed('active', layerEnabled)
            .selectAll('input')
            .property('checked', layerEnabled);
    }


    function drawOsmItems(selection) {
        var osmKeys = ['osm', 'notes'];
        var osmLayers = layers.all().filter(function(obj) { return osmKeys.indexOf(obj.id) !== -1; });

        var ul = selection
            .selectAll('.layer-list-osm')
            .data([0]);

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-osm')
            .merge(ul);

        var li = ul.selectAll('.list-item')
            .data(osmLayers);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', function(d) { return 'list-item list-item-' + d.id; });

        var labelEnter = liEnter
            .append('label')
            .each(function(d) {
                d3_select(this)
                    .call(tooltip()
                        .title(t('map_data.layers.' + d.id + '.tooltip'))
                        .placement('bottom')
                    );
            });

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d) { toggleLayer(d.id); });

        labelEnter
            .append('span')
            .text(function(d) { return t('map_data.layers.' + d.id + '.title'); });


        // Update
        li
            .merge(liEnter)
            .classed('active', function (d) { return d.layer.enabled(); })
            .selectAll('input')
            .property('checked', function (d) { return d.layer.enabled(); });
    }


    // Beta feature - sample vector layers to support Detroit Mapping Challenge
    // https://github.com/osmus/detroit-mapping-challenge
    function drawVectorItems(selection) {
        var dataLayer = layers.layer('data');
        var vtData = [
            {
                name: 'Detroit Neighborhoods/Parks',
                src: 'neighborhoods-parks',
                tooltip: 'Neighborhood boundaries and parks as compiled by City of Detroit in concert with community groups.',
                template: 'https://{switch:a,b,c,d}.tiles.mapbox.com/v4/jonahadkins.cjksmur6x34562qp9iv1u3ksf-54hev,jonahadkins.cjksmqxdx33jj2wp90xd9x2md-4e5y2/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1Ijoiam9uYWhhZGtpbnMiLCJhIjoiRlVVVkx3VSJ9.9sdVEK_B_VkEXPjssU5MqA'
            }, {
                name: 'Detroit Composite POIs',
                src: 'composite-poi',
                tooltip: 'Fire Inspections, Business Licenses, and other public location data collated from the City of Detroit.',
                template: 'https://{switch:a,b,c,d}.tiles.mapbox.com/v4/jonahadkins.cjksmm6a02sli31myxhsr7zf3-2sw8h/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1Ijoiam9uYWhhZGtpbnMiLCJhIjoiRlVVVkx3VSJ9.9sdVEK_B_VkEXPjssU5MqA'
            }, {
                name: 'Detroit All-The-Places POIs',
                src: 'alltheplaces-poi',
                tooltip: 'Public domain business location data created by web scrapers.',
                template: 'https://{switch:a,b,c,d}.tiles.mapbox.com/v4/jonahadkins.cjksmswgk340g2vo06p1w9w0j-8fjjc/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1Ijoiam9uYWhhZGtpbnMiLCJhIjoiRlVVVkx3VSJ9.9sdVEK_B_VkEXPjssU5MqA'
            }
        ];

        // Only show this if the map is around Detroit..
        var detroit = geoExtent([-83.5, 42.1], [-82.8, 42.5]);
        var showVectorItems = (context.map().zoom() > 9 && detroit.contains(context.map().center()));

        var container = selection.selectAll('.vectortile-container')
            .data(showVectorItems ? [0] : []);

        container.exit()
            .remove();

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'vectortile-container');

        containerEnter
            .append('h4')
            .attr('class', 'vectortile-header')
            .text('Detroit Vector Tiles (Beta)');

        containerEnter
            .append('ul')
            .attr('class', 'layer-list layer-list-vectortile');

        containerEnter
            .append('div')
            .attr('class', 'vectortile-footer')
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .call(svgIcon('#iD-icon-out-link', 'inline'))
            .attr('href', 'https://github.com/osmus/detroit-mapping-challenge')
            .append('span')
            .text('About these layers');

        container = container
            .merge(containerEnter);


        var ul = container.selectAll('.layer-list-vectortile');

        var li = ul.selectAll('.list-item')
            .data(vtData);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', function(d) { return 'list-item list-item-' + d.src; });

        var labelEnter = liEnter
            .append('label')
            .each(function(d) {
                d3_select(this).call(
                    tooltip().title(d.tooltip).placement('top')
                );
            });

        labelEnter
            .append('input')
            .attr('type', 'radio')
            .attr('name', 'vectortile')
            .on('change', selectVTLayer);

        labelEnter
            .append('span')
            .text(function(d) { return d.name; });

        // Update
        li
            .merge(liEnter)
            .classed('active', isVTLayerSelected)
            .selectAll('input')
            .property('checked', isVTLayerSelected);


        function isVTLayerSelected(d) {
            return dataLayer && dataLayer.template() === d.template;
        }

        function selectVTLayer(d) {
            context.storage('settings-custom-data-url', d.template);
            if (dataLayer) {
                dataLayer.template(d.template, d.src);
                dataLayer.enabled(true);
            }
        }
    }


    function drawCustomDataItems(selection) {
        var dataLayer = layers.layer('data');
        var hasData = dataLayer && dataLayer.hasData();
        var showsData = hasData && dataLayer.enabled();

        var ul = selection
            .selectAll('.layer-list-data')
            .data(dataLayer ? [0] : []);

        // Exit
        ul.exit()
            .remove();

        // Enter
        var ulEnter = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-data');

        var liEnter = ulEnter
            .append('li')
            .attr('class', 'list-item-data');

        liEnter
            .append('button')
            .call(tooltip()
                .title(t('settings.custom_data.tooltip'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', editCustom)
            .call(svgIcon('#iD-icon-more'));

        liEnter
            .append('button')
            .call(tooltip()
                .title(t('map_data.layers.custom.zoom'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                dataLayer.fitZoom();
            })
            .call(svgIcon('#iD-icon-search'));

        var labelEnter = liEnter
            .append('label')
            .call(tooltip()
                .title(t('map_data.layers.custom.tooltip'))
                .placement('top')
            );

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() { toggleLayer('data'); });

        labelEnter
            .append('span')
            .text(t('map_data.layers.custom.title'));

        // Update
        ul = ul
            .merge(ulEnter);

        ul.selectAll('.list-item-data')
            .classed('active', showsData)
            .selectAll('label')
            .classed('deemphasize', !hasData)
            .selectAll('input')
            .property('disabled', !hasData)
            .property('checked', showsData);
    }


    function editCustom() {
        d3_event.preventDefault();
        context.container()
            .call(settingsCustomData);
    }


    function customChanged(d) {
        var dataLayer = layers.layer('data');

        if (d && d.url) {
            dataLayer.url(d.url);
        } else if (d && d.fileList) {
            dataLayer.fileList(d.fileList);
        }
    }


    function drawListItems(selection, data, type, name, change, active) {
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


    function renderDataLayers(selection) {
        var container = selection.selectAll('data-layer-container')
            .data([0]);

        _dataLayerContainer = container.enter()
            .append('div')
            .attr('class', 'data-layer-container')
            .merge(container);
    }


    function renderFillList(selection) {
        var container = selection.selectAll('layer-fill-list')
            .data([0]);

        _fillList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-fill-list')
            .merge(container);
    }


    function renderFeatureList(selection) {
        var container = selection.selectAll('layer-feature-list')
            .data([0]);

        _featureList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-feature-list')
            .merge(container);
    }


    function update() {
        _dataLayerContainer
            .call(drawOsmItems)
            .call(drawPhotoItems)
            .call(drawCustomDataItems)
            .call(drawVectorItems);      // Beta - Detroit mapping challenge

        _fillList
            .call(drawListItems, fills, 'radio', 'area_fill', setFill, showsFill);

        _featureList
            .call(drawListItems, features, 'checkbox', 'feature', clickFeature, showsFeature);
    }


    function toggleWireframe() {
        if (d3_event) {
            d3_event.preventDefault();
            d3_event.stopPropagation();
        }

        if (_fillSelected === 'wireframe') {
            _fillSelected = context.storage('area-fill-toggle') || 'partial';
        } else {
            _fillSelected = 'wireframe';
        }

        setFill(_fillSelected);
        context.map().pan([0,0]);  // trigger a redraw
    }


    function mapData(selection) {

        function hidePane() {
            setVisible(false);
        }

        function togglePane() {
            if (d3_event) d3_event.preventDefault();
            paneTooltip.hide(button);
            setVisible(!button.classed('active'));
        }

        function setVisible(show) {
            if (show !== _shown) {
                button.classed('active', show);
                _shown = show;

                if (show) {
                    uiBackground.hidePane();
                    uiHelp.hidePane();
                    update();

                    pane
                        .style('display', 'block')
                        .style('right', '-300px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');

                } else {
                    pane
                        .style('display', 'block')
                        .style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-300px')
                        .on('end', function() {
                            d3_select(this).style('display', 'none');
                        });
                }
            }
        }


        var pane = selection
            .append('div')
            .attr('class', 'fillL map-pane hide');

        var paneTooltip = tooltip()
            .placement((textDirection === 'rtl') ? 'right' : 'left')
            .html(true)
            .title(uiTooltipHtml(t('map_data.description'), key));

        var button = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', togglePane)
            .call(svgIcon('#iD-icon-data', 'light'))
            .call(paneTooltip);


        var heading = pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('map_data.title'));

        heading
            .append('button')
            .on('click', function() { uiMapData.hidePane(); })
            .call(svgIcon('#iD-icon-close'));


        var content = pane
            .append('div')
            .attr('class', 'pane-content');

        // data layers
        content
            .append('div')
            .attr('class', 'map-data-data-layers')
            .call(uiDisclosure(context, 'data_layers', true)
                .title(t('map_data.data_layers'))
                .content(renderDataLayers)
            );

        // area fills
        content
            .append('div')
            .attr('class', 'map-data-area-fills')
            .call(uiDisclosure(context, 'fill_area', false)
                .title(t('map_data.fill_area'))
                .content(renderFillList)
            );

        // feature filters
        content
            .append('div')
            .attr('class', 'map-data-feature-filters')
            .call(uiDisclosure(context, 'map_features', false)
                .title(t('map_data.map_features'))
                .content(renderFeatureList)
            );


        // add listeners
        context.features()
            .on('change.map_data-update', update);

        update();
        setFill(_fillSelected);

        var keybinding = d3_keybinding('features')
            .on(key, togglePane)
            .on(t('area_fill.wireframe.key'), toggleWireframe)
            .on([t('background.key'), t('help.key')], hidePane);

        d3_select(document)
            .call(keybinding);

        uiMapData.hidePane = hidePane;
        uiMapData.togglePane = togglePane;
        uiMapData.setVisible = setVisible;
    }

    return mapData;
}
