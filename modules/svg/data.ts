import { throttle } from 'es-toolkit';

import { geoBounds as d3_geoBounds, geoPath as d3_geoPath } from 'd3-geo';
import { text as d3_text } from 'd3-fetch';
import { select as d3_select } from 'd3-selection';

import stringify from 'fast-json-stable-stringify';
import { gpx, kml } from '@tmcw/togeojson';

import { geoExtent, geoPolygonIntersectsPolygon } from '../geo';
import { services } from '../services';
import { svgPath } from './helpers';
import { utilDetect } from '../util/detect';
import { utilArrayFlatten, utilArrayUnion, utilHashcode } from '../util';
import type { Projection } from '../geo/raw_mercator';
import type { coreContext } from '../core';
import type { Dispatch } from 'd3';
import type { Feature as GeoJsonFeature, FeatureCollection } from 'geojson';

interface Feature extends GeoJsonFeature {
    /** property added by iD */
    __featurehash__?: number;
    /** property added by iD */
    __layerID__?: string;
}


var _initialized = false;
var _enabled = false;
var _geojson: FeatureCollection | Feature | null;


export function svgData(projection: Projection, context: coreContext, dispatch: Dispatch<object>) {
    var throttledRedraw = throttle(function () { dispatch.call('change'); }, 1000);
    var _showLabels = true;
    var detected = utilDetect();
    let layer: d3.Selection<SVGGElement> = d3_select(null!);
    var _vtService: typeof services.vectorTile | null;
    var _fileList: File[] | null;
    var _template: string | null;
    var _src: string | null;

    const supportedFormats = [
        '.gpx',
        '.kml',
        '.geojson',
        '.json'
    ];


    function init() {
        if (_initialized) return;  // run once

        _geojson = {} as FeatureCollection;
        _enabled = true;

        function over(d3_event: DragEvent) {
            d3_event.stopPropagation();
            d3_event.preventDefault();
            d3_event.dataTransfer!.dropEffect = 'copy';
        }

        context.container()
            .attr('dropzone', 'copy')
            .on('drop.svgData', function(d3_event) {
                d3_event.stopPropagation();
                d3_event.preventDefault();
                if (!detected.filedrop) return;
                var f = d3_event.dataTransfer.files[0];
                var extension = getExtension(f.name);
                if (!extension || !supportedFormats.includes(extension)) return;
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
    function ensureIDs(gj: FeatureCollection | Feature) {
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
    function ensureFeatureID(feature: Feature) {
        if (!feature) return;
        feature.__featurehash__ = utilHashcode(stringify(feature));
        return feature;
    }


    // Prefer an array of Features instead of a FeatureCollection
    function getFeatures(gj: FeatureCollection | Feature | null) {
        if (!gj) return [];

        if (gj.type === 'FeatureCollection') {
            return gj.features;
        } else {
            return [gj];
        }
    }


    function featureKey(d: Feature) {
        return d.__featurehash__!;
    }


    function isPolygon(d: Feature) {
        return d.geometry.type === 'Polygon' || d.geometry.type === 'MultiPolygon';
    }


    function clipPathID(d: Feature) {
        return 'ideditor-data-' + d.__featurehash__ + '-clippath';
    }


    function featureClasses(d: Feature) {
        return [
            'data' + d.__featurehash__,
            d.geometry.type,
            isPolygon(d) ? 'area' : '',
            d.__layerID__ || ''
        ].filter(Boolean).join(' ');
    }


    function drawData(selection: d3.Selection<SVGGElement>) {
        var vtService = getService();
        var getPath = svgPath(projection).geojson;
        var getAreaPath = svgPath(projection, null, true).geojson;
        var hasData = drawData.hasData();

        layer = selection.selectAll<SVGGElement, 0>('.layer-mapdata')
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
        var clipPaths = surface.selectAll('defs').selectAll<SVGClipPathElement, Feature>('.clipPath-data')
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


        type DataGroup = 'fill' | 'shadow' | 'stroke';
        // Draw fill, shadow, stroke layers
        var datagroups = layer
            .selectAll<SVGGElement, DataGroup>('g.datagroup')
            .data<DataGroup>(['fill', 'shadow', 'stroke']);

        datagroups = datagroups.enter()
            .append('g')
            .attr('class', function(d) { return 'datagroup datagroup-' + d; })
            .merge(datagroups);


        // Draw paths
        var pathData: Record<DataGroup, Feature[]> = {
            fill: polygonData,
            shadow: geoData,
            stroke: geoData
        };

        var paths = datagroups
            .selectAll<SVGPathElement, Feature>('path')
            .data(function(layer) { return pathData[layer]; }, featureKey);

        // exit
        paths.exit()
            .remove();

        // enter/update
        paths.enter()
            .append('path')
            .attr('class', function(d) {
                var datagroup = this.parentNode!.__data__;
                return 'pathdata ' + datagroup + ' ' + featureClasses(d);
            })
            .attr('clip-path', function(d) {
                var datagroup = this.parentNode!.__data__;
                return datagroup === 'fill' ? ('url(#' + clipPathID(d) + ')') : null;
            })
            .merge(paths)
            .attr('d', function(d) {
                var datagroup = this.parentNode!.__data__;
                return datagroup === 'fill' ? getAreaPath(d) : getPath(d);
            });


        // Draw labels
        layer
            .call(drawLabels, 'label-halo', geoData)
            .call(drawLabels, 'label', geoData);


        function drawLabels(selection: d3.Selection<SVGGElement>, textClass: string, data: Feature[]) {
            var labelPath = d3_geoPath(projection);
            var labelData = data.filter(function(d) {
                return _showLabels && d.properties && (d.properties.desc || d.properties.name);
            });

            var labels = selection.selectAll<SVGTextElement, Feature>('text.' + textClass)
                .data(labelData, featureKey);

            // exit
            labels.exit()
                .remove();

            // enter/update
            labels.enter()
                .append('text')
                .attr('class', function(d) { return textClass + ' ' + featureClasses(d); })
                .merge(labels)
                .text(function(d) {
                    return d.properties?.desc || d.properties?.name;
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


    function getExtension(fileName: string) {
        if (!fileName) return;

        var re = /\.(gpx|kml|(geo)?json|png)$/i;
        var match = fileName.toLowerCase().match(re);
        return (match && match.length && match[0]) || undefined;
    }


    function xmlToDom(textdata: string) {
        return (new DOMParser()).parseFromString(textdata, 'text/xml');
    }


    function stringifyGeojsonProperties(feature: Feature) {
        const properties = feature.properties;
        for (const key in properties) {
            const property = properties[key];
            if (typeof property === 'number' || typeof property === 'boolean' || Array.isArray(property)) {
                properties[key] = property.toString();
            } else if (property === null) {
                properties[key] = 'null';
            } else if (typeof property === 'object') {
                properties[key] = JSON.stringify(property);
            }
        }
    }


    drawData.setFile = function(extension: string | undefined, data: string) {
        _template = null;
        _fileList = null;
        _geojson = null;
        _src = null;

        var gj;
        switch (extension) {
            case '.gpx':
                gj = gpx(xmlToDom(data));
                break;
            case '.kml':
                gj = kml(xmlToDom(data));
                break;
            case '.geojson':
            case '.json':
                gj = JSON.parse(data);
                if (gj.type === 'FeatureCollection') {
                    gj.features.forEach(stringifyGeojsonProperties);
                } else if (gj.type === 'Feature') {
                    stringifyGeojsonProperties(gj);
                }
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


    drawData.showLabels = function(val: boolean) {
        if (!arguments.length) return _showLabels;

        _showLabels = val;
        return this;
    };


    drawData.enabled = function(val: boolean) {
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


    drawData.template = function(val: string, src?: string) {
        if (!arguments.length) return _template;

        // test source against OSM imagery blocklists..
        var osm = context.connection();
        if (osm) {
            for (const regex of osm.imageryBlocklists()) {
                if (regex.test(val)) {
                    // matches a blocked sources -> do not set template
                    return;
                };
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


    drawData.geojson = function(gj: FeatureCollection, src: string) {
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


    drawData.fileList = function(fileList: File[]) {
        if (!arguments.length) return _fileList;

        _template = null;
        _geojson = null;
        _src = null;
        _fileList = fileList;

        if (!fileList || !fileList.length) return this;
        var f = fileList[0];
        var extension = getExtension(f.name);
        var reader = new FileReader();
        reader.onload = (function() {
            return function(e) {
                drawData.setFile(extension, e.target!.result as string);
            };
        })();

        reader.readAsText(f);

        return this;
    };


    drawData.url = function(url: string, defaultExtension: string) {
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

            // @ts-expect-error -- geojson weakly types coordinates using Position not Vec2
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
