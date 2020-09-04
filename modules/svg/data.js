import _throttle from 'lodash-es/throttle';

import { geoBounds as d3_geoBounds, geoPath as d3_geoPath } from 'd3-geo';
import { text as d3_text } from 'd3-fetch';
import { event as d3_event, select as d3_select } from 'd3-selection';

import stringify from 'fast-json-stable-stringify';
import toGeoJSON from '@mapbox/togeojson';

import { geoExtent, geoPolygonIntersectsPolygon } from '../geo';
import { services } from '../services';
import { svgPath } from './helpers';
import { utilDetect } from '../util/detect';
import { utilArrayFlatten, utilArrayUnion, utilHashcode } from '../util';


var _initialized = false;
var _enabled = false;
var _geojson;


export function svgData(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var _showLabels = true;
    var detected = utilDetect();
    var layer = d3_select(null);
    var _vtService;
    var _fileList;
    var _template;
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

        context.container()
            .attr('dropzone', 'copy')
            .on('drop.svgData', function() {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                if (!detected.filedrop) return;
                drawData.fileList(d3_event.dataTransfer.files);
            })
            .on('dragenter.svgData', over)
            .on('dragexit.svgData', over)
            .on('dragover.svgData', over);

        _initialized = true;
    }


    function getService() {
        if (services.vectorTile && !_vtService) {
            _vtService = services.vectorTile;
            _vtService.event.on('loadedData', throttledRedraw);
        } else if (!services.vectorTile && _vtService) {
            _vtService = null;
        }

        return _vtService;
    }


    function showLayer() {
        layerOn();

        layer
            .style('opacity', 0)
            .transition()
            .duration(250)
            .style('opacity', 1)
            .on('end', function () { dispatch.call('change'); });
    }


    function hideLayer() {
        throttledRedraw.cancel();

        layer
            .transition()
            .duration(250)
            .style('opacity', 0)
            .on('end', layerOff);
    }


    function layerOn() {
        layer.style('display', 'block');
    }


    function layerOff() {
        layer.selectAll('.viewfield-group').remove();
        layer.style('display', 'none');
    }


    // ensure that all geojson features in a collection have IDs
    function ensureIDs(gj) {
        if (!gj) return null;

        if (gj.type === 'FeatureCollection') {
            for (var i = 0; i < gj.features.length; i++) {
                ensureFeatureID(gj.features[i]);
            }
        } else {
            ensureFeatureID(gj);
        }
        return gj;
    }


    // ensure that each single Feature object has a unique ID
    function ensureFeatureID(feature) {
        if (!feature) return;
        feature.__featurehash__ = utilHashcode(stringify(feature));
        return feature;
    }


    // Prefer an array of Features instead of a FeatureCollection
    function getFeatures(gj) {
        if (!gj) return [];

        if (gj.type === 'FeatureCollection') {
            return gj.features;
        } else {
            return [gj];
        }
    }


    function featureKey(d) {
        return d.__featurehash__;
    }


    function isPolygon(d) {
        return d.geometry.type === 'Polygon' || d.geometry.type === 'MultiPolygon';
    }


    function clipPathID(d) {
        return 'ideditor-data-' + d.__featurehash__ + '-clippath';
    }


    function featureClasses(d) {
        return [
            'data' + d.__featurehash__,
            d.geometry.type,
            isPolygon(d) ? 'area' : '',
            d.__layerID__ || ''
        ].filter(Boolean).join(' ');
    }


    function drawData(selection) {
        var vtService = getService();
        var getPath = svgPath(projection).geojson;
        var getAreaPath = svgPath(projection, null, true).geojson;
        var hasData = drawData.hasData();

        layer = selection.selectAll('.layer-mapdata')
            .data(_enabled && hasData ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-mapdata')
            .merge(layer);

        var surface = context.surface();
        if (!surface || surface.empty()) return;  // not ready to draw yet, starting up


        // Gather data
        var geoData, polygonData;
        if (_template && vtService) {   // fetch data from vector tile service
            var sourceID = _template;
            vtService.loadTiles(sourceID, _template, projection);
            geoData = vtService.data(sourceID, projection);
        } else {
            geoData = getFeatures(_geojson);
        }
        geoData = geoData.filter(getPath);
        polygonData = geoData.filter(isPolygon);


        // Draw clip paths for polygons
        var clipPaths = surface.selectAll('defs').selectAll('.clipPath-data')
           .data(polygonData, featureKey);

        clipPaths.exit()
           .remove();

        var clipPathsEnter = clipPaths.enter()
           .append('clipPath')
           .attr('class', 'clipPath-data')
           .attr('id', clipPathID);

        clipPathsEnter
           .append('path');

        clipPaths.merge(clipPathsEnter)
           .selectAll('path')
           .attr('d', getAreaPath);


        // Draw fill, shadow, stroke layers
        var datagroups = layer
            .selectAll('g.datagroup')
            .data(['fill', 'shadow', 'stroke']);

        datagroups = datagroups.enter()
            .append('g')
            .attr('class', function(d) { return 'datagroup datagroup-' + d; })
            .merge(datagroups);


        // Draw paths
        var pathData = {
            fill: polygonData,
            shadow: geoData,
            stroke: geoData
        };

        var paths = datagroups
            .selectAll('path')
            .data(function(layer) { return pathData[layer]; }, featureKey);

        // exit
        paths.exit()
            .remove();

        // enter/update
        paths = paths.enter()
            .append('path')
            .attr('class', function(d) {
                var datagroup = this.parentNode.__data__;
                return 'pathdata ' + datagroup + ' ' + featureClasses(d);
            })
            .attr('clip-path', function(d) {
                var datagroup = this.parentNode.__data__;
                return datagroup === 'fill' ? ('url(#' + clipPathID(d) + ')') : null;
            })
            .merge(paths)
            .attr('d', function(d) {
                var datagroup = this.parentNode.__data__;
                return datagroup === 'fill' ? getAreaPath(d) : getPath(d);
            });


        // Draw labels
        layer
            .call(drawLabels, 'label-halo', geoData)
            .call(drawLabels, 'label', geoData);


        function drawLabels(selection, textClass, data) {
            var labelPath = d3_geoPath(projection);
            var labelData = data.filter(function(d) {
                return _showLabels && d.properties && (d.properties.desc || d.properties.name);
            });

            var labels = selection.selectAll('text.' + textClass)
                .data(labelData, featureKey);

            // exit
            labels.exit()
                .remove();

            // enter/update
            labels = labels.enter()
                .append('text')
                .attr('class', function(d) { return textClass + ' ' + featureClasses(d); })
                .merge(labels)
                .text(function(d) {
                    return d.properties.desc || d.properties.name;
                })
                .attr('x', function(d) {
                    var centroid = labelPath.centroid(d);
                    return centroid[0] + 11;
                })
                .attr('y', function(d) {
                    var centroid = labelPath.centroid(d);
                    return centroid[1];
                });
        }
    }


    function getExtension(fileName) {
        if (!fileName) return;

        var re = /\.(gpx|kml|(geo)?json)$/i;
        var match = fileName.toLowerCase().match(re);
        return match && match.length && match[0];
    }


    function xmlToDom(textdata) {
        return (new DOMParser()).parseFromString(textdata, 'text/xml');
    }


    drawData.setFile = function(extension, data) {
        _template = null;
        _fileList = null;
        _geojson = null;
        _src = null;

        var gj;
        switch (extension) {
            case '.gpx':
                gj = toGeoJSON.gpx(xmlToDom(data));
                break;
            case '.kml':
                gj = toGeoJSON.kml(xmlToDom(data));
                break;
            case '.geojson':
            case '.json':
                gj = JSON.parse(data);
                break;
        }

        gj = gj || {};
        if (Object.keys(gj).length) {
            _geojson = ensureIDs(gj);
            _src = extension + ' data file';
            this.fitZoom();
        }

        dispatch.call('change');
        return this;
    };


    drawData.showLabels = function(val) {
        if (!arguments.length) return _showLabels;

        _showLabels = val;
        return this;
    };


    drawData.enabled = function(val) {
        if (!arguments.length) return _enabled;

        _enabled = val;
        if (_enabled) {
            showLayer();
        } else {
            hideLayer();
        }

        dispatch.call('change');
        return this;
    };


    drawData.hasData = function() {
        var gj = _geojson || {};
        return !!(_template || Object.keys(gj).length);
    };


    drawData.template = function(val, src) {
        if (!arguments.length) return _template;

        // test source against OSM imagery blocklists..
        var osm = context.connection();
        if (osm) {
            var blocklists = osm.imageryBlocklists();
            var fail = false;
            var tested = 0;
            var regex;

            for (var i = 0; i < blocklists.length; i++) {
                regex = blocklists[i];
                fail = regex.test(val);
                tested++;
                if (fail) break;
            }

            // ensure at least one test was run.
            if (!tested) {
                regex = /.*\.google(apis)?\..*\/(vt|kh)[\?\/].*([xyz]=.*){3}.*/;
                fail = regex.test(val);
            }
        }

        _template = val;
        _fileList = null;
        _geojson = null;

        // strip off the querystring/hash from the template,
        // it often includes the access token
        _src = src || ('vectortile:' + val.split(/[?#]/)[0]);

        dispatch.call('change');
        return this;
    };


    drawData.geojson = function(gj, src) {
        if (!arguments.length) return _geojson;

        _template = null;
        _fileList = null;
        _geojson = null;
        _src = null;

        gj = gj || {};
        if (Object.keys(gj).length) {
            _geojson = ensureIDs(gj);
            _src = src || 'unknown.geojson';
        }

        dispatch.call('change');
        return this;
    };


    drawData.fileList = function(fileList) {
        if (!arguments.length) return _fileList;

        _template = null;
        _fileList = fileList;
        _geojson = null;
        _src = null;

        if (!fileList || !fileList.length) return this;
        var f = fileList[0];
        var extension = getExtension(f.name);
        var reader = new FileReader();
        reader.onload = (function() {
            return function(e) {
                drawData.setFile(extension, e.target.result);
            };
        })(f);

        reader.readAsText(f);

        return this;
    };


    drawData.url = function(url, defaultExtension) {
        _template = null;
        _fileList = null;
        _geojson = null;
        _src = null;

        // strip off any querystring/hash from the url before checking extension
        var testUrl = url.split(/[?#]/)[0];
        var extension = getExtension(testUrl) || defaultExtension;
        if (extension) {
            _template = null;
            d3_text(url)
                .then(function(data) {
                    drawData.setFile(extension, data);
                })
                .catch(function() {
                    /* ignore */
                });

        } else {
            drawData.template(url);
        }

        return this;
    };


    drawData.getSrc = function() {
        return _src || '';
    };


    drawData.fitZoom = function() {
        var features = getFeatures(_geojson);
        if (!features.length) return;

        var map = context.map();
        var viewport = map.trimmedExtent().polygon();
        var coords = features.reduce(function(coords, feature) {
            var geom = feature.geometry;
            if (!geom) return coords;

            var c = geom.coordinates;

            /* eslint-disable no-fallthrough */
            switch (geom.type) {
                case 'Point':
                    c = [c];
                case 'MultiPoint':
                case 'LineString':
                    break;

                case 'MultiPolygon':
                    c = utilArrayFlatten(c);
                case 'Polygon':
                case 'MultiLineString':
                    c = utilArrayFlatten(c);
                    break;
            }
            /* eslint-enable no-fallthrough */

            return utilArrayUnion(coords, c);
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
