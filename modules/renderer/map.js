import _compact from 'lodash-es/compact';
import _map from 'lodash-es/map';
import _throttle from 'lodash-es/throttle';
import _values from 'lodash-es/values';

import { set as d3_set } from 'd3-collection';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { interpolate as d3_interpolate } from 'd3-interpolate';
import { scaleLinear as d3_scaleLinear } from 'd3-scale';

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
import { utilDetect } from '../util/detect';
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
    var _dblClickEnabled = true;
    var _redrawEnabled = true;
    var _gestureTransformStart;
    var _transformStart = projection.transform();
    var _transformLast;
    var _transformed = false;
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
            .on('gesturestart.surface', function() {
                _gestureTransformStart = projection.transform();
            })
            .on('gesturechange.surface', gestureChange)
            .on('mousedown.zoom', function() {
                if (d3_event.button === 2) {
                    d3_event.stopPropagation();
                }
            }, true)
            .on('mouseup.zoom', function() {
                if (resetTransform()) {
                    immediateRedraw();
                }
            })
            .on('mousemove.map', function() {
                mousemove = d3_event;
            })
            .on('mouseover.vertices', function() {
                if (map.editable() && !_transformed) {
                    var hover = d3_event.target.__data__;
                    surface.call(drawVertices.drawHover, context.graph(), hover, map.extent());
                    dispatch.call('drawn', this, { full: false });
                }
            })
            .on('mouseout.vertices', function() {
                if (map.editable() && !_transformed) {
                    var hover = d3_event.relatedTarget && d3_event.relatedTarget.__data__;
                    surface.call(drawVertices.drawHover, context.graph(), hover, map.extent());
                    dispatch.call('drawn', this, { full: false });
                }
            });

        supersurface
            .call(context.background());

        context.on('enter.map',  function() {
            if (map.editable() && !_transformed) {
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

                surface
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
            surface.call(drawVertices.drawSelected, graph, map.extent());
        }

        surface
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
        surface.selectAll('.layer-touch:not(.markers) *').remove();

        var mode = context.mode();
        if (mode && mode.id !== 'save' && mode.id !== 'select-note' &&
            mode.id !== 'select-data' && mode.id !== 'select-error') {
            context.enter(modeBrowse(context));
        }

        dispatch.call('drawn', this, {full: true});
    }


    function dblClick() {
        if (!_dblClickEnabled) {
            d3_event.preventDefault();
            d3_event.stopImmediatePropagation();
        }
    }


    function gestureChange() {
        // Remap Safari gesture events to wheel events - #5492
        // We want these disabled most places, but enabled for zoom/unzoom on map surface
        // https://developer.mozilla.org/en-US/docs/Web/API/GestureEvent
        var e = d3_event;
        e.preventDefault();

        var props = {
            deltaMode: 0,    // dummy values to ignore in zoomPan
            deltaY: 1,       // dummy values to ignore in zoomPan
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY,
            x: e.x,
            y: e.y
        };

        var e2 = new WheelEvent('wheel', props);
        e2._scale = e.scale;         // preserve the original scale
        e2._rotation = e.rotation;   // preserve the original rotation

        _selection.node().dispatchEvent(e2);
    }


    function zoomPan(manualEvent) {
        var event = (manualEvent || d3_event);
        var source = event.sourceEvent;
        var eventTransform = event.transform;
        var x = eventTransform.x;
        var y = eventTransform.y;
        var k = eventTransform.k;

        if (_transformStart.x === x &&
            _transformStart.y === y &&
            _transformStart.k === k) {
            return;  // no change
        }

        // Special handling of 'wheel' events:
        // They might be triggered by the user scrolling the mouse wheel,
        // or 2-finger pinch/zoom gestures, the transform may need adjustment.
        if (source && source.type === 'wheel') {
            var detected = utilDetect();
            var dX = source.deltaX;
            var dY = source.deltaY;
            var x2 = x;
            var y2 = y;
            var k2 = k;
            var t0, p0, p1;

            // Normalize mousewheel scroll speed (Firefox) - #3029
            // If wheel delta is provided in LINE units, recalculate it in PIXEL units
            // We are essentially redoing the calculations that occur here:
            //   https://github.com/d3/d3-zoom/blob/78563a8348aa4133b07cac92e2595c2227ca7cd7/src/zoom.js#L203
            // See this for more info:
            //   https://github.com/basilfx/normalize-wheel/blob/master/src/normalizeWheel.js
            if (source.deltaMode === 1 /* LINE */) {
                // Convert from lines to pixels, more if the user is scrolling fast.
                // (I made up the exp function to roughly match Firefox to what Chrome does)
                // These numbers should be floats, because integers are treated as pan gesture below.
                var lines = Math.abs(source.deltaY);
                var sign = (source.deltaY > 0) ? 1 : -1;
                dY = sign * clamp(
                    Math.exp((lines - 1) * 0.75) * 4.000244140625,
                    4.000244140625,    // min
                    350.000244140625   // max
                );

                // On Firefox Windows and Linux we always get +/- the scroll line amount (default 3)
                // There doesn't seem to be any scroll accelleration.
                // This multiplier increases the speed a little bit - #5512
                if (detected.os !== 'mac') {
                    dY *= 5;
                }

                // recalculate x2,y2,k2
                t0 = _transformed ? _transformLast : _transformStart;
                p0 = mouse(source);
                p1 = t0.invert(p0);
                k2 = t0.k * Math.pow(2, -dY / 500);
                x2 = p0[0] - p1[0] * k2;
                y2 = p0[1] - p1[1] * k2;

            // 2 finger map pinch zooming (Safari) - #5492
            // These are fake `wheel` events we made from Safari `gesturechange` events..
            } else if (source._scale) {
                // recalculate x2,y2,k2
                t0 = _gestureTransformStart;
                p0 = mouse(source);
                p1 = t0.invert(p0);
                k2 = t0.k * source._scale;
                x2 = p0[0] - p1[0] * k2;
                y2 = p0[1] - p1[1] * k2;

            // 2 finger map pinch zooming (all browsers except Safari) - #5492
            // Pinch zooming via the `wheel` event will always have:
            // - `ctrlKey = true`
            // - `deltaY` is not round integer pixels (ignore `deltaX`)
            } else if (source.ctrlKey && !isInteger(dY)) {
                dY *= 6;   // slightly scale up whatever the browser gave us

                // recalculate x2,y2,k2
                t0 = _transformed ? _transformLast : _transformStart;
                p0 = mouse(source);
                p1 = t0.invert(p0);
                k2 = t0.k * Math.pow(2, -dY / 500);
                x2 = p0[0] - p1[0] * k2;
                y2 = p0[1] - p1[1] * k2;

            // Trackpad scroll zooming with shift or alt/option key down
            } else if ((source.altKey || source.shiftKey) && isInteger(dY)) {

                // recalculate x2,y2,k2
                t0 = _transformed ? _transformLast : _transformStart;
                p0 = mouse(source);
                p1 = t0.invert(p0);
                k2 = t0.k * Math.pow(2, -dY / 500);
                x2 = p0[0] - p1[0] * k2;
                y2 = p0[1] - p1[1] * k2;

            // 2 finger map panning (Mac only, all browsers) - #5492, #5512
            // Panning via the `wheel` event will always have:
            // - `ctrlKey = false`
            // - `deltaX`,`deltaY` are round integer pixels
            } else if (detected.os === 'mac' && !source.ctrlKey && isInteger(dX) && isInteger(dY)) {
                // Firefox will set `mozInputSource = 1` if the event was generated
                // by an actual mouse wheel.  If we detect this, don't pan..
                if (source.mozInputSource === undefined || source.mozInputSource !== 1) {
                    p1 = projection.translate();
                    x2 = p1[0] - dX;
                    y2 = p1[1] - dY;
                    k2 = projection.scale();
                }
            }

            // something changed - replace the event transform
            if (x2 !== x || y2 !== y || k2 !== k) {
                x = x2;
                y = y2;
                k = k2;
                eventTransform = d3_zoomIdentity.translate(x2, y2).scale(k2);
                _selection.node().__zoom = eventTransform;
            }

        }

        if (geoScaleToZoom(k, TILESIZE) < minzoom) {
            surface.interrupt();
            uiFlash().text(t('cannot_zoom'))();
            setZoom(context.minEditableZoom(), true);
            scheduleRedraw();
            dispatch.call('move', this, map);
            return;
        }

        projection.transform(eventTransform);

        var scale = k / _transformStart.k;
        var tX = (x / scale - _transformStart.x) * scale;
        var tY = (y / scale - _transformStart.y) * scale;

        if (context.inIntro()) {
            curtainProjection.transform({
                x: x - tX,
                y: y - tY,
                k: k
            });
        }

        if (source) mousemove = event;
        _transformed = true;
        _transformLast = eventTransform;
        utilSetTransform(supersurface, tX, tY, scale);
        scheduleRedraw();

        dispatch.call('move', this, map);


        function clamp(num, min, max) {
            return Math.max(min, Math.min(num, max));
        }

        function isInteger(val) {
            return typeof val === 'number' && isFinite(val) && Math.floor(val) === val;
        }
    }


    function resetTransform() {
        if (!_transformed) return false;

        // deprecation warning - Radial Menu to be removed in iD v3
        surface.selectAll('.edit-menu, .radial-menu').interrupt().remove();
        utilSetTransform(supersurface, 0, 0);
        _transformed = false;
        if (context.inIntro()) {
            curtainProjection.transform(projection.transform());
        }
        return true;
    }


    function redraw(difference, extent) {
        if (surface.empty() || !_redrawEnabled) return;

        // If we are in the middle of a zoom/pan, we can't do differenced redraws.
        // It would result in artifacts where differenced entities are redrawn with
        // one transform and unchanged entities with another.
        if (resetTransform()) {
            difference = extent = undefined;
        }

        var zoom = map.zoom();
        var z = String(~~zoom);

        if (surface.attr('data-zoom') !== z) {
            surface.attr('data-zoom', z);
        }

        // class surface as `lowzoom` around z17-z18.5 (based on latitude)
        var lat = map.center()[1];
        var lowzoom = d3_scaleLinear()
            .domain([-60, 0, 60])
            .range([17, 18.5, 17])
            .clamp(true);

        surface
            .classed('low-zoom', zoom <= lowzoom(lat));


        if (!difference) {
            supersurface.call(context.background());
        }

        wrapper
            .call(drawLayers);

        // OSM
        if (map.editable()) {
            context.loadTiles(projection);
            drawVector(difference, extent);
        } else {
            editOff();
        }

        _transformStart = projection.transform();

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
        if (!arguments.length) return _dblClickEnabled;
        _dblClickEnabled = _;
        return map;
    };


    map.redrawEnable = function(_) {
        if (!arguments.length) return _redrawEnabled;
        _redrawEnabled = _;
        return map;
    };


    map.isTransformed = function() {
        return _transformed;
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
            _transformStart = t2;
            _selection.call(zoom.transform, _transformStart);
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
            _transformStart = projection.transform();
            _selection.call(zoom.transform, _transformStart);
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
            _transformStart = projection.transform();
            _selection.call(zoom.transform, _transformStart);
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
            _transformStart = projection.transform();
            _selection.call(zoom.transform, _transformStart);
            dispatch.call('move', this, map);
            immediateRedraw();
        }

        return map;
    };


    map.dimensions = function(_) {
        if (!arguments.length) return dimensions;
        dimensions = _;
        drawLayers.dimensions(dimensions);
        context.background().dimensions(dimensions);
        projection.clipExtent([[0, 0], dimensions]);
        mouse = utilFastMouse(supersurface.node());

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
        zoomLimits = zoomLimits || [context.minEditableZoom(), 19];
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
        var osmLayer = surface.selectAll('.data-layer.osm');
        if (!osmLayer.empty() && osmLayer.classed('disabled')) return false;

        return map.zoom() >= context.minEditableZoom();
    };


    map.notesEditable = function() {
        var noteLayer = surface.selectAll('.data-layer.notes');
        if (!noteLayer.empty() && noteLayer.classed('disabled')) return false;

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
