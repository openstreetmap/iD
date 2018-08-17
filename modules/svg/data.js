import _flatten from 'lodash-es/flatten';
import _isEmpty from 'lodash-es/isEmpty';
import _reduce from 'lodash-es/reduce';
import _union from 'lodash-es/union';

import { geoBounds as d3_geoBounds } from 'd3-geo';

import {
    request as d3_request,
    text as d3_text
} from 'd3-request';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import toGeoJSON from '@mapbox/togeojson';
import vt from '@mapbox/vector-tile';
import Protobuf from 'pbf';

import { geoExtent, geoPolygonIntersectsPolygon } from '../geo';
import { svgPath } from './index';
import { utilDetect } from '../util/detect';


var _initialized = false;
var _enabled = false;
var _geojson;


export function svgData(projection, context, dispatch) {
    var _showLabels = true;
    var detected = utilDetect();
    var layer;
    var _src;


    function init() {
        if (_initialized) return;  // run once

        _geojson = {};
        _enabled = true;

        function over() {
            d3_event.stopPropagation();
            d3_event.preventDefault();
            d3_event.dataTransfer.dropEffect = 'copy';
        }

        d3_select('body')
            .attr('dropzone', 'copy')
            .on('drop.svgData', function() {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                if (!detected.filedrop) return;
                drawData.files(d3_event.dataTransfer.files);
            })
            .on('dragenter.svgData', over)
            .on('dragexit.svgData', over)
            .on('dragover.svgData', over);

        _initialized = true;
    }


    function drawData(selection) {
        var getPath = svgPath(projection).geojson;

        layer = selection.selectAll('.layer-geojson')
            .data(_enabled ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-geojson')
            .merge(layer);


        var paths = layer
            .selectAll('path')
            .data([_geojson]);

        paths.exit()
            .remove();

        paths = paths.enter()
            .append('path')
            .attr('class', 'pathdata')
            .merge(paths);

        paths
            .attr('d', getPath);


        var labelData = _showLabels && _geojson.features ? _geojson.features : [];
        labelData = labelData.filter(getPath);

        layer
            .call(drawLabels, 'label-halo', labelData)
            .call(drawLabels, 'label', labelData);


        function drawLabels(selection, textClass, data) {
            var labels = selection.selectAll('text.' + textClass)
                .data(data);

            // exit
            labels.exit()
                .remove();

            // enter/update
            labels = labels.enter()
                .append('text')
                .attr('class', textClass)
                .merge(labels)
                .text(function(d) {
                    if (d.properties) {
                        return d.properties.desc || d.properties.name;
                    }
                    return null;
                })
                .attr('x', function(d) {
                    var centroid = getPath.centroid(d);
                    return centroid[0] + 11;
                })
                .attr('y', function(d) {
                    var centroid = getPath.centroid(d);
                    return centroid[1];
                });
        }
    }


    function getExtension(fileName) {
        if (fileName === undefined) {
            return '';
        }

        var lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex < 0) {
            return '';
        }

        return fileName.substr(lastDotIndex);
    }


    function toDom(textdata) {
        return (new DOMParser()).parseFromString(textdata, 'text/xml');
    }


    function vtToGeoJSON(bufferdata) {
        var tile = new vt.VectorTile(new Protobuf(bufferdata.data.response));
        var layers = Object.keys(tile.layers);
        if (!Array.isArray(layers)) { layers = [layers]; }

        var collection = {type: 'FeatureCollection', features: []};

        layers.forEach(function (layerID) {
            var layer = tile.layers[layerID];
            if (layer) {
                for (var i = 0; i < layer.length; i++) {
                    var feature = layer.feature(i).toGeoJSON(bufferdata.zxy[2], bufferdata.zxy[3], bufferdata.zxy[1]);
                    if (layers.length > 1) feature.properties.vt_layer = layerID;
                    collection.features.push(feature);
                }
            }
        });

        return collection;
    }


    function parseSaveAndZoom(extension, data, name) {
        switch (extension) {
            case '.gpx':
                drawData.geojson(toGeoJSON.gpx(toDom(data)), name).fitZoom();
                break;
            case '.kml':
                drawData.geojson(toGeoJSON.kml(toDom(data)), name).fitZoom();
                break;
            case '.pbf':
                drawData.geojson(vtToGeoJSON(data), name).fitZoom();
                break;
            case '.mvt':
                drawData.geojson(vtToGeoJSON(data), name).fitZoom();
                break;
            case '.geojson':
            case '.json':
                drawData.geojson(JSON.parse(data), name).fitZoom();
                break;
        }
    }


    drawData.showLabels = function(val) {
        if (!arguments.length) return _showLabels;
        _showLabels = val;
        return this;
    };


    drawData.enabled = function(val) {
        if (!arguments.length) return _enabled;
        _enabled = val;
        dispatch.call('change');
        return this;
    };


    drawData.hasData = function() {
        return (!(_isEmpty(_geojson) || _isEmpty(_geojson.features)));
    };


    drawData.geojson = function(gj, src) {
        if (!arguments.length) return _geojson;
        if (_isEmpty(gj) || _isEmpty(gj.features)) return this;
        _geojson = gj;
        _src = src || 'unknown.geojson';
        dispatch.call('change');
        return this;
    };


    drawData.url = function(url) {
        var extension = getExtension(url);
        if (extension === 'mvt' || extension === 'pbf') {
            d3_request(url)
                .responseType('arraybuffer')
                .get(function(err, data) {
                    if (err || !data) return;
                    _src = url;
                    var match = url.match(/(pbf|mvt)/i);
                    var extension = match ? ('.' + match[0].toLowerCase()) : '';
                    var zxy = url.match(/\/(\d+)\/(\d+)\/(\d+)/);
                    var bufferdata = {
                        data : data,
                        zxy : zxy
                    };
                    parseSaveAndZoom(extension, bufferdata);
                });
        } else {
            d3_text(url, function(err, data) {
                if (!err) {
                    parseSaveAndZoom(extension, data, url);
                }
            });
        }

        return this;
    };


    drawData.files = function(fileList) {
        if (!fileList.length) return this;
        var f = fileList[0];
        var reader = new FileReader();
        var extension = getExtension(f.name);

        if (extension === 'mvt' || extension === 'pbf') {
            reader.onload = (function(file) {
                return; // todo find x,y,z
                var data = [];
                var zxy = [0,0,0];

                _src = file.name;
                var extension = getExtension(file.name);
                var bufferdata = {
                    data: data,
                    zxy: zxy
                };
                return function (e) {
                    bufferdata.data = e.target.result;
                    parseSaveAndZoom(extension, bufferdata);
                };
            })(f);

            reader.readAsArrayBuffer(f);

        } else {
            reader.onload = (function(file) {
                return function (e) {
                    parseSaveAndZoom(extension, e.target.result, file.name);
                };
            })(f);

            reader.readAsText(f);
        }

        return this;
    };


    drawData.getSrc = function() {
        return _src;
    };


    drawData.fitZoom = function() {
        if (!this.hasData()) return this;

        var map = context.map();
        var viewport = map.trimmedExtent().polygon();
        var coords = _reduce(_geojson.features, function(coords, feature) {
            var c = feature.geometry.coordinates;

            /* eslint-disable no-fallthrough */
            switch (feature.geometry.type) {
                case 'Point':
                    c = [c];
                case 'MultiPoint':
                case 'LineString':
                    break;

                case 'MultiPolygon':
                    c = _flatten(c);
                case 'Polygon':
                case 'MultiLineString':
                    c = _flatten(c);
                    break;
            }
            /* eslint-enable no-fallthrough */

            return _union(coords, c);
        }, []);

        if (!geoPolygonIntersectsPolygon(viewport, coords, true)) {
            var extent = geoExtent(d3_geoBounds({ type: 'LineString', coordinates: coords }));
            map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
        }

        return this;
    };


    init();
    return drawData;
}
