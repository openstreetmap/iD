import * as d3 from 'd3';
import _ from 'lodash';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg/index';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';

export function uiMapData(context) {
    var key = t('map_data.key'),
        esriLayerUrl = context.storage('esriLayerUrl') || '',
        esriDownloadAll = true,
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
            _.each(fills, function(opt) {
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

        function clickGpx() {
            toggleLayer('gpx');
        }

        function clickMapillaryImages() {
            toggleLayer('mapillary-images');
            if (!showsLayer('mapillary-images')) {
                setLayer('mapillary-signs', false);
            }
        }


        function clickMapillarySigns() {
            toggleLayer('mapillary-signs');
        }


        function drawMapillaryItems(selection) {
            var mapillaryImages = layers.layer('mapillary-images'),
                mapillarySigns = layers.layer('mapillary-signs'),
                supportsMapillaryImages = mapillaryImages && mapillaryImages.supported(),
                supportsMapillarySigns = mapillarySigns && mapillarySigns.supported(),
                showsMapillaryImages = supportsMapillaryImages && mapillaryImages.enabled(),
                showsMapillarySigns = supportsMapillarySigns && mapillarySigns.enabled();

            var mapillaryList = selection
                .selectAll('.layer-list-mapillary')
                .data([0]);

            mapillaryList = mapillaryList.enter()
                .append('ul')
                .attr('class', 'layer-list layer-list-mapillary')
                .merge(mapillaryList);


            var mapillaryImageLayerItem = mapillaryList
                .selectAll('.list-item-mapillary-images')
                .data(supportsMapillaryImages ? [0] : []);

            mapillaryImageLayerItem.exit()
                .remove();

            var enterImages = mapillaryImageLayerItem.enter()
                .append('li')
                .attr('class', 'list-item-mapillary-images');

            var labelImages = enterImages
                .append('label')
                .call(tooltip()
                    .title(t('mapillary_images.tooltip'))
                    .placement('top'));

            labelImages
                .append('input')
                .attr('type', 'checkbox')
                .on('change', clickMapillaryImages);

            labelImages
                .append('span')
                .text(t('mapillary_images.title'));


            var mapillarySignLayerItem = mapillaryList
                .selectAll('.list-item-mapillary-signs')
                .data(supportsMapillarySigns ? [0] : []);

            mapillarySignLayerItem.exit()
                .remove();

            var enterSigns = mapillarySignLayerItem.enter()
                .append('li')
                .attr('class', 'list-item-mapillary-signs');

            var labelSigns = enterSigns
                .append('label')
                .call(tooltip()
                    .title(t('mapillary_signs.tooltip'))
                    .placement('top'));

            labelSigns
                .append('input')
                .attr('type', 'checkbox')
                .on('change', clickMapillarySigns);

            labelSigns
                .append('span')
                .text(t('mapillary_signs.title'));


            // Updates
            mapillaryImageLayerItem = mapillaryImageLayerItem
                .merge(enterImages);

            mapillaryImageLayerItem
                .classed('active', showsMapillaryImages)
                .selectAll('input')
                .property('checked', showsMapillaryImages);


            mapillarySignLayerItem = mapillarySignLayerItem
                .merge(enterSigns);

            mapillarySignLayerItem
                .classed('active', showsMapillarySigns)
                .selectAll('input')
                .property('disabled', !showsMapillaryImages)
                .property('checked', showsMapillarySigns);

            mapillarySignLayerItem
                .selectAll('label')
                .classed('deemphasize', !showsMapillaryImages);
        }

        function drawEsriItem(selection) {
            var esriLayer = layers.layer('esri'),
                hasData = esriLayer && esriLayer.hasData(),
                showsEsri = hasData && esriLayer.enabled();
            
            var esriLayerItem = selection
                .selectAll('.layer-list-esri')
                .data(esriLayer ? [0] : []);

            // Exit
            esriLayerItem.exit()
                .remove();

            // Enter
            
            var enter = esriLayerItem.enter()
                .append('ul')
                .attr('class', 'layer-list layer-list-esri')
                .append('li')
                .classed('list-item-esri', true);
        
            var labelEsri = enter
              .append('label')
              .call(tooltip().title('Enter an Esri service URL').placement('top'));

            labelEsri.append('button')
                .attr('class', 'layer-browse')
                .on('click', editEsriLayer)
                .call(svgIcon('#icon-search'));

            labelEsri
                .append('span')
                .text('Input Esri layer');

            // create ESRI layer edit pane only once            
            if (this.pane) {
                return;
            }
            
            /*
            <div class="shaded" style="opacity: 1;">
              <div class="modal fillL col6">
                <div class="cf">
                  <div class="modal-section">
                    <h3>Title</h3>
                  </div>
                  <div class="modal-section">
                    <p>Body</p>
                  </div>
                </div>
              </div>
            </div>
            */
            
            // based on the help pane            
            this.pane = d3.select('#content').append('div')
                .attr('class', 'shaded hide esri-pane')
                .append('div').attr('class', 'modal fillL col8')
                .append('div').attr('class', 'cf')
                .append('div').attr('class', 'modal-section');
            /*
                .attr('class', 'help-wrap map-overlay fillL col5 content hide esri-pane');
            */
                        
            // exit button
            this.pane.append('button')
                .attr('tabindex', -1)
                .on('click', toggle)
                .call(svgIcon('#icon-close'));
            
            var content = this.pane.append('div')
                .attr('class', 'left-content');
            
            // title
            content.append('h3')
                .text('Import an Esri service by URL');
            
            var body = content.append('div')
                .attr('class', 'body');
                
            // replacing the window.prompt with an in-browser window
            var urlEntry = body.append('div')
                .attr('class', 'topurl');
            urlEntry.append('input')
                .attr('type', 'text')
                .attr('placeholder', 'Esri service URL')
                .attr('value', context.storage('esriLayerUrl') || '');
            urlEntry.append('button')
                .attr('class', 'url')
                .text('Download View')
                .on('click', function() {
                    esriDownloadAll = false;
                    setEsriLayer(this.parentElement.firstChild.value, esriDownloadAll);
                });
            urlEntry.append('button')
                .attr('class', 'url')
                .attr('style', 'margin-right: 10px')
                .text('Download All')
                .on('click', function() {
                    esriDownloadAll = true;
                    setEsriLayer(this.parentElement.firstChild.value, esriDownloadAll);
                });
            
            // known iD presets
            var preset = urlEntry.append('div')
                .attr('class', 'preset');
            preset.append('label')
                .text('OpenStreetMap preset (select at left)');
            preset.append('span');
            
            // click to remove a preset
            preset.append('button')
                .attr('class', 'hide')
                .attr('style', 'float: none !important')
                .text('x')
                .on('click', function() {
                    context.layers().layer('esri').preset(null);
                });
            
            /*
            // test having an import function
            urlEntry.append('pre').append('code').text('function(osm) {\n  return "hello world";\n}');
            hljs.initHighlightingOnLoad();
            */
            
            // radio buttons to decide how data is finalized on OSM
            var approvalPhase = urlEntry.append('div')
                .attr('class', 'import-approval');
            approvalPhase.append('h4').text('Review data before importing?');
            
            var individualApproval = approvalPhase.append('label');
            individualApproval.append('input')
                .attr('class', 'approval-individual')
                .attr('type', 'radio')
                .attr('name', 'approvalProcess')
                .attr('value', 'individual')
                .property('checked', true);
            individualApproval.append('span').text('Manually select import features');
            
            var allApproval = approvalPhase.append('label');
            allApproval.append('input')
                .attr('class', 'approval-all')
                .attr('type', 'radio')
                .attr('name', 'approvalProcess')
                .attr('value', 'all');
            allApproval.append('span').text('Import all features by default');
            
            body.append('table')
                    .attr('border', '1')
                    .attr('class', 'esri-table hide') // tag-list
                    .append('img').attr('src', '/img/loader-white.gif');
            
            // this button adds a new field to data brought in from the Esri service
            // for example you can add addr:state=VA to a city's addresses which otherwise wouldn't have this repeated field
            body.append('div')
                .attr('class', 'inspector-inner hide')
                .append('button')
                    .attr('class', 'add-tag')
                    .call(svgIcon('#icon-plus', 'icon light'))
                    .on('click', function() {
                      var row = d3.selectAll('.esri-table').append('tr');
                      var uniqNum = Math.floor(Math.random() * 10000);

                      // the 'key' field, showing the new OSM tag key
                      row.append('td').append('input')
                        //.attr('type', 'text')
                        .attr('class', 'import-key-' + uniqNum)
                        .on('change', function() {
                          if (this.name) {
                            window.layerImports['add_' + this.value] = window.layerImports['add_' + this.name];
                            delete window.layerImports['add_' + this.name];
                          } else {
                            window.layerImports['add_' + this.value] = '';
                          }
                          this.name = this.value;
                          d3.selectAll('.osm-key-' + uniqNum).attr('name', this.value);
                        });
                    
                      // the 'value' field setting the new OSM tag default value
                      row.append('td').append('input')
                        .attr('type', 'text')
                        .attr('class', 'osm-key-' + uniqNum)
                        .on('change', function() {
                          // properties with this.name renamed to this.value
                          window.layerImports['add_' + this.name] = this.value;
                        });
                    });
            
            // save button makes changes to existing and new import data
            this.pane.append('button')
                .on('click', function() {
                    context.flush();
                    window.knownObjectIds = {};
                    window.importedEntities = [];
                    setTimeout(function() {
                      refreshEsriLayer(context.storage('esriLayerUrl'), esriDownloadAll);
                    }, 400);
                })
                .attr('class', 'no-float hide')
                .call(svgIcon('#icon-save', 'icon light'))
                .text('Save');
        }
        
        function toggle() {
            // show and hide Esri data import pane
            var hideMe = !d3.selectAll('.esri-pane').classed('hide');
            d3.selectAll('.esri-pane')
                .classed('hide', hideMe);
            
            // show autocomplete of presets
            var esriLayer = layers.layer('esri');
            if (!esriLayer.hasData()) {
                d3.selectAll('.feature-list-pane').classed('inspector-hidden editor-overwrite', !hideMe);
                if (!hideMe) {
                    //console.log('show Esri, remove inspector-hidden, add editor-overwrite');
                    d3.selectAll('.inspector-wrap, .preset-list-pane, .entity-editor-pane')
                        .classed('inspector-hidden', false)
                        .classed('editor-overwrite', true);
                    if (window.presetReloadFunction) {
                        (window.presetReloadFunction)(true);
                    }
                }
            }
            if (hideMe) {
                //console.log('hide Esri, remove editor-overwrite');
                // allow normal menu use
                d3.selectAll('.editor-overwrite').classed('editor-overwrite', false);
            }
        }
        
        function editEsriLayer() {
            // window allows user to enter an ArcGIS layer
            d3.event.preventDefault();
            toggle();
            
            // test that function has all geo-s
            if (window.presetReloadFunction) {
                (window.presetReloadFunction)(true);
            }
        }

        function setEsriLayer(template, downloadMax) {
            // remember Esri service URL for future visits
            context.storage('esriLayerUrl', template);
            
            // un-hide Esri pane and buttons
            d3.selectAll('.esri-pane, .esri-pane .hide').classed('hide', false);
            this.pane.property('scrollTop', 0);

            // hide Esri Service URL input
            d3.selectAll('.topurl').classed('hide', true);
            d3.selectAll('.editor-overwrite').classed('editor-overwrite', false);
            
            // if there is an OSM preset, add it to set tags
            window.layerImports = {};
            var presetType = context.layers().layer('esri').preset();
            if (presetType) {
                var setPreset = context.presets().item(presetType);
                
                // set tags
                var tags = Object.keys(setPreset.tags);
                for (var t = 0; t < tags.length; t++) {
                    window.layerImports['add_' + tags[t]] = setPreset.tags[tags[t]];
                }
            }
            
            refreshEsriLayer(template, downloadMax);
        }
        
        function refreshEsriLayer(template, downloadMax) {
            // start loading data onto the map
            var esriLayer = context.layers().layer('esri');
            esriLayer.url(template, downloadMax);
            
            d3.selectAll('.esri-pane').classed('hide', false);
        }

        function drawGpxItem(selection) {
            var gpx = layers.layer('gpx'),
                hasGpx = gpx && gpx.hasGpx(),
                showsGpx = hasGpx && gpx.enabled();

            var gpxLayerItem = selection
                .selectAll('.layer-list-gpx')
                .data(gpx ? [0] : []);

            // Exit
            gpxLayerItem.exit()
                .remove();

            // Enter
            var enter = gpxLayerItem.enter()
                .append('ul')
                .attr('class', 'layer-list layer-list-gpx')
                .append('li')
                .classed('list-item-gpx', true);

            enter
                .append('button')
                .attr('class', 'list-item-gpx-extent')
                .call(tooltip()
                    .title(t('gpx.zoom'))
                    .placement((textDirection === 'rtl') ? 'right' : 'left'))
                .on('click', function() {
                    d3.event.preventDefault();
                    d3.event.stopPropagation();
                    gpx.fitZoom();
                })
                .call(svgIcon('#icon-search'));

            enter
                .append('button')
                .attr('class', 'list-item-gpx-browse')
                .call(tooltip()
                    .title(t('gpx.browse'))
                    .placement((textDirection === 'rtl') ? 'right' : 'left'))
                .on('click', function() {
                    d3.select(document.createElement('input'))
                        .attr('type', 'file')
                        .on('change', function() {
                            gpx.files(d3.event.target.files);
                        })
                        .node().click();
                })
                .call(svgIcon('#icon-geolocate'));

            var labelGpx = enter
                .append('label')
                .call(tooltip().title(t('gpx.drag_drop')).placement('top'));

            labelGpx
                .append('input')
                .attr('type', 'checkbox')
                .on('change', clickGpx);

            labelGpx
                .append('span')
                .text(t('gpx.local_layer'));


            // Update
            gpxLayerItem = gpxLayerItem
                .merge(enter);

            gpxLayerItem
                .classed('active', showsGpx)
                .selectAll('input')
                .property('disabled', !hasGpx)
                .property('checked', showsGpx);

            gpxLayerItem
                .selectAll('label')
                .classed('deemphasize', !hasGpx);
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
                            tip += '<div>' + t('map_data.autohidden') + '</div>';
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
            dataLayerContainer.call(drawMapillaryItems);
            dataLayerContainer.call(drawEsriItem);
            dataLayerContainer.call(drawGpxItem);

            fillList.call(drawList, fills, 'radio', 'area_fill', setFill, showsFill);
            featureList.call(drawList, features, 'checkbox', 'feature', clickFeature, showsFeature);
        }


        function hidePanel() {
            setVisible(false);
        }


        function togglePanel() {
            if (d3.event) d3.event.preventDefault();
            tooltipBehavior.hide(button);
            setVisible(!button.classed('active'));
        }


        function toggleWireframe() {
            if (d3.event) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
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
                        return d3.event.stopPropagation();
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
                            d3.select(this).style('display', 'none');
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
                var exp = d3.select(this).classed('expanded');
                dataLayerContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
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
                var exp = d3.select(this).classed('expanded');
                fillContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
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
                var exp = d3.select(this).classed('expanded');
                featureContainer.style('display', exp ? 'none' : 'block');
                d3.select(this).classed('expanded', !exp);
                d3.event.preventDefault();
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

        var keybinding = d3keybinding('features')
            .on(key, togglePanel)
            .on(t('area_fill.wireframe.key'), toggleWireframe)
            .on([t('background.key'), t('help.key')], hidePanel);

        d3.select(document)
            .call(keybinding);

        context.surface().on('mousedown.map_data-outside', hidePanel);
        context.container().on('mousedown.map_data-outside', hidePanel);
    }


    return map_data;
}
