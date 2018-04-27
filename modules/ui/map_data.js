import * as d3 from 'd3';
import _ from 'lodash';
import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';
import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';
import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg';
import { tooltip } from '../util/tooltip';
import { d3combobox } from '../lib/d3.combobox.js';
import { uiBackground } from './background';
import { uiDisclosure } from './disclosure';
import { uiHelp } from './help';
import { uiTooltipHtml } from './tooltipHtml';


export function uiMapData(context) {
    var key = t('map_data.key');
    var features = context.features().keys();
    var layers = context.layers();
    var fills = ['wireframe', 'partial', 'full'];

    var _fillSelected = context.storage('area-fill') || 'partial';
    var _shown = false;
    var _dataLayerContainer = d3_select(null);
    var _fillList = d3_select(null);
    var _featureList = d3_select(null);

    function mapData(selection) {
        function getFetcher() {
            var geoserviceLayer = context.layers().layer('geoservice');
            return function(value, cb) {
                var setPreset = geoserviceLayer.preset();
                var v = value.toLowerCase();
                var suggestedTags = [];
                if (setPreset) {
                    _.map(setPreset.fields, function(field) {
                        if (field.keys) {
                            suggestedTags = suggestedTags.concat(_.map(field.keys, function(key) {
                                return { value: key };
                            }));
                        } else if (field.key) {
                            suggestedTags.push({ value: field.key });
                        }
                    });
                }
                cb(suggestedTags.filter(function(d) {
                    return d.value.toLowerCase().indexOf(v) >= 0;
                }));
            };
        }

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


            function clickGpx() {
                toggleLayer('gpx');
            }

            // Update
            li = li
                .merge(liEnter);

            li
                .classed('active', layerEnabled)
                .selectAll('input')
                .property('checked', layerEnabled);
        }

        function drawGeoServiceItem(selection) {
            var geoserviceLayer = layers.layer('geoservice');

            var geoserviceLayerItem = selection
                .selectAll('.layer-list-geoservice')
                .data(geoserviceLayer ? [0] : []);

            // Exit
            geoserviceLayerItem.exit()
                .remove();

            // Enter

            var enter = geoserviceLayerItem.enter()
                .append('ul')
                .attr('class', 'layer-list layer-list-geoservice')
                .append('li')
                .classed('list-item-geoservice', true);

            var hoverGeoService = tooltip()
                .title(t('geoservice.enter_url'))
                .placement('top');
            var labelGeoService = enter
                .append('label')
                .call(hoverGeoService);

            labelGeoService.append('button')
                .attr('class', 'layer-browse')
                .on('click', editGeoService);

            labelGeoService
                .append('span')
                .attr('class', 'geoservice-button-label')
                .text(t('geoservice.add_layer'));

            var allOpts = enter.append('label')
                .attr('class', 'geoservice-all-opt');
            allOpts.append('input')
                .attr('type', 'radio')
                .attr('name', 'import-visibility')
                .attr('value', 'all')
                .property('checked', 'checked');
            allOpts.append('span').text(t('geoservice.show_all'));
            var osmOpt = enter.append('label')
                .attr('class', 'geoservice-osm-opt');
            osmOpt.append('input')
                .attr('type', 'radio')
                .attr('name', 'import-visibility')
                .attr('value', 'osm');
            osmOpt.append('span').text(t('geoservice.hide_import'));
            var importOpt = enter.append('label')
                .attr('class', 'geoservice-import-opt');
            importOpt.append('input')
                .attr('type', 'radio')
                .attr('name', 'import-visibility')
                .attr('value', 'import');
            importOpt.append('span').text(t('geoservice.hide_osm'));

            var urlEntry, urlInput, copyrightable, copylabel, unrecognizedSource, unrecognizedLabel, copyapproval, layerPreview, layerSelect, preset, presetList, presetComboBox, metadata_url, plan_url;

            d3.selectAll('.geoservice-all-opt input, .geoservice-osm-opt input, .geoservice-import-opt input').on('change', function () {
                if (d3.select('.geoservice-all-opt input').property('checked')) {
                    d3.selectAll('.data-layer .geoservice-import, .data-layer .geoservice-osm').style('visibility', 'visible');
                } else if (d3.select('.geoservice-osm-opt input').property('checked')) {
                    d3.selectAll('.data-layer .geoservice-osm').style('visibility', 'visible');
                    d3.selectAll('.data-layer .geoservice-import').style('visibility', 'hidden');
                } else if (d3.select('.geoservice-import-opt input').property('checked')) {
                    d3.selectAll('.data-layer .geoservice-osm').style('visibility', 'hidden');
                    d3.selectAll('.data-layer .geoservice-import').style('visibility', 'visible');
                }
            });

            // create GeoService layer edit pane only once
            if (this.pane) {
                return;
            }

            // based on the help pane
            this.pane = d3.selectAll('#content').append('div')
                .attr('class', 'shaded hide geoservice-pane')
                .append('div').attr('class', 'modal fillL col9')
                .append('div').attr('class', 'cf')
                .append('div').attr('class', 'modal-section');

            enter.append('button')
                .attr('class', 'clear-geoservice hide')
                .text(t('geoservice.clear_geoservice'))
                .on('click', (function() {
                    // clear the UI
                    d3.selectAll('.geoservice-all-opt, .geoservice-osm-opt, .geoservice-import-opt, .clear-geoservice')
                    .style('display', 'none');
                    d3.select('.geoservice-button-label').text('Add GeoService Layer');
                    hoverGeoService.title(t('geoservice.enter_url'));
                    // clear the map
                    geoserviceLayer.geojson({});
                    geoserviceLayer.fields({});
                    context.flush();
                    populatePane(this.pane);
                }).bind(this));

            function hidePreviewGeoService () {
                d3.selectAll('.geoservice-preview, .geoservice-table, .copyright-text, .layer-counted')
                    .classed('hide', true);
            }

            function previewGeoService(err, data) {
                if (err) {
                    return console.log(err);
                }

                d3.selectAll('.geoservice-preview, .copyright-text')
                    .classed('hide', false);

                if (data.layers && data.layers.length) {
                    // MapServer layer selector is visible
                    d3.select('.geoservice-table')
                        .classed('hide', true);
                    d3.selectAll('.geoservice-pane button.url.final')
                        .property('disabled', true);
                    layerSelect.html('')
                        .classed('hide', false)
                        .on('change', function() {
                            if (this.value) {
                                urlInput.property('value', this.value);
                                urlInput.on('input')(null, this.value);
                            }
                        })
                        .append('option')
                            .text(t('geoservice.select_layer'))
                            .attr('value', '')
                            .property('selected', true);

                    _.map(data.layers, function(optLayer) {
                        layerSelect.append('option')
                            .text(optLayer.name)
                            .attr('value', metadata_url.split('?f=json')[0] + '/' + optLayer.id);
                    });
                    return;
                } else {
                    layerSelect.classed('hide', true);
                }
                if (!data.fields || !data.fields.length) {
                    return;
                }

                // fetch one record for sample values
                var sample_url = metadata_url.split('?f=json')[0] + '/query?where=1%3D1&returnGeometry=false&outFields=*&f=json&resultRecordCount=1';
                d3.json(sample_url, function (err, data) {
                    var samplePick = data.features[0].attributes;
                    var fields = Object.keys(samplePick);
                    _.map(fields, function (field) {
                        d3.select('tr.preview.' + field + ' .sample-value')
                            .text(samplePick[field]);
                    });
                });

                // make a count of local (current viewport) and global features
                var counter_url = metadata_url.split('?f=json')[0] + '/query?where=1%3D1&returnCountOnly=true&f=json';
                d3.selectAll('.layer-counted').classed('hide', false);
                d3.json(counter_url, function (err, data) {
                    var count = data.count;
                    d3.selectAll('.layer-counted .global').text(count);
                });
                var bounds = context.map().trimmedExtent().bbox();
                bounds = JSON.stringify({
                    xmin: bounds.minX.toFixed(6) * 1,
                    ymin: bounds.minY.toFixed(6) * 1,
                    xmax: bounds.maxX.toFixed(6) * 1,
                    ymax: bounds.maxY.toFixed(6) * 1,
                    spatialReference: {wkid: 4326}
                });
                counter_url += '&geometry=' + encodeURIComponent(bounds);
                counter_url += '&geometryType=esriGeometryEnvelope';
                counter_url += '&spatialRel=esriSpatialRelIntersects';
                counter_url += '&inSR=4326';
                d3.json(counter_url, function (err, data) {
                    var count = (data || {}).count;
                    if (!err && count > 0) {
                        // re-enable download buttons
                        d3.selectAll('.geoservice-pane button.url.final')
                            .property('disabled', false);
                    } else {
                        // warn user
                        alert(t('geoservice.no_data'));
                    }
                    d3.selectAll('.layer-counted .local').text(count);
                });

                // handle OSM / ODBL license approval and appease import guidelines
                var license = (data.copyrightText || '').replace(/\s/g, '');
                geoserviceLayer.metadata(metadata_url);
                geoserviceLayer.license(license);

                if (license) {
                    if (context.storage('license-' + license)) {
                        // user has seen and approved this license before
                        d3.selectAll('.copyright-text')
                            .text(t('geoservice.copyright.approved') + license);
                        copyapproval.property('checked', true);
                    } else {
                        // new license
                        d3.selectAll('.copyright-text').text('Copyright information: ' + license);
                        copylabel.classed('hide', false);
                    }
                } else if (context.storage('license-' + metadata_url)) {
                    // user has seen and approved this URL before
                    d3.selectAll('.copyright-text')
                        .text(t('geoservice.copyright.previous'));
                    copyapproval.property('checked', true);
                } else {
                    // new URL, no license
                    d3.selectAll('.copyright-text').text(t('geoservice.copyright.not_approved'));
                    copylabel.classed('hide', false);
                }

                var geoserviceTable = d3.selectAll('.geoservice-table')
                    .html('<thead class="tag-row"><th>Field</th><th>Sample value</th><th class="include-row">Include?</th><th>(optional) OSM tag</th></thead>')
                    .classed('hide', false);

                if (data.supportedQueryFormats && data.supportedQueryFormats.toLowerCase().indexOf('geojson') > -1) {
                    geoserviceLayer.format('geojson');
                } else {
                    geoserviceLayer.format('json');
                }

                // initially list all GeoService fields and set them to false (not imported)
                var myFields = {};

                _.map(data.fields, function (field) {
                    // don't allow user to change how OBJECTID works or map other system-managed fields
                    if ((['OBJECTID', 'SHAPE', 'SHAPE_LENGTH', 'SHAPE_AREA', 'SHAPE.LENGTH', 'SHAPE.AREA', 'X_COORD', 'Y_COORD'].indexOf(field.name.toUpperCase()) > -1) || (field.name.toUpperCase().indexOf('SHAPE.') === 0)) {
                        return;
                    }
                    myFields[field.name] = false;

                    var row = geoserviceTable.append('tr')
                        .attr('class', 'preview ' + field.name);

                    // field alias (or name)
                    row.append('td').text(field.alias || field.name);

                    // placeholder (JS will later give it sample value)
                    row.append('td')
                        .attr('class', 'sample-value')
                        .text('loading');

                    // checkbox (include or not, default is no)
                    row.append('td')
                        .attr('class', 'include-row')
                        .append('input')
                            .attr('class', field.name.replace(/\s/g, '_'))
                            .attr('type', 'checkbox')
                            .property('checked', typeof geoserviceLayer.fields()[field.name] === 'string')
                            .on('click', function() {
                                // control click toggles all, otherwise change event handles it all
                                if (d3.event.ctrlKey || d3.event.metaKey) {
                                    var allSet = this.checked;
                                    var selectFields = geoserviceLayer.fields();
                                    d3.selectAll('.geoservice-table input[type="checkbox"]')
                                        .property('checked', allSet);
                                    var fieldNames = Object.keys(selectFields);
                                    _.map(fieldNames, function (field) {
                                        // set to current field-name, GeoService original name, or false (for not-imported)
                                        selectFields[field] = allSet ? (selectFields[field] || field) : false;
                                    });
                                    geoserviceLayer.fields(selectFields);
                                }
                            })
                            .on('change', function() {
                                // record that this field is being imported
                                var selectFields = geoserviceLayer.fields();
                                selectFields[field.name] = this.checked ? (selectFields[field.name] || field.name) : false;
                                geoserviceLayer.fields(selectFields);

                                // don't allow an OSM import tag to be entered if we're not importing this field
                                var dropdown = d3.select('input[name="' + field.name + '"]')
                                    .property('value', '')
                                    .property('disabled', !this.checked);
                                d3.select(dropdown.node().parentNode.lastChild)
                                    .classed('hide', !this.checked);
                            });

                    // import to this OSM tag - suggest tags from preset
                    // disable until this tag is imported
                    var suggestedKeys = d3combobox().fetcher(getFetcher()).minItems(0);
                    row.append('td').append('input')
                        .attr('type', 'text')
                        .attr('class', 'osm-counterpart')
                        .attr('name', field.name)
                        .property('disabled', true)
                        .call(suggestedKeys)
                        .on('change', function() {
                            // properties with this.name renamed to this.value
                            geoserviceLayer.setField(this.name, this.value);
                        });
                });
                geoserviceLayer.fields(myFields);

                // UI: hide combobox dropdown until enabled
                // show table and OSM add tag button
                d3.selectAll('.geoservice-table .combobox-caret')
                    .classed('hide', true);
                d3.selectAll('.geoservice-table, .add-tag')
                    .classed('hide', false);
            }

            function populatePane(pane) {
                pane.html('');

                // exit button
                pane.append('button')
                    .attr('tabindex', -1)
                    .on('click', toggle)
                    .call(svgIcon('#icon-close'));

                var content = pane.append('div')
                    .attr('class', 'left-content');

                // title
                content.append('h3')
                    .text('Import from a GeoService by URL');


                var body = content.append('div')
                    .attr('class', 'body');

                // designing the modal window
                urlEntry = body.append('div')
                    .attr('class', 'topurl');
                urlInput = urlEntry.append('input')
                    .attr('type', 'text')
                    .attr('class', 'geoservice')
                    .attr('placeholder', 'GeoService URL')
                    .on('input', function(e, fixedURL) {
                        // reformat URL ending to /layerID?f=json
                        metadata_url = fixedURL ? fixedURL : this.value;
                        metadata_url = metadata_url.split('/');

                        if (unrecognizedLabel) {
                            unrecognizedLabel.classed('hide', true);
                        }

                        if (metadata_url.length < 2 || metadata_url[0].indexOf('http') === -1) {
                            hidePreviewGeoService();
                            return;
                        }

                        // if user is selecting from dropdown, continue
                        if (this.value) {
                            // if url isn't a GeoService, warn and abort
                            if (!new RegExp(/(map|feature)server/, 'i').test(this.value.toLowerCase())) {
                                unrecognizedSource = urlEntry.append('div');
                                unrecognizedSource.append('div')
                                    .attr('class', 'copyright-text');
                                unrecognizedLabel = unrecognizedSource.append('label')
                                    .attr('class', 'hide');
                                unrecognizedLabel.append('span')
                                    .text(t('geoservice.not_valid'));
                                unrecognizedLabel.classed('hide', false);
                                return;
                            }
                        }

                        // if it just ends /0, we need to keep /0 around
                        var last = metadata_url.pop();
                        if ((!isNaN(last * 1)) || (last.toLowerCase().indexOf('server') > -1)) {
                            metadata_url.push(last);
                        }
                        metadata_url = (metadata_url.join('/') + '?f=json').replace(/\/\//g, '/').replace(':/', '://');

                        d3.json(metadata_url, previewGeoService);
                    });

                layerPreview = urlEntry.append('div')
                    .attr('class', 'geoservice-preview');

                copyrightable = layerPreview.append('div');
                copyrightable.append('div')
                    .attr('class', 'copyright-text');
                copylabel = copyrightable.append('label')
                    .attr('class', 'hide');
                copyapproval = copylabel.append('input')
                    .attr('type', 'checkbox')
                    .attr('class', 'copyright-approved')
                    .property('checked', false);
                copylabel.append('span')
                    .html(t('geoservice.plan'));
                copylabel.append('input')
                    .attr('class', 'geoservice-import-plan')
                    .attr('type', 'text')
                    .attr('placeholder', 'URL on OSM Wiki')
                    .on('input', function() {
                        plan_url = this.value;
                        geoserviceLayer.importPlan(plan_url);
                    });

                layerSelect = layerPreview.append('div')
                    .append('select')
                    .attr('class', 'layer-select hide');

                // known iD presets
                preset = urlEntry.append('div')
                    .attr('class', 'preset');
                preset.append('label')
                    .attr('class', 'preset-prompt')
                    .text(t('geoservice.match_preset'));
                preset.append('div')
                    .attr('class', 'preset-icon-holder');
                preset.append('span')
                    .attr('class', 'preset-prompt');

                // click to remove a preset
                preset.append('button')
                    .attr('class', 'hide')
                    .attr('style', 'float: none !important')
                    .text('x')
                    .on('click', function() {
                        geoserviceLayer.preset(null);
                    });

                presetList = _.map(context.presets().collection, function(preset) {
                    return { value: preset.id };
                });
                presetComboBox = function(value, cb) {
                    var v = value.toLowerCase();
                    cb(presetList.filter(function(d) {
                        return d.value.indexOf(v) >= 0;
                    }));
                };
                preset.append('input')
                    .attr('type', 'text')
                    .attr('placeholder', 'feature type')
                    .call(d3combobox().fetcher(presetComboBox).minItems(0))
                    .on('change', function() {
                        var v = this.value;
                        var selection = context.presets().collection.filter(function(d) {
                            return d.id === v;
                        })[0];
                        geoserviceLayer.preset(selection);
                    });

                // point-in-polygon option
                var pip = preset.append('div')
                    .attr('class', 'point-in-polygon')
                    .append('label');
                pip.append('input')
                    .attr('type', 'checkbox')
                    .attr('name', 'point-in-polygon')
                    .property('checked', false);
                pip.append('span')
                    .text('Add addresses to buildings');

                // merge lines option
                var ml = preset.append('div')
                    .attr('class', 'merge-lines')
                    .append('label');
                ml.append('input')
                    .attr('type', 'checkbox')
                    .attr('name', 'merge-lines')
                    .property('checked', false);
                ml.append('span')
                    .text('Add data to roads');

                // no overlapping buildings option
                var bld = preset.append('div')
                    .attr('class', 'overlap-buildings')
                    .append('label');
                bld.append('input')
                    .attr('type', 'checkbox')
                    .attr('name', 'overlap-buildings')
                    .property('checked', false);
                bld.append('span')
                    .text('Prevent overlapping buildings');

                body.append('table')
                    .attr('border', '1')
                    .attr('class', 'geoservice-table hide') // tag-list
                    .append('img').attr('src', 'img/loader-white.gif');

                // this button adds a new field to data brought in from the GeoService
                // for example you can add addr:state=VA to a city's addresses which otherwise wouldn't have this repeated field

                d3.selectAll('.geoservice-table')
                    .append('hr')
                    .attr('class', 'import-table-switch');

                body.append('button')
                    .attr('class', 'add-tag hide')
                    .html('Add key:value to all features')
                    .call(svgIcon('#icon-plus', 'icon light'))
                    .on('click', function() {
                        d3.selectAll('.import-table-switch').classed('import-table-switch', false);
                        var row = d3.selectAll('.geoservice-table').append('tr');
                        var uniqNum = Math.floor(Math.random() * 10000);

                        // fill in original name and sample value columns
                        row.append('td').text('Add');
                        row.append('td');

                        // the checkbox
                        row.append('td')
                            .attr('class', 'include-row')
                            .append('input')
                                .attr('type', 'checkbox')
                                .property('checked', true)
                                .property('disabled', true);

                        // final column stores key and value
                        var addval = row.append('td').append('div')
                            .attr('class', 'add-osm-key-val');

                        // the 'key' field, showing the new OSM tag key
                        var suggestedKeys = d3combobox().fetcher(getFetcher()).minItems(0);

                        addval.append('input')
                            .attr('type', 'text')
                            .attr('placeholder', 'new OSM key')
                            .attr('class', 'import-key-' + uniqNum)
                            .call(suggestedKeys)
                            .on('change', function() {
                                if (this.name) {
                                    geoserviceLayer.setField('add_' + this.value, 'add_' + this.name);
                                } else {
                                    geoserviceLayer.setField('add_' + this.value, null);
                                }
                                this.name = this.value;
                                d3.selectAll('.osm-key-' + uniqNum).attr('name', this.value);
                            });

                        addval.append('div').text('=');

                        // the 'value' field setting the new OSM tag default value
                        addval.append('input')
                            .attr('type', 'text')
                            .attr('placeholder', 'new OSM value')
                            .attr('class', 'osm-key-' + uniqNum)
                            .on('change', function() {
                                // properties with this.name renamed to this.value
                                geoserviceLayer.setField('add_' + this.name, this.value);
                            });
                    });

                pane.append('div')
                    .attr('class', 'help-text hide')
                    .text(t('geoservice.success'));

                pane.append('div')
                    .attr('class', 'layer-counted hide')
                    .html('<span class="global"></span> features; <span class="local"></span> in current view');

                // actual download buttons, with license check and memory step
                var startLoad = function() {
                    var url = d3.select('input.geoservice').property('value');
                    var blacklists = context.connection().imageryBlacklists();
                    for (var b = 0; b < blacklists.length; b++) {
                        if (url.match(new RegExp(blacklists[b]))) {
                            alert(t('geoservice.verboten'));
                            return;
                        }
                    }

                    if (!copyapproval.property('checked')) {
                        alert(t('geoservice.first_timer'));
                        return;
                    }
                    if (geoserviceLayer.license() || geoserviceLayer.metadata()) {
                        context.storage('license-' + (geoserviceLayer.license() || geoserviceLayer.metadata()), 'approved');
                    }

                    var importFields = geoserviceLayer.fields();
                    var importedAtLeastOneField = false;
                    if (geoserviceLayer.preset()) {
                    importedAtLeastOneField = true;
                    }
                    var hideFields = [];
                    _.map(Object.keys(importFields), function (field) {
                        if (importFields[field]) {
                            importedAtLeastOneField = true;
                        } else {
                            hideFields.push(field);
                        }
                    });
                    if (!importedAtLeastOneField) {
                        alert(t('geoservice.no_preset'));
                        return;
                    }

                    // change table to reflect permanent row update
                    // user must do Clear GeoService to clear things and start over

                    // hide rows which I didn't import
                    _.map(hideFields, function (field) {
                        d3.select('.geoservice-table tr.preview.' + field)
                            .style('display', 'none');
                    });
                    // don't show the import-or-not checkbox
                    d3.selectAll('.geoservice-table .include-row, .geoservice-table .combobox-caret')
                        .style('display', 'none');
                    // don't let user change or add OSM tags
                    d3.selectAll('.geoservice-table .osm-counterpart, .add-osm-key-val input')
                        .property('disabled', true);
                    d3.selectAll('.add-tag')
                        .style('display', 'none');

                    // help text
                    d3.selectAll('.geoservice-pane .help-text').classed('hide', false);

                    // change sidebar
                    d3.select('.geoservice-button-label')
                        .text(t('geoservice.view_import'));
                    hoverGeoService.title('View GeoService Import Details');
                    d3.selectAll('.list-item-geoservice label, .clear-geoservice')
                    .style('display', 'block');
                    d3.selectAll('.layer-counted')
                        .classed('hide', true);
                    setGeoService(d3.select('.topurl input.geoservice').property('value'));
                };
                pane.append('button')
                    .attr('class', 'url final local')
                    .property('disabled', true)
                    .text('Load In View')
                    .on('click', function() {
                        startLoad();
                    });
            }
            populatePane(this.pane);
        }

        function toggle() {
            // show and hide GeoService data import pane
            var geoservicePane = layers.layer('geoservice').pane();
            var hideMe = !geoservicePane.classed('hide');
            geoservicePane.classed('hide', hideMe);

            // if we're re-opening this window and previously saw zero entities, might retry geoservice call
            if (!hideMe && d3.select('.geoservice-pane .layer-counted .local').node && d3.select('.geoservice-pane .layer-counted .local').text() === '0') {
                d3.select('input.geoservice[type="text"]').on('input')(null,
                    d3.select('input.geoservice[type="text"]').property('value'));
            }
        }

        function editGeoService() {
            d3.event.preventDefault();
            toggle();
        }

        function setGeoService(template) {
            // un-hide GeoService pane and buttons
            var gsLayer = layers.layer('geoservice');
            gsLayer.pane()
                .classed('hide', false)
                .property('scrollTop', 0)
                .selectAll('.hide').classed('hide', false);

            // hide GeoService URL input
            gsLayer.pane().selectAll('.topurl, .url.final').classed('hide', true);

            // if there is an OSM preset, add it to set tags
            var setPreset = context.layers().layer('geoservice').preset();
            if (setPreset) {
                // set standard tags
                var tags = Object.keys(setPreset.tags);
                for (var t = 0; t < tags.length; t++) {
                    gsLayer.setField('add_' + tags[t], setPreset.tags[tags[t]]);
                }

                // suggest additional OSM tags
                var suggestedTags = [];
                _.map(setPreset.fields, function(field) {
                    suggestedTags = suggestedTags.concat(field.keys);
                });
            }

            refreshGeoService(template);
        }

        function refreshGeoService(template) {
            // start loading data onto the map
            var gsLayer = context.layers().layer('geoservice');
            gsLayer.lastBounds = null;
            gsLayer.url(template);
            gsLayer.pane().classed('hide', false);
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
                    .placement((textDirection === 'rtl') ? 'right' : 'left')
                )
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
                .call(drawOsmItem)
                .call(drawPhotoItems)
                .call(drawGpxItem)
                .call(drawGeoServiceItem);

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
            .call(svgIcon('#icon-data', 'light'))
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
            .call(svgIcon('#icon-close'));


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