import _debounce from 'lodash-es/debounce';
import {
    select as d3_select
} from 'd3-selection';

import { prefs } from '../../core/preferences';
import { t, localizer } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { svgIcon } from '../../svg/icon';
import { geoExtent } from '../../geo';
import { modeBrowse } from '../../modes/browse';
import { uiCmd } from '../cmd';
import { uiSection } from '../section';
import { uiSettingsCustomData } from '../settings/custom_data';

export function uiSectionDataLayers(context) {

    var settingsCustomData = uiSettingsCustomData(context)
        .on('change', customChanged);

    var layers = context.layers();

    var section = uiSection('data-layers', context)
        .label(() => t.append('map_data.data_layers'))
        .disclosureContent(renderDisclosureContent);

    function renderDisclosureContent(selection) {
        var container = selection.selectAll('.data-layer-container')
            .data([0]);

        container.enter()
            .append('div')
            .attr('class', 'data-layer-container')
            .merge(container)
            .call(drawOsmItems)
            .call(drawQAItems)
            .call(drawCustomDataItems)
            .call(drawVectorItems)      // Beta - Detroit mapping challenge
            .call(drawPanelItems);
    }

    function showsLayer(which) {
        var layer = layers.layer(which);
        if (layer) {
            return layer.enabled();
        }
        return false;
    }

    function setLayer(which, enabled) {
        // Don't allow layer changes while drawing - #6584
        var mode = context.mode();
        if (mode && /^draw/.test(mode.id)) return;

        var layer = layers.layer(which);
        if (layer) {
            layer.enabled(enabled);

            if (!enabled && (which === 'osm' || which === 'notes')) {
                context.enter(modeBrowse(context));
            }
        }
    }

    function toggleLayer(which) {
        setLayer(which, !showsLayer(which));
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
                if (d.id === 'osm') {
                    d3_select(this)
                        .call(uiTooltip()
                            .title(() => t.append('map_data.layers.' + d.id + '.tooltip'))
                            .keys([uiCmd('⌥' + t('area_fill.wireframe.key'))])
                            .placement('bottom')
                        );
                } else {
                    d3_select(this)
                        .call(uiTooltip()
                            .title(() => t.append('map_data.layers.' + d.id + '.tooltip'))
                            .placement('bottom')
                        );
                }
            });

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event, d) { toggleLayer(d.id); });

        labelEnter
            .append('span')
            .html(function(d) { return t.html('map_data.layers.' + d.id + '.title'); });


        // Update
        li
            .merge(liEnter)
            .classed('active', function (d) { return d.layer.enabled(); })
            .selectAll('input')
            .property('checked', function (d) { return d.layer.enabled(); });
    }

    function drawQAItems(selection) {
        var qaKeys = ['keepRight', 'improveOSM', 'osmose'];
        var qaLayers = layers.all().filter(function(obj) { return qaKeys.indexOf(obj.id) !== -1; });

        var ul = selection
            .selectAll('.layer-list-qa')
            .data([0]);

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-qa')
            .merge(ul);

        var li = ul.selectAll('.list-item')
            .data(qaLayers);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', function(d) { return 'list-item list-item-' + d.id; });

        var labelEnter = liEnter
            .append('label')
            .each(function(d) {
                d3_select(this)
                    .call(uiTooltip()
                        .title(() => t.append('map_data.layers.' + d.id + '.tooltip'))
                        .placement('bottom')
                    );
            });

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event, d) { toggleLayer(d.id); });

        labelEnter
            .append('span')
            .each(function(d) { t.append('map_data.layers.' + d.id + '.title')(d3_select(this)); });


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
                    uiTooltip().title(d.tooltip).placement('top')
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

        function selectVTLayer(d3_event, d) {
            prefs('settings-custom-data-url', d.template);
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

        var labelEnter = liEnter
            .append('label')
            .call(uiTooltip()
                .title(() => t.append('map_data.layers.custom.tooltip'))
                .placement('top')
            );

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() { toggleLayer('data'); });

        labelEnter
            .append('span')
            .call(t.append('map_data.layers.custom.title'));

        liEnter
            .append('button')
            .attr('class', 'open-data-options')
            .call(uiTooltip()
                .title(() => t.append('settings.custom_data.tooltip'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                editCustom();
            })
            .call(svgIcon('#iD-icon-more'));

        liEnter
            .append('button')
            .attr('class', 'zoom-to-data')
            .call(uiTooltip()
                .title(() => t.append('map_data.layers.custom.zoom'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event) {
                if (d3_select(this).classed('disabled')) return;

                d3_event.preventDefault();
                d3_event.stopPropagation();
                dataLayer.fitZoom();
            })
            .call(svgIcon('#iD-icon-framed-dot', 'monochrome'));

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

        ul.selectAll('button.zoom-to-data')
            .classed('disabled', !hasData);
    }

    function editCustom() {
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


    function drawPanelItems(selection) {

        var panelsListEnter = selection.selectAll('.md-extras-list')
            .data([0])
            .enter()
            .append('ul')
            .attr('class', 'layer-list md-extras-list');

        var historyPanelLabelEnter = panelsListEnter
            .append('li')
            .attr('class', 'history-panel-toggle-item')
            .append('label')
            .call(uiTooltip()
                .title(() => t.append('map_data.history_panel.tooltip'))
                .keys([uiCmd('⌘⇧' + t('info_panels.history.key'))])
                .placement('top')
            );

        historyPanelLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event) {
                d3_event.preventDefault();
                context.ui().info.toggle('history');
            });

        historyPanelLabelEnter
            .append('span')
            .call(t.append('map_data.history_panel.title'));

        var measurementPanelLabelEnter = panelsListEnter
            .append('li')
            .attr('class', 'measurement-panel-toggle-item')
            .append('label')
            .call(uiTooltip()
                .title(() => t.append('map_data.measurement_panel.tooltip'))
                .keys([uiCmd('⌘⇧' + t('info_panels.measurement.key'))])
                .placement('top')
            );

        measurementPanelLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event) {
                d3_event.preventDefault();
                context.ui().info.toggle('measurement');
            });

        measurementPanelLabelEnter
            .append('span')
            .call(t.append('map_data.measurement_panel.title'));
    }

    context.layers().on('change.uiSectionDataLayers', section.reRender);

    context.map()
        .on('move.uiSectionDataLayers',
            _debounce(function() {
                // Detroit layers may have moved in or out of view
                window.requestIdleCallback(section.reRender);
            }, 1000)
        );

    return section;
}
