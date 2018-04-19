import _compact from 'lodash-es/compact';
import _map from 'lodash-es/map';
import _throttle from 'lodash-es/throttle';
import _values from 'lodash-es/values';

import { set as d3_set } from 'd3-collection';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { interpolate as d3_interpolate } from 'd3-interpolate';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import {
    zoom as d3_zoom,
    zoomIdentity as d3_zoomIdentity
} from 'd3-zoom';

import { t } from '../util/locale';

import {
    geoExtent,
    geoScaleToZoom,
    geoZoomToScale
} from '../geo';

import {
    modeBrowse,
    modeSelect
} from '../modes';

import {
    svgAreas,
    svgLabels,
    svgLayers,
    svgLines,
    svgMidpoints,
    svgPoints,
    svgVertices
} from '../svg';

import { uiFlash } from '../ui';

import {
    utilFastMouse,
    utilFunctor,
    utilRebind,
    utilSetTransform
} from '../util';

import { utilBindOnce } from '../util/bind_once';
import { utilGetDimensions } from '../util/dimensions';


// constants
var TAU = 2 * Math.PI;
var TILESIZE = 256;
var kMin = geoZoomToScale(2, TILESIZE);
var kMax = geoZoomToScale(24, TILESIZE);


export function rendererMap(context) {
    var dispatch = d3_dispatch('move', 'drawn');
    var projection = context.projection;
    var curtainProjection = context.curtainProjection;
    var drawLayers = svgLayers(projection, context);
    var drawPoints = svgPoints(projection, context);
    var drawVertices = svgVertices(projection, context);
    var drawLines = svgLines(projection, context);
    var drawAreas = svgAreas(projection, context);
    var drawMidpoints = svgMidpoints(projection, context);
    var drawLabels = svgLabels(projection, context);

    var _selection = d3_select(null);
    var supersurface = d3_select(null);
    var wrapper = d3_select(null);
    var surface = d3_select(null);

    var dimensions = [1, 1];
    var dblclickEnabled = true;
    var redrawEnabled = true;
    var transformStart = projection.transform();
    var transformLast;
    var transformed = false;
    var minzoom = 0;
    var mouse;
    var mousemove;

    var zoom = d3_zoom()
        .scaleExtent([kMin, kMax])
        .interpolate(d3_interpolate)
        .filter(zoomEventFilter)
        .on('zoom', zoomPan);

    var scheduleRedraw = _throttle(redraw, 750);
    // var isRedrawScheduled = false;
    // var pendingRedrawCall;
    // function scheduleRedraw() {
    //     // Only schedule the redraw if one has not already been set.
    //     if (isRedrawScheduled) return;
    //     isRedrawScheduled = true;
    //     var that = this;
    //     var args = arguments;
    //     pendingRedrawCall = window.requestIdleCallback(function () {
    //         // Reset the boolean so future redraws can be set.
    //         isRedrawScheduled = false;
    //         redraw.apply(that, args);
    //     }, { timeout: 1400 });
    // }

    function cancelPendingRedraw() {
        scheduleRedraw.cancel();
        // isRedrawScheduled = false;
        // window.cancelIdleCallback(pendingRedrawCall);
    }


    function map(selection) {
        _selection = selection;

        context
            .on('change.map', immediateRedraw);

        var osm = context.connection();
        if (osm) {
            osm.on('change.map', immediateRedraw);
        }

        context.history()
            .on('change.map', immediateRedraw)
            .on('undone.map redone.map', function(stack) {
                var mode = context.mode().id;
                if (mode !== 'browse' && mode !== 'select') return;

                var followSelected = false;
                if (Array.isArray(stack.selectedIDs)) {
                    followSelected = (stack.selectedIDs.length === 1 && stack.selectedIDs[0][0] === 'n');
                    context.enter(
                        modeSelect(context, stack.selectedIDs).follow(followSelected)
                    );
                }
                if (!followSelected && stack.transform) {
                    map.transformEase(stack.transform);
                }
            });

        context.background()
            .on('change.map', immediateRedraw);

        context.features()
            .on('redraw.map', immediateRedraw);

        drawLayers
            .on('change.map', function() {
                context.background().updateImagery();
                immediateRedraw();
            });

        selection
            .on('dblclick.map', dblClick)
            .call(zoom)
            .call(zoom.transform, projection.transform());

        supersurface = selection.append('div')
            .attr('id', 'supersurface')
            .call(utilSetTransform, 0, 0);

        // Need a wrapper div because Opera can't cope with an absolutely positioned
        // SVG element: http://bl.ocks.org/jfirebaugh/6fbfbd922552bf776c16
        wrapper = supersurface
            .append('div')
            .attr('class', 'layer layer-data');

        map.surface = surface = wrapper
            .call(drawLayers)
            .selectAll('.surface')
            .attr('id', 'surface');

        surface
            .call(drawLabels.observe)
            .on('mousedown.zoom', function() {
                if (d3_event.button === 2) {
                    d3_event.stopPropagation();
                }
            }, true)
            .on('mouseup.zoom', function() {
                if (resetTransform()) immediateRedraw();
            })
            .on('mousemove.map', function() {
                mousemove = d3_event;
            })
            .on('mouseover.vertices', function() {
                if (map.editable() && !transformed) {
                    var hover = d3_event.target.__data__;
                    surface.selectAll('.data-layer-osm')
                        .call(drawVertices.drawHover, context.graph(), hover, map.extent());
                    dispatch.call('drawn', this, { full: false });
                }
            })
            .on('mouseout.vertices', function() {
                if (map.editable() && !transformed) {
                    var hover = d3_event.relatedTarget && d3_event.relatedTarget.__data__;
                    surface.selectAll('.data-layer-osm')
                        .call(drawVertices.drawHover, context.graph(), hover, map.extent());
                    dispatch.call('drawn', this, { full: false });
                }
            });

        supersurface
            .call(context.background());

        context.on('enter.map',  function() {
            if (map.editable() && !transformed) {

                // redraw immediately any objects affected by a change in selectedIDs.
                var graph = context.graph();
                var selectedAndParents = {};
                context.selectedIDs().forEach(function(id) {
                    var entity = graph.hasEntity(id);
                    if (entity) {
                        selectedAndParents[entity.id] = entity;
                        if (entity.type === 'node') {
                            graph.parentWays(entity).forEach(function(parent) {
                                selectedAndParents[parent.id] = parent;
                            });
                        }
                    }
                });
                var data = _values(selectedAndParents);
                var filter = function(d) { return d.id in selectedAndParents; };

                data = context.features().filter(data, graph);

                surface.selectAll('.data-layer-osm')
                    .call(drawVertices.drawSelected, graph, map.extent())
                    .call(drawLines, graph, data, filter)
                    .call(drawAreas, graph, data, filter)
                    .call(drawMidpoints, graph, data, filter, map.trimmedExtent());

                dispatch.call('drawn', this, { full: false });


                // redraw everything else later
                scheduleRedraw();
            }
        });

        map.dimensions(utilGetDimensions(selection));
    }


    function zoomEventFilter() {
        // Fix for #2151, (see also d3/d3-zoom#60, d3/d3-brush#18)
        // Intercept `mousedown` and check if there is an orphaned zoom gesture.
        // This can happen if a previous `mousedown` occurred without a `mouseup`.
        // If we detect this, dispatch `mouseup` to complete the orphaned gesture,
        // so that d3-zoom won't stop propagation of new `mousedown` events.
        if (d3_event.type === 'mousedown') {
            var hasOrphan = false;
            var listeners = window.__on;
            for (var i = 0; i < listeners.length; i++) {
                var listener = listeners[i];
                if (listener.name === 'zoom' && listener.type === 'mouseup') {
                    hasOrphan = true;
                    break;
                }
            }
            if (hasOrphan) {
                var event = window.CustomEvent;
                if (event) {
                    event = new event('mouseup');
                } else {
                    event = window.document.createEvent('Event');
                    event.initEvent('mouseup', false, false);
                }
                // Event needs to be dispatched with an event.view property.
                event.view = window;
                window.dispatchEvent(event);
            }
        }

        return d3_event.button !== 2;   // ignore right clicks
    }


    function pxCenter() {
        return [dimensions[0] / 2, dimensions[1] / 2];
    }


    function drawVector(difference, extent) {
        var mode = context.mode();
        var graph = context.graph();
        var features = context.features();
        var all = context.intersects(map.extent());
        var fullRedraw = false;
        var data;
        var filter;

        if (difference) {
            var complete = difference.complete(map.extent());
            data = _compact(_values(complete));
            filter = function(d) { return d.id in complete; };
            features.clear(data);

        } else {
            // force a full redraw if gatherStats detects that a feature
            // should be auto-hidden (e.g. points or buildings)..
            if (features.gatherStats(all, graph, dimensions)) {
                extent = undefined;
            }

            if (extent) {
                data = context.intersects(map.extent().intersection(extent));
                var set = d3_set(_map(data, 'id'));
                filter = function(d) { return set.has(d.id); };

            } else {
                data = all;
                fullRedraw = true;
                filter = utilFunctor(true);
            }
        }

        data = features.filter(data, graph);

        if (mode && mode.id === 'select') {
            // update selected vertices - the user might have just double-clicked a way,
            // creating a new vertex, triggering a partial redraw without a mode change
            surface.selectAll('.data-layer-osm')
                .call(drawVertices.drawSelected, graph, map.extent());
        }

        surface.selectAll('.data-layer-osm')
            .call(drawVertices, graph, data, filter, map.extent(), fullRedraw)
            .call(drawLines, graph, data, filter)
            .call(drawAreas, graph, data, filter)
            .call(drawMidpoints, graph, data, filter, map.trimmedExtent())
            .call(drawLabels, graph, data, filter, dimensions, fullRedraw)
            .call(drawPoints, graph, data, filter);

        dispatch.call('drawn', this, {full: true});
    }


    function editOff() {
        context.features().resetStats();
        surface.selectAll('.layer-osm *').remove();

        var mode = context.mode();
        if (mode && mode.id !== 'save') {
            context.enter(modeBrowse(context));
        }

        dispatch.call('drawn', this, {full: true});
    }


    function dblClick() {
        if (!dblclickEnabled) {
            d3_event.preventDefault();
            d3_event.stopImmediatePropagation();
        }
    }


    function zoomPan(manualEvent) {
        var event = (manualEvent || d3_event);
        var source = event.sourceEvent;
        var eventTransform = event.transform;

        if (transformStart.x === eventTransform.x &&
            transformStart.y === eventTransform.y &&
            transformStart.k === eventTransform.k) {
            return;  // no change
        }

        // Normalize mousewheel - #3029
        // If wheel delta is provided in LINE units, recalculate it in PIXEL units
        // We are essentially redoing the calculations that occur here:
        //   https://github.com/d3/d3-zoom/blob/78563a8348aa4133b07cac92e2595c2227ca7cd7/src/zoom.js#L203
        // See this for more info:
        //   https://github.com/basilfx/normalize-wheel/blob/master/src/normalizeWheel.js
        if (source && source.type === 'wheel' && source.deltaMode === 1 /* LINE */) {
            // pick sensible scroll amount if user scrolling fast or slow..
            var lines = Math.abs(source.deltaY);
            var scroll = lines > 2 ? 40 : lines * 10;

            var t0 = transformed ? transformLast : transformStart;
            var p0 = mouse(source);
            var p1 = t0.invert(p0);
            var k2 = t0.k * Math.pow(2, -source.deltaY * scroll / 500);
            var x2 = p0[0] - p1[0] * k2;
            var y2 = p0[1] - p1[1] * k2;

            eventTransform = d3_zoomIdentity.translate(x2,y2).scale(k2);
            _selection.node().__zoom = eventTransform;
        }

        if (geoScaleToZoom(eventTransform.k, TILESIZE) < minzoom) {
            surface.interrupt();
            uiFlash().text(t('cannot_zoom'))();
            setZoom(context.minEditableZoom(), true);
            scheduleRedraw();
            dispatch.call('move', this, map);
            return;
        }

        projection.transform(eventTransform);

        var scale = eventTransform.k / transformStart.k;
        var tX = (eventTransform.x / scale - transformStart.x) * scale;
        var tY = (eventTransform.y / scale - transformStart.y) * scale;

        if (context.inIntro()) {
            curtainProjection.transform({
                x: eventTransform.x - tX,
                y: eventTransform.y - tY,
                k: eventTransform.k
            });
        }

        if (source) mousemove = event;
        transformed = true;
        transformLast = eventTransform;
        utilSetTransform(supersurface, tX, tY, scale);
        scheduleRedraw();

        dispatch.call('move', this, map);
    }


    function resetTransform() {
        if (!transformed) return false;

        // deprecation warning - Radial Menu to be removed in iD v3
        surface.selectAll('.edit-menu, .radial-menu').interrupt().remove();
        utilSetTransform(supersurface, 0, 0);
        transformed = false;
        if (context.inIntro()) {
            curtainProjection.transform(projection.transform());
        }
        return true;
    }


    function redraw(difference, extent) {
        if (surface.empty() || !redrawEnabled) return;

        // If we are in the middle of a zoom/pan, we can't do differenced redraws.
        // It would result in artifacts where differenced entities are redrawn with
        // one transform and unchanged entities with another.
        if (resetTransform()) {
            difference = extent = undefined;
        }

        var z = String(~~map.zoom());
        if (surface.attr('data-zoom') !== z) {
            surface.attr('data-zoom', z)
                .classed('low-zoom', z <= 16);
        }

        if (!difference) {
            supersurface.call(context.background());
        }

        wrapper
            .call(drawLayers);

        // OSM
        if (map.editable()) {
            context.loadTiles(projection, dimensions);
            drawVector(difference, extent);
        } else {
            editOff();
        }

        transformStart = projection.transform();

        return map;
    }



    var immediateRedraw = function(difference, extent) {
        if (!difference && !extent) cancelPendingRedraw();
        redraw(difference, extent);
    };


    map.mouse = function() {
        var event = mousemove || d3_event;
        if (event) {
            var s;
            while ((s = event.sourceEvent)) { event = s; }
            return mouse(event);
        }
        return null;
    };


    // returns Lng/Lat
    map.mouseCoordinates = function() {
        var coord = map.mouse() || pxCenter();
        return projection.invert(coord);
    };


    map.dblclickEnable = function(_) {
        if (!arguments.length) return dblclickEnabled;
        dblclickEnabled = _;
        return map;
    };


    map.redrawEnable = function(_) {
        if (!arguments.length) return redrawEnabled;
        redrawEnabled = _;
        return map;
    };


    function setTransform(t2, duration, force) {
        var t = projection.transform();
        if (!force && t2.k === t.k && t2.x === t.x && t2.y === t.y) {
            return false;
        }

        if (duration) {
            _selection
                .transition()
                .duration(duration)
                .on('start', function() { map.startEase(); })
                .call(zoom.transform, d3_zoomIdentity.translate(t2.x, t2.y).scale(t2.k));
        } else {
            projection.transform(t2);
            transformStart = t2;
            _selection.call(zoom.transform, transformStart);
        }
    }


    function setZoom(z2, force, duration) {
        if (z2 === map.zoom() && !force) {
            return false;
        }

        var k = projection.scale();
        var k2 = Math.max(kMin, Math.min(kMax, geoZoomToScale(z2, TILESIZE)));
        var center = pxCenter();
        var l = pointLocation(center);

        projection.scale(k2);

        var t = projection.translate();
        l = locationPoint(l);

        t[0] += center[0] - l[0];
        t[1] += center[1] - l[1];

        if (duration) {
            projection.scale(k);  // reset scale
            _selection
                .transition()
                .duration(duration)
                .on('start', function() { map.startEase(); })
                .call(zoom.transform, d3_zoomIdentity.translate(t[0], t[1]).scale(k2));
        } else {
            projection.translate(t);
            transformStart = projection.transform();
            _selection.call(zoom.transform, transformStart);
        }

        return true;


        function locationPoint(l) {
            var translate = projection.translate();
            var scale = projection.scale() * TAU;
            return [l[0] * scale + translate[0], l[1] * scale + translate[1]];
        }

        function pointLocation(p) {
            var translate = projection.translate();
            var scale = projection.scale() * TAU;
            return [(p[0] - translate[0]) / scale, (p[1] - translate[1]) / scale];
        }
    }


    function setCenter(loc2, duration) {
        var c = map.center();
        if (loc2[0] === c[0] && loc2[1] === c[1]) {
            return false;
        }

        var t = projection.translate();
        var k = projection.scale();
        var pxC = pxCenter();
        var ll = projection(loc2);

        t[0] = t[0] - ll[0] + pxC[0];
        t[1] = t[1] - ll[1] + pxC[1];

        if (duration) {
            _selection
                .transition()
                .duration(duration)
                .on('start', function() { map.startEase(); })
                .call(zoom.transform, d3_zoomIdentity.translate(t[0], t[1]).scale(k));
        } else {
            projection.translate(t);
            transformStart = projection.transform();
            _selection.call(zoom.transform, transformStart);
        }

        return true;
    }


    map.pan = function(delta, duration) {
        var t = projection.translate();
        var k = projection.scale();

        t[0] += delta[0];
        t[1] += delta[1];

        if (duration) {
            _selection
                .transition()
                .duration(duration)
                .on('start', function() { map.startEase(); })
                .call(zoom.transform, d3_zoomIdentity.translate(t[0], t[1]).scale(k));
        } else {
            projection.translate(t);
            transformStart = projection.transform();
            _selection.call(zoom.transform, transformStart);
            dispatch.call('move', this, map);
            immediateRedraw();
        }

        return map;
    };


    map.dimensions = function(_) {
        if (!arguments.length) return dimensions;
        var center = map.center();
        dimensions = _;
        drawLayers.dimensions(dimensions);
        context.background().dimensions(dimensions);
        projection.clipExtent([[0, 0], dimensions]);
        mouse = utilFastMouse(supersurface.node());
        setCenter(center);

        scheduleRedraw();
        return map;
    };


    function zoomIn(delta) {
        setZoom(~~map.zoom() + delta, true, 250);
    }

    function zoomOut(delta) {
        setZoom(~~map.zoom() - delta, true, 250);
    }

    map.zoomIn = function() { zoomIn(1); };
    map.zoomInFurther = function() { zoomIn(4); };

    map.zoomOut = function() { zoomOut(1); };
    map.zoomOutFurther = function() { zoomOut(4); };


    map.center = function(loc2) {
        if (!arguments.length) {
            return projection.invert(pxCenter());
        }

        if (setCenter(loc2)) {
            dispatch.call('move', this, map);
        }

        scheduleRedraw();
        return map;
    };


    map.zoom = function(z2) {
        if (!arguments.length) {
            return Math.max(geoScaleToZoom(projection.scale(), TILESIZE), 0);
        }

        if (z2 < minzoom) {
            surface.interrupt();
            uiFlash().text(t('cannot_zoom'))();
            z2 = context.minEditableZoom();
        }

        if (setZoom(z2)) {
            dispatch.call('move', this, map);
        }

        scheduleRedraw();
        return map;
    };


    map.zoomTo = function(entity, zoomLimits) {
        var extent = entity.extent(context.graph());
        if (!isFinite(extent.area())) return;

        var z2 = map.trimmedExtentZoom(extent);
        zoomLimits = zoomLimits || [context.minEditableZoom(), 24];
        map.centerZoom(extent.center(), Math.min(Math.max(z2, zoomLimits[0]), zoomLimits[1]));
    };


    map.centerZoom = function(loc2, z2) {
        var centered = setCenter(loc2);
        var zoomed   = setZoom(z2);

        if (centered || zoomed) {
            dispatch.call('move', this, map);
        }

        scheduleRedraw();
        return map;
    };


    map.centerEase = function(loc2, duration) {
        duration = duration || 250;
        setCenter(loc2, duration);
        return map;
    };


    map.zoomEase = function(z2, duration) {
        duration = duration || 250;
        setZoom(z2, false, duration);
        return map;
    };


    map.transformEase = function(t2, duration) {
        duration = duration || 250;
        setTransform(t2, duration, false);
        return map;
    };


    map.startEase = function() {
        utilBindOnce(surface, 'mousedown.ease', function() {
            map.cancelEase();
        });
        return map;
    };


    map.cancelEase = function() {
        _selection.interrupt();
        return map;
    };


    map.extent = function(_) {
        if (!arguments.length) {
            return new geoExtent(
                projection.invert([0, dimensions[1]]),
                projection.invert([dimensions[0], 0])
            );
        } else {
            var extent = geoExtent(_);
            map.centerZoom(extent.center(), map.extentZoom(extent));
        }
    };


    map.trimmedExtent = function(_) {
        if (!arguments.length) {
            var headerY = 60;
            var footerY = 30;
            var pad = 10;
            return new geoExtent(
                projection.invert([pad, dimensions[1] - footerY - pad]),
                projection.invert([dimensions[0] - pad, headerY + pad])
            );
        } else {
            var extent = geoExtent(_);
            map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
        }
    };


    function calcZoom(extent, dim) {
        var tl = projection([extent[0][0], extent[1][1]]);
        var br = projection([extent[1][0], extent[0][1]]);

        // Calculate maximum zoom that fits extent
        var hFactor = (br[0] - tl[0]) / dim[0];
        var vFactor = (br[1] - tl[1]) / dim[1];
        var hZoomDiff = Math.log(Math.abs(hFactor)) / Math.LN2;
        var vZoomDiff = Math.log(Math.abs(vFactor)) / Math.LN2;
        var newZoom = map.zoom() - Math.max(hZoomDiff, vZoomDiff);

        return newZoom;
    }


    map.extentZoom = function(_) {
        return calcZoom(geoExtent(_), dimensions);
    };


    map.trimmedExtentZoom = function(_) {
        var trimY = 120;
        var trimX = 40;
        var trimmed = [dimensions[0] - trimX, dimensions[1] - trimY];
        return calcZoom(geoExtent(_), trimmed);
    };


    map.editable = function() {
        var osmLayer = surface.selectAll('.data-layer-osm');
        if (!osmLayer.empty() && osmLayer.classed('disabled')) return false;

        return map.zoom() >= context.minEditableZoom();
    };


    map.minzoom = function(_) {
        if (!arguments.length) return minzoom;
        minzoom = _;
        return map;
    };


    map.layers = drawLayers;


    return utilRebind(map, dispatch, 'on');
}
