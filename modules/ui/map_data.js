import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { svgIcon } from '../svg';
import { errorTypes } from '../util';
import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { uiBackground } from './background';
import { uiDisclosure } from './disclosure';
import { uiHelp } from './help';
import { uiTooltipHtml } from './tooltipHtml';


export function uiMapData(context) {
    var dispatch = d3_dispatch('change');

    var key = t('map_data.key');
    var features = context.features().keys();
    var QAs = ['keepRight'];
    // var errors = Object.keys(errorTypes.errors); // TODO: add warnings
    var layers = context.layers();
    var fills = ['wireframe', 'partial', 'full'];

    var _fillSelected = context.storage('area-fill') || 'partial';
    var _shown = false;
    var _dataLayerContainer = d3_select(null);
    var _fillList = d3_select(null);
    var _featureList = d3_select(null);
    var _QAList = d3_select(null);
    // var _KeepRightList = d3_select(null);


    function showsFeature(d) {
        return context.features().enabled(d);
    }


    function autoHiddenFeature(d) {
        if (d.type === 'kr_error') return context.errors().autoHidden(d);
        return context.features().autoHidden(d);
    }


    function clickFeature(d) {
        context.features().toggle(d);
        update();
    }


    function showsQA(d) {

        var QAKeys = [d];
        var QALayers = layers.all().filter(function(obj) { return QAKeys.indexOf(obj.id) !== -1; });
        var data = QALayers.filter(function(obj) { return obj.layer.supported(); });

        function layerSupported(d) {
            return d.layer && d.layer.supported();
        }
        function layerEnabled(d) {
            return layerSupported(d) && d.layer.enabled();
        }

        return layerEnabled(data[0]);

    }

    // function clickError(d) {

    // }


    // function showsError(d) {

    // }


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
        li = li
            .merge(liEnter);

        li
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
        li = li
            .merge(liEnter);

        li
            .classed('active', function (d) { return d.layer.enabled(); })
            .selectAll('input')
            .property('checked', function (d) { return d.layer.enabled(); });
    }


    function drawGpxItem(selection) {
        var gpx = layers.layer('gpx');
        var hasGpx = gpx && gpx.hasGpx();
        var showsGpx = hasGpx && gpx.enabled();

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
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                gpx.fitZoom();
            })
            .call(svgIcon('#iD-icon-search'));

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
            .call(svgIcon('#iD-icon-geolocate'));

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

    function drawMvtItem(selection) {
        var mvt = layers.layer('mvt'),
            hasMvt = mvt && mvt.hasMvt(),
            showsMvt = hasMvt && mvt.enabled();

        var ul = selection
            .selectAll('.layer-list-mvt')
            .data(mvt ? [0] : []);

        // Exit
        ul.exit()
            .remove();

        // Enter
        var ulEnter = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-mvt');

        var liEnter = ulEnter
            .append('li')
            .attr('class', 'list-item-mvt');

        liEnter
            .append('button')
            .attr('class', 'list-item-mvt-extent')
            .call(tooltip()
                .title(t('mvt.zoom'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                mvt.fitZoom();
            })
            .call(svgIcon('#iD-icon-search'));

        liEnter
            .append('button')
            .attr('class', 'list-item-mvt-browse')
            .call(tooltip()
                .title(t('mvt.browse'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', function() {
                d3_select(document.createElement('input'))
                    .attr('type', 'file')
                    .on('change', function() {
                        mvt.files(d3_event.target.files);
                    })
                    .node().click();
            })
            .call(svgIcon('#iD-icon-geolocate'));

        var labelEnter = liEnter
            .append('label')
            .call(tooltip()
                .title(t('mvt.drag_drop'))
                .placement('top')
            );

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() { toggleLayer('mvt'); });

        labelEnter
            .append('span')
            .text(t('mvt.local_layer'));

        // Update
        ul = ul
            .merge(ulEnter);

        ul.selectAll('.list-item-mvt')
            .classed('active', showsMvt)
            .selectAll('label')
            .classed('deemphasize', !hasMvt)
            .selectAll('input')
            .property('disabled', !hasMvt)
            .property('checked', showsMvt);
    }

    // function drawQAButtons(selection) {

    //     var QAButtons = d3_select('.layer-QA').selectAll('li').select('label').select('input');

    //     var buttonSection = selection.selectAll('.QA-buttons')
    //         .data([0]);

    //     // exit
    //     buttonSection.exit()
    //         .remove();

    //     // enter
    //     var buttonEnter = buttonSection.enter()
    //         .append('div')
    //         .attr('class', 'QA-buttons');

    //     buttonEnter
    //         .append('button')
    //         .attr('class', 'button QA-toggle-on action')
    //         .text(t('QA.keepRight.toggle-on'))
    //         .on('click', function() {
    //             QAButtons.property('checked', true);
    //             dispatch.call('change');
    //         });

    //     buttonEnter
    //         .append('button')
    //         .attr('class', 'button QA-toggle-off action')
    //         .text(t('QA.keepRight.toggle-off'))
    //         .on('click', function() {
    //             QAButtons.property('checked', false);
    //             dispatch.call('change');
    //         });

    //     buttonSection = buttonSection
    //         .merge(buttonEnter);
    // }

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


                    if ((name === 'feature' || name === 'keepRight') && autoHiddenFeature(d)) {
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
                return ((name === 'feature' || name === 'keepRight') && autoHiddenFeature(d));
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


    function renderQAList(selection) {
        var container = selection.selectAll('layer-QA')
            .data([0]);

        _QAList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-QA')
            .merge(container);
    }

    // function renderKeepRightList(selection) {
    //     var container = selection.selectAll('layer-keepRight')
    //         .data([0]);

    //     _KeepRightList = container.enter()
    //         .append('ul')
    //         .attr('class', 'layer-list layer-keepRight')
    //         .merge(container);
    // }


    function update() {
        _dataLayerContainer
            .call(drawOsmItems)
            .call(drawPhotoItems)
            .call(drawGpxItem);
            // .call(drawMvtItem);

        _fillList
            .call(drawListItems, fills, 'radio', 'area_fill', setFill, showsFill);

        _featureList
            .call(drawListItems, features, 'checkbox', 'feature', clickFeature, showsFeature);

        _QAList
            .call(drawListItems, QAs, 'checkbox', 'QA', function(d) { toggleLayer(d); }, showsQA);

        // _KeepRightList
        //     .call(drawListItems, errors, 'checkbox', 'QA.keepRight.errorTypes.errors', clickError, showsError);
        // d3_select('.disclosure-wrap-QA')
        //     .call(drawQAButtons);
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
            .attr('class', 'fillL map-pane col4 hide');

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

        // Q/A tools
        content
            .append('div')
            .attr('class', 'map-data-QA')
            .call(uiDisclosure(context, 'QA', false)
                .title(t('map_data.QA.title'))
                .content(renderQAList)
            );

        // // adding keepRight sublayers
        // QA_list
        //     .append('div')
        //     .attr('class', 'keepRight-errors')
        //     .call(uiDisclosure(context, 'keepRight', false)
        //         .title(t('map_data.QA.keepRight'))
        //         .content(renderKeepRightList)
        //     );


        // add listeners
        context.features()
            .on('change.map_data-update', update);

        // context.errors()
        //     .on('change.map_data-update', update); // TODO: add errors list to context?
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
