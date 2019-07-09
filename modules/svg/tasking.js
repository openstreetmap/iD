import _throttle from 'lodash-es/throttle';

import { t } from '../util/locale';
import { icon } from '../ui/intro/helper';
import { geoBounds as d3_geoBounds, geoPath as d3_geoPath } from 'd3-geo';
import { select as d3_select } from 'd3-selection';

import { geoExtent } from '../geo';
import { services } from '../services';
import { uiCurtain } from '../ui';
import { svgPath } from './helpers';
import { utilArrayFlatten, utilArrayUnion } from '../util';

var _initialized = false;
var _enabled = false;
var _geojson;

var _extent;
var _centroid;


export function svgTasking(projection, context, dispatch) {
    var throttledRedraw = _throttle(function () { dispatch.call('change'); }, 1000);
    var _showLabels = true;
    var _showCurtain = false;
    var _curtain = uiCurtain();
    var layer = d3_select(null);
    var _taskingService;


    function init() {
        if (_initialized) return;  // run once

        _geojson = {};
        _enabled = true;
        _initialized = true;
    }


    function getService() {
        if (services.tasking && !_taskingService) {
            _taskingService = services.tasking;
            _taskingService.event.on('loadedTask', function() {
                console.log('hello');
            });
            _taskingService.event.on('loadedTask', throttledRedraw);
        } else if (!services.tasking && _taskingService) {
            _taskingService = null;
        }

        return _taskingService;
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
        var hasData = drawTasking.hasData();

        layer = selection.selectAll('.layer-maptasking')
            .data(_enabled && hasData ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-maptasking')
            .merge(layer);

        var surface = context.surface();
        if (!surface || surface.empty()) return;  // not ready to draw yet, starting up


        // Gather data
        var geoData, polygonData;

        _geojson = getService().currTask();

        geoData = getFeatures(_geojson);

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


        // draw curtain around task
        if (geoData && geoData.length && drawTasking.enabled()) {
            drawTasking.showCurtain(true);
        } else {
            drawTasking.showCurtain(false);
            _curtain.remove();
        }

        if (drawTasking.showCurtain()) { drawCurtain(); }

        function revealTask(padding, text, options) {

            var left = context.projection(_extent[0])[0];
            var top = context.projection(_extent[0])[1];
            var right = context.projection(_extent[1])[0];
            var bottom = context.projection(_extent[1])[1];
            var box = {
            left: left - padding,
            top: top + padding,
            width: right - left + (2 * padding),
            height: bottom - top - (2 * padding)
            };

            _curtain.reveal(box, text, options);
        }

        function drawCurtain() {
            _curtain.remove();
            context.container().select('.layer-data').call(_curtain);

            var padding = 20;

            revealTask(
                padding,
                t('tasking.started_task.task_help',
                    {
                        taskId: '1',
                        taskingButton: icon('#iD-icon-tasking', 'pre-text'),
                        taskingKey: t('tasking.key'),
                        helpButton: icon('#iD-icon-help', 'pre-text'),
                        helpKey: t('help.key')
                    }
                ),
                {
                    tooltipClass: 'intro-points-describe',
                    duration: 500,
                    buttonText: t('tasking.started_task.stop_task'),
                    buttonCallback: function() { finishTasking('value'); }
                });

            function finishTasking(value) {
                console.log(value);
            }
        }


    }


    drawTasking.showLabels = function(val) {
        if (!arguments.length) return _showLabels;

        _showLabels = val;
        return this;
    };


    drawTasking.enabled = function(val) {
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


    drawTasking.hasData = function() {
        _geojson = getService().currTask();

        var gj = _geojson || {};
        return !!(Object.keys(gj).length);
    };


    drawTasking.fitZoom = function() {
        _geojson = getService().currTask();

        var features = getFeatures(_geojson);
        if (!features.length) return;

        var map = context.map();
        var viewport = map.trimmedExtent().polygon();
        var coords = features.reduce(function(coords, feature) {
            var c = feature.geometry.coordinates;

            /* eslint-disable no-fallthrough */
            switch (feature.geometry.type) {
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

        _extent = geoExtent(d3_geoBounds({ type: 'LineString', coordinates: coords }));
        _centroid = _extent.center();

        map.centerZoom(_centroid, map.trimmedExtentZoom(_extent) - 0.25); // TODO: TAH - better way to zoom out a bit

        // if (!geoPolygonIntersectsPolygon(viewport, coords, true)) {
        //     map.centerZoom(_centroid, map.trimmedExtentZoom(_extent));
        // }

        return this;
    };


    drawTasking.showCurtain = function(val) {
        if (!arguments.length) return _showCurtain;

        _showCurtain = val;
        return this;
    };


    init();
    return drawTasking;
}
