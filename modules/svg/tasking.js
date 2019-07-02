import _throttle from 'lodash-es/throttle';
import { select as d3_select } from 'd3-selection';
import { geoBounds as d3_geoBounds } from 'd3-geo';

import stringify from 'fast-json-stable-stringify';

import { geoExtent, geoPolygonIntersectsPolygon } from '../geo';
import { uiCurtain } from '../ui/curtain';
import { utilArrayFlatten, utilArrayUnion, utilHashcode } from '../util';
import { svgPath } from './helpers';


var _enabled = false;
var _initialized = false;
var _project = {};
var _task = {};
var _curtain;
var _curtainEnabled = false;

export function svgTasking(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);

    var layer = d3_select(null);
    var _tasking;


    function init() {
        if (_initialized) return;  // run once

        _enabled = false;
        _initialized = true;
        _project = {};
        _task = {};

        _curtain = uiCurtain();
    }


    function getService() {
        if (context.tasking() && !_tasking) {
            _tasking = context.tasking();
            _tasking.event.on('loaded', throttledRedraw); // TODO: TAH - determine if there should be other handlers
        } else if (!context.tasking() && _tasking) {
            _tasking = null;
        }

        return _tasking;
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
        return 'data-' + d.__featurehash__ + '-clippath';
    }


    function featureClasses(d) {
        return [
            'data' + d.__featurehash__,
            d.geometry.type,
            isPolygon(d) ? 'area' : '',
            d.__layerID__ || ''
        ].filter(Boolean).join(' ');
    }


    function drawTasking(selection) {

        var getPath = svgPath(projection).geojson;
        var getAreaPath = svgPath(projection, null, true).geojson;

        var service = getService();

        _enabled = service.enabled();
        _project = service.currentProject();
        _task = ensureIDs(service.currentTask());

        layer = selection.selectAll('.layer-tasking')
            .data(_enabled && _project && _task ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-tasking')
            .merge(layer);

        var surface = context.surface();
        if (!surface || surface.empty()) return;  // not ready to draw yet, starting up


        // gather data
        var geoData, polygonData;
        geoData = getFeatures(_task);
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
                return 'pathdata ' + datagroup + ' ' + featureClasses(d) + ' ' + geoData[0].properties.taskStatus;
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

        // TODO: TAH - cleaner implementation to get box (probably defined elsewhere as well)
        function getBox(geoData) {
            var left;
            var top;
            var right;
            var bottom;

            var coords = geoData[0].geometry.coordinates[0][0];

            coords.map(function(coord) {
                if (coord[0] < left || left === undefined) { left = coord[0]; } // check for left
                if (coord[0] > right || right === undefined) { right = coord[0]; } // check for right
                if (coord[1] > top || top === undefined) { top = coord[1]; } // check for top
                if (coord[1] < bottom || bottom === undefined) { bottom = coord[1]; } // check for bottom
            });

            // NOTE: look at the pad helper function to get the box correct

            return {
                left: left,
                top: top,
                width: Math.abs(left - right),
                height: Math.abs(top - bottom)
            };
        }

        if (geoData && geoData.length && _curtainEnabled) {
            // set curtain around tasking area
            selection.call(_curtain);

            _curtain.reveal(getBox(geoData), 'sampleText', {});
        }
    }

    drawTasking.enabled = function(val) {
        if (!arguments.length) return _enabled;

        _enabled = val;
        if (_enabled) {
            showLayer();
            _curtainEnabled = true;
        } else {
            hideLayer();
            _curtainEnabled = false;
            _curtain.remove();
        }

        dispatch.call('change');
        return this;
    };


    drawTasking.supported = function() {
        return !!getService();
    };


    // TODO: TAH - call when task loaded
    drawTasking.fitZoom = function() {
        var features = getFeatures(_task);
        if (!features.length) return;

        var map = context.map();
        var viewport = map.trimmedExtent().polygon();
        var coords = features.reduce(function(coords, feature) {
            var c = feature.geometry.coordinates;
            c = utilArrayFlatten(c);

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
    return drawTasking;
}