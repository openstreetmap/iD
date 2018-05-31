import _flatten from 'lodash-es/flatten';
import _isEmpty from 'lodash-es/isEmpty';
import _isUndefined from 'lodash-es/isUndefined';
import _reduce from 'lodash-es/reduce';
import _union from 'lodash-es/union';

import { geoBounds as d3_geoBounds } from 'd3-geo';
import { text as d3_text } from 'd3-request';
import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { geoExtent, geoPolygonIntersectsPolygon } from '../geo';
import { svgPath } from './index';
import { utilDetect } from '../util/detect';
import vt from '@mapbox/vector-tile';
import Protobuf from 'pbf';


var _initialized = false;
var _enabled = false;
var _geojson;


export function svgMvt(projection, context, dispatch) {
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
            .on('drop.localmvt', function() {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                if (!detected.filedrop) return;
                drawMvt.files(d3_event.dataTransfer.files);
            })
            .on('dragenter.localmvt', over)
            .on('dragexit.localmvt', over)
            .on('dragover.localmvt', over);

        _initialized = true;
    }


    function drawMvt(selection) {
        var getPath = svgPath(projection).geojson;

        layer = selection.selectAll('.layer-mvt')
            .data(_enabled ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-mvt')
            .merge(layer);


        var paths = layer
            .selectAll('path')
            .data([_geojson]);

        paths.exit()
            .remove();

        paths = paths.enter()
            .append('path')
            .attr('class', 'mvt')
            .merge(paths);

        paths
            .attr('d', getPath);


        var labelData = _showLabels && _geojson.features ? _geojson.features : [];
        labelData = labelData.filter(getPath);

        layer
            .call(drawLabels, 'mvtlabel-halo', labelData)
            .call(drawLabels, 'mvtlabel', labelData);


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


    function vtToGeoJson(x) {
        var tile = new vt.VectorTile(new Protobuf(x));
        var layers = Object.keys(tile.layers);
        if (!Array.isArray(layers))
        layers = [layers]

        var collection = {type: 'FeatureCollection', features: []};

        layers.forEach(function (layerID) {
            var layer = tile.layers[layerID];
            if (layer) {
                for (var i = 0; i < layer.length; i++) {
                    var feature = layer.feature(i).toGeoJSON(0, 1, 2);
                    if (layers.length > 1) feature.properties.vt_layer = layerID;
                    collection.features.push(feature);
                }
            }
        });
        return collection;
    }


    function getExtension(fileName) {
        if (_isUndefined(fileName)) {
            return '';
        }

        var lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex < 0) {
            return '';
        }

        return fileName.substr(lastDotIndex);
    }


    function parseSaveAndZoom(extension, data) {
        switch (extension) {
            default:
                drawMvt.geojson(JSON.parse(data)).fitZoom();
                break;
            case '.pbf':
                drawMvt.geojson(vtToGeoJson(data)).fitZoom();
                break;
            case '.mvt':
                drawMvt.geojson(vtToGeoJson(data)).fitZoom();
                break;
            case '.geojson':
            case '.json':
                drawMvt.geojson(JSON.parse(data)).fitZoom();
                break;
        }
    }


    drawMvt.showLabels = function(_) {
        if (!arguments.length) return _showLabels;
        _showLabels = _;
        return this;
    };


    drawMvt.enabled = function(_) {
        if (!arguments.length) return _enabled;
        _enabled = _;
        dispatch.call('change');
        return this;
    };


    drawMvt.hasMvt = function() {
        return (!(_isEmpty(_geojson) || _isEmpty(_geojson.features)));
    };


    drawMvt.geojson = function(gj) {
        if (!arguments.length) return _geojson;
        if (_isEmpty(gj) || _isEmpty(gj.features)) return this;
        _geojson = gj;
        dispatch.call('change');
        return this;
    };


    drawMvt.url = function(url) {
        d3_text(url, function(err, data) {
            if (!err) {
                _src = url;
                var extension = getExtension(url);
                parseSaveAndZoom(extension, data);
            }
        });
        return this;
    };


    drawMvt.files = function(fileList) {
        if (!fileList.length) return this;
        var f = fileList[0],
            reader = new FileReader();

        reader.onload = (function(file) {
            _src = file.name;
            var extension = getExtension(file.name);
            return function (e) {
                parseSaveAndZoom(extension, e.target.result);
            };
        })(f);

        reader.readAsArrayBuffer(f);
        return this;
    };


    drawMvt.getSrc = function () {
        return _src;
    };


    drawMvt.fitZoom = function() {
        if (!this.hasMvt()) return this;

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
    return drawMvt;
}
