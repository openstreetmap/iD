import _isEmpty from 'lodash-es/isEmpty';

import { selectAll as d3_selectAll } from 'd3-selection';

import { t } from '../util/locale';


export function svgGeoService(projection, context, dispatch) {

    function drawGeoService() {
        var geojson = drawGeoService.geojson();
        // var enabled = drawGeoService.enabled();

        if (!geojson || !geojson.features) {
            return;
        }
        return this;
    }


    drawGeoService.pane = function() {
        if (!this.geoservicepane) {
            this.geoservicepane = d3_selectAll('.geoservice-pane');
        }
        return this.geoservicepane;
    };


    drawGeoService.enabled = function(_) {
        if (!arguments.length) return svgGeoService.enabled;
        svgGeoService.enabled = _;
        dispatch.call('change');
        return this;
    };


    drawGeoService.hasData = function() {
        var geojson = drawGeoService.geojson();
        return (!(_isEmpty(geojson) || _isEmpty(geojson.features)));
    };


    drawGeoService.preset = function(preset) {
        // get / set an individual preset, or reset to null
        var presetBox = this.pane().selectAll('.preset');
        if (preset) {
            // preset.tags { }
            // preset.fields[{ keys: [], strings: { placeholders: { } } }]
            var tag = [preset.icon || '', preset.id.split('/')[0], preset.id.replace('/', '-')];
            if (preset.id.indexOf('driveway') > -1) {
                tag = ['highway-service', 'tag-highway', 'tag-highway-service', 'tag-service', 'tag-service-driveway'];
            }

            var iconHolder = presetBox.select('.preset-icon-holder')
                .html('');

            if (!preset.icon) {
                preset.icon = 'marker-stroked';
            }
            if (preset.geometry && preset.geometry[preset.geometry.length - 1] === 'area') {
                // add background first
                var pair = iconHolder.append('div')
                    .attr('class', 'preset-icon preset-icon-24')
                    .append('svg')
                        .attr('class', ['icon', tag[0], tag[2], 'tag-' + tag[1], 'tag-' + tag[2]].join(' '));

                pair.append('use')
                    .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
                    .attr('xlink:href', '#' + tag[0].replace('tag-', ''));
                pair.append('use')
                    .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
                    .attr('xlink:href', '#' + tag[0].replace('tag-', '') + '-15');

                // add inner icon
                iconHolder.append('div')
                    .attr('class', 'preset-icon-frame')
                    .append('svg')
                        .attr('class', 'icon')
                        .append('use')
                            .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
                            .attr('xlink:href', '#preset-icon-frame');


            } else if (preset.geometry && preset.geometry[preset.geometry.length - 1] === 'line') {
                iconHolder.append('div')
                    .attr('class', 'preset-icon preset-icon-60')
                    .append('svg')
                        .attr('class', ['icon', tag[0], tag[2], 'tag-' + tag[1], 'tag-' + tag[2]].join(' '))
                        .append('use')
                            .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
                            .attr('xlink:href', '#' + tag[2].replace('tag-', ''));
            } else {
                iconHolder.append('div')
                    .attr('class', 'preset-icon preset-icon-28')
                    .append('svg')
                        .attr('class', 'icon ' + tag[0])
                        .append('use')
                            .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
                            .attr('xlink:href', '#' + tag[0].replace('tag-', '') + '-15');
            }

            //presetBox.selectAll('label.preset-prompt').text('OSM preset: ');
            //presetBox.selectAll('span.preset-prompt').text(preset.id);
            presetBox.selectAll('.preset-prompt')
                .classed('hide', true);
            presetBox.selectAll('button, .preset-icon-fill, .preset-icon')
                .classed('hide', false);
            this.internalPreset = preset;

            // special geo circumstances
            if (preset.id === 'address') {
                return d3_selectAll('.point-in-polygon').classed('must-show', true);
            } else if (preset.id.indexOf('cycle') > -1) {
                return d3_selectAll('.merge-lines').classed('must-show', true);
            } else if (preset.id.indexOf('building') > -1) {
                return d3_selectAll('.overlap-buildings').classed('must-show', true);
            } else {
                //console.log(preset.id);
            }

        } else if (preset === null) {
            // removing preset status
            presetBox.selectAll('.preset label.preset-prompt')
                .text(t('geoservice.match_preset'));
            presetBox.selectAll('.preset-prompt')
                .classed('hide', false);
            presetBox.selectAll('.preset span.preset-prompt, .preset svg')
                .html('');
            presetBox.selectAll('.preset button, .preset-icon-fill, .preset-icon')
                .classed('hide', true);

            this.internalPreset = null;
        } else {
            return this.internalPreset;
        }

        // reset UI for point-in-polygon and merge-lines
        d3_selectAll('.point-in-polygon, .merge-lines, .overlap-buildings')
            .classed('must-show', false)
            .selectAll('input')
                .property('checked', false);
    };


    drawGeoService.setField = function(geoservice_key, osm_tag) {
        var fields = drawGeoService.fields();
        fields[geoservice_key] = osm_tag;
        drawGeoService.fields(fields);
        return this;
    };

    drawGeoService.license = function(license_text) {
        if (!arguments.length) return (drawGeoService.license_text || '');
        drawGeoService.license_text = license_text;
        return this;
    };

    drawGeoService.metadata = function(metadata_url) {
        if (!arguments.length) return (drawGeoService.metadata_url || '');
        drawGeoService.metadata_url = metadata_url;
        return this;
    };

    drawGeoService.importPlan = function(plan_url) {
        if (!arguments.length) return (drawGeoService.plan_url || '');
        drawGeoService.planUrl = plan_url;
        return this;
    };

    // drawGeoService.url = function(true_url, downloadMax) {
    //     if (!this.layerUrl) {
    //         drawGeoService.layerUrl = true_url;
    //     }
    //     var fmt = drawGeoService.format() || 'json';

    //     // add necessary URL parameters to the user's URL
    //     var url = true_url;
    //     if (url.indexOf('/query') === -1) {
    //         if (url[url.length - 1] !== '/') {
    //             url += '/';
    //         }
    //         url += 'query?';
    //     }
    //     if (url.indexOf('?') === -1) {
    //         url += '?';
    //     }
    //     if (downloadMax && url.indexOf('where') === -1) {
    //         // if there is no spatial query, need a SQL query here
    //         url += 'where=1>0';
    //     }
    //     if (url.indexOf('outSR') === -1) {
    //         url += '&outSR=4326';
    //     }
    //     if (url.indexOf('&f=') === -1) {
    //         url += '&f=' + fmt;
    //     }
    //     if (url.indexOf('maxAllowableOffset') === -1) {
    //         url += '&maxAllowableOffset=0.000005';
    //     }
    //     if (url.indexOf('outFields=') === -1) {
    //         var allFields = drawGeoService.fields();
    //         var selectFields = [];
    //         _map(Object.keys(allFields), function(field) {
    //             if (allFields[field] && field.indexOf('add_') !== 0) {
    //                 selectFields.push(field);
    //             }
    //         });
    //         url += '&outFields=' + (selectFields.join(',') || '*');
    //     }

    //     // turn iD Editor bounds into a query
    //     var bounds = context.map().trimmedExtent().bbox();
    //     bounds = JSON.stringify({
    //         xmin: bounds.minX.toFixed(6) * 1,
    //         ymin: bounds.minY.toFixed(6) * 1,
    //         xmax: bounds.maxX.toFixed(6) * 1,
    //         ymax: bounds.maxY.toFixed(6) * 1,
    //         spatialReference: {
    //           wkid: 4326
    //         }
    //     });
    //     if (this.lastBounds === bounds) {
    //         // unchanged bounds, unchanged import parameters, so unchanged data
    //         return this;
    //     }

    //     // data has changed - make a query
    //     this.lastBounds = bounds;

    //     // make a spatial query within the user viewport (unless the user made their own spatial query)
    //     if (!downloadMax && (url.indexOf('spatialRel') === -1)) {
    //         url += '&geometry=' + this.lastBounds;
    //         url += '&geometryType=esriGeometryEnvelope';
    //         url += '&spatialRel=esriSpatialRelIntersects';
    //         url += '&inSR=4326';
    //     }

    //     var that = this;
    //     d3_json(url, function(err, data) {
    //         if (err) {
    //             // console.log('GeoService URL did not load');
    //             // console.error(err);
    //         } else {
    //             // convert EsriJSON text to GeoJSON object
    //             var jsondl = (fmt === 'geojson') ? data : fromEsri.fromEsri(data);

    //             // warn if went over server's maximum results count
    //             if (data.exceededTransferLimit) {
    //                 alert(t('geoservice.exceeded_limit') + data.features.length);
    //             }

    //             _map(jsondl.features, function(selectfeature) {
    //                 return that.processGeoFeature(selectfeature, that.preset());
    //             });

    //             // send the modified geo-features to the draw layer
    //             drawGeoService.geojson(jsondl);
    //         }
    //     });

    //     return this;
    // };

    return drawGeoService;
}
