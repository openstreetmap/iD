import _flatten from 'lodash-es/flatten';
import _isEmpty from 'lodash-es/isEmpty';
import _isUndefined from 'lodash-es/isUndefined';
import _reduce from 'lodash-es/reduce';
import _union from 'lodash-es/union';

import {
    geoBounds as d3_geoBounds,
    geoPath as d3_geoPath
} from 'd3-geo';

import {
    text as d3_text
} from 'd3-request';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { geoExtent, geoPolygonIntersectsPolygon } from '../geo';
import { utilDetect } from '../util/detect';
import toGeoJSON from '@mapbox/togeojson';


export function svgGpx(projection, context, dispatch) {
    var showLabels = true,
        detected = utilDetect(),
        layer,
        src;


    function init() {
        if (svgGpx.initialized) return;  // run once

        svgGpx.geojson = {};
        svgGpx.enabled = true;

        function over() {
            d3_event.stopPropagation();
            d3_event.preventDefault();
            d3_event.dataTransfer.dropEffect = 'copy';
        }

        d3_select('body')
            .attr('dropzone', 'copy')
            .on('drop.localgpx', function() {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                if (!detected.filedrop) return;
                drawGpx.files(d3_event.dataTransfer.files);
            })
            .on('dragenter.localgpx', over)
            .on('dragexit.localgpx', over)
            .on('dragover.localgpx', over);

        svgGpx.initialized = true;
    }


    function drawGpx(selection) {
        var geojson = svgGpx.geojson,
            enabled = svgGpx.enabled;

        layer = selection.selectAll('.layer-gpx')
            .data(enabled ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-gpx')
            .merge(layer);


        var paths = layer
            .selectAll('path')
            .data([geojson]);

        paths.exit()
            .remove();

        paths = paths.enter()
            .append('path')
            .attr('class', 'gpx')
            .merge(paths);


        var path = d3_geoPath(projection);

        paths
            .attr('d', path);


        var labels = layer.selectAll('text')
            .data(showLabels && geojson.features ? geojson.features : []);

        labels.exit()
            .remove();

        labels = labels.enter()
            .append('text')
            .attr('class', 'gpx')
            .merge(labels);

        labels
            .text(function(d) {
                return d.properties.desc || d.properties.name;
            })
            .attr('x', function(d) {
                var centroid = path.centroid(d);
                return centroid[0] + 7;
            })
            .attr('y', function(d) {
                var centroid = path.centroid(d);
                return centroid[1];
            });

    }


    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
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
                drawGpx.geojson(toGeoJSON.gpx(toDom(data))).fitZoom();
                break;
            case '.kml':
                drawGpx.geojson(toGeoJSON.kml(toDom(data))).fitZoom();
                break;
            case '.geojson':
            case '.json':
                drawGpx.geojson(JSON.parse(data)).fitZoom();
                break;
        }
    }


    drawGpx.showLabels = function(_) {
        if (!arguments.length) return showLabels;
        showLabels = _;
        return this;
    };


    drawGpx.enabled = function(_) {
        if (!arguments.length) return svgGpx.enabled;
        svgGpx.enabled = _;
        dispatch.call('change');
        return this;
    };


    drawGpx.hasGpx = function() {
        var geojson = svgGpx.geojson;
        return (!(_isEmpty(geojson) || _isEmpty(geojson.features)));
    };


    drawGpx.geojson = function(gj) {
        if (!arguments.length) return svgGpx.geojson;
        if (_isEmpty(gj) || _isEmpty(gj.features)) return this;
        svgGpx.geojson = gj;
        dispatch.call('change');
        return this;
    };


    drawGpx.url = function(url) {
        d3_text(url, function(err, data) {
            if (!err) {
                src = url;

                var extension = getExtension(url);
                parseSaveAndZoom(extension, data);
            }
        });
        return this;
    };


    drawGpx.files = function(fileList) {
        if (!fileList.length) return this;
        var f = fileList[0],
            reader = new FileReader();

        reader.onload = (function(file) {
            src = file.name;

            var extension = getExtension(file.name);

            return function (e) {
                parseSaveAndZoom(extension, e.target.result);
            };
        })(f);

        reader.readAsText(f);
        return this;
    };

    drawGpx.getSrc = function () {
      return src;
    };

    drawGpx.fitZoom = function() {
        if (!this.hasGpx()) return this;
        var geojson = svgGpx.geojson;

        var map = context.map(),
            viewport = map.trimmedExtent().polygon(),
            coords = _reduce(geojson.features, function(coords, feature) {
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
    return drawGpx;
}
