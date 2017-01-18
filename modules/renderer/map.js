import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../util/locale';

import { utilRebind } from '../util/rebind';
import { utilBindOnce } from '../util/bind_once';
import { utilGetDimensions } from '../util/dimensions';

import {
    svgAreas,
    svgLabels,
    svgLayers,
    svgLines,
    svgMidpoints,
    svgPoints,
    svgVertices
} from '../svg/index';

import { geoExtent } from '../geo/index';
import { modeSelect } from '../modes/select';

import {
    utilFastMouse,
    utilSetTransform,
    utilFunctor
} from '../util/index';

import { uiFlash } from '../ui/index';


export function rendererMap(context) {

    var dimensions = [1, 1],
        dispatch = d3.dispatch('move', 'drawn'),
        projection = context.projection,
        dblclickEnabled = true,
        redrawEnabled = true,
        transformStart = projection.transform(),
        transformed = false,
        minzoom = 0,
        drawLayers = svgLayers(projection, context),
        drawPoints = svgPoints(projection, context),
        drawVertices = svgVertices(projection, context),
        drawLines = svgLines(projection),
        drawAreas = svgAreas(projection, context),
        drawMidpoints = svgMidpoints(projection, context),
        drawLabels = svgLabels(projection, context),
        supersurface = d3.select(null),
        wrapper = d3.select(null),
        surface = d3.select(null),
        mouse,
        mousemove;

    var zoom = d3.zoom()
            .scaleExtent([ztok(2), ztok(24)])
            .interpolate(d3.interpolate)
            .filter(zoomEventFilter)
            .on('zoom', zoomPan);

    var _selection = d3.select(null);


    function map(selection) {

        _selection = selection;

        context
            .on('change.map', immediateRedraw);

        context.connection()
            .on('change.map', immediateRedraw);

        context.history()
            .on('change.map', immediateRedraw)
            .on('undone.context redone.context', function(stack) {
                var followSelected = false;
                if (Array.isArray(stack.selectedIDs)) {
                    followSelected = (stack.selectedIDs.length === 1 && stack.selectedIDs[0][0] === 'n');
                    context.enter(
                        modeSelect(context, stack.selectedIDs).suppressMenu(true).follow(followSelected)
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
                if (d3.event.button === 2) {
                    d3.event.stopPropagation();
                }
            }, true)
            .on('mouseup.zoom', function() {
                if (resetTransform()) immediateRedraw();
            })
            .on('mousemove.map', function() {
                mousemove = d3.event;
            })
            .on('mouseover.vertices', function() {
                if (map.editable() && !transformed) {
                    var hover = d3.event.target.__data__;
                    surface.selectAll('.data-layer-osm')
                        .call(drawVertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                    dispatch.call('drawn', this, {full: false});
                }
            })
            .on('mouseout.vertices', function() {
                if (map.editable() && !transformed) {
                    var hover = d3.event.relatedTarget && d3.event.relatedTarget.__data__;
                    surface.selectAll('.data-layer-osm')
                        .call(drawVertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                    dispatch.call('drawn', this, {full: false});
                }
            });

        supersurface
            .call(context.background());

        context.on('enter.map', function() {
            if (map.editable() && !transformed) {
                var all = context.intersects(map.extent()),
                    filter = utilFunctor(true),
                    graph = context.graph();

                all = context.features().filter(all, graph);
                surface.selectAll('.data-layer-osm')
                    .call(drawVertices, graph, all, filter, map.extent(), map.zoom())
                    .call(drawMidpoints, graph, all, filter, map.trimmedExtent());
                dispatch.call('drawn', this, {full: false});
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
        if (d3.event.type === 'mousedown') {
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

        return d3.event.button !== 2;   // ignore right clicks
    }


    function ztok(z) {
        return 256 * Math.pow(2, z);
    }

    function ktoz(k) {
        return Math.max(Math.log(k) / Math.LN2 - 8, 0);
    }

    function pxCenter() {
        return [dimensions[0] / 2, dimensions[1] / 2];
    }


    function drawVector(difference, extent) {
        var graph = context.graph(),
            features = context.features(),
            all = context.intersects(map.extent()),
            data, filter;

        if (difference) {
            var complete = difference.complete(map.extent());
            data = _.compact(_.values(complete));
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
                var set = d3.set(_.map(data, 'id'));
                filter = function(d) { return set.has(d.id); };

            } else {
                data = all;
                filter = utilFunctor(true);
            }
        }

        data = features.filter(data, graph);

        surface.selectAll('.data-layer-osm')
            .call(drawVertices, graph, data, filter, map.extent(), map.zoom())
            .call(drawLines, graph, data, filter)
            .call(drawAreas, graph, data, filter)
            .call(drawMidpoints, graph, data, filter, map.trimmedExtent())
            .call(drawLabels, graph, data, filter, dimensions, !difference && !extent)
            .call(drawPoints, graph, data, filter);

        dispatch.call('drawn', this, {full: true});
    }


    function editOff() {
        context.features().resetStats();
        surface.selectAll('.layer-osm *').remove();
        dispatch.call('drawn', this, {full: true});
    }


    function dblClick() {
        if (!dblclickEnabled) {
            d3.event.preventDefault();
            d3.event.stopImmediatePropagation();
        }
    }


    function zoomPan(manualEvent) {
        var eventTransform = (manualEvent || d3.event).transform;

        if (transformStart.x === eventTransform.x &&
            transformStart.y === eventTransform.y &&
            transformStart.k === eventTransform.k) {
            return;  // no change
        }

        if (ktoz(eventTransform.k * 2 * Math.PI) < minzoom) {
            surface.interrupt();
            uiFlash(context.container())
                .select('.content')
                .text(t('cannot_zoom'));
            setZoom(context.minEditableZoom(), true);
            queueRedraw();
            dispatch.call('move', this, map);
            return;
        }

        projection.transform(eventTransform);

        var scale = eventTransform.k / transformStart.k,
            tX = (eventTransform.x / scale - transformStart.x) * scale,
            tY = (eventTransform.y / scale - transformStart.y) * scale;

        transformed = true;
        utilSetTransform(supersurface, tX, tY, scale);
        queueRedraw();

        dispatch.call('move', this, map);
    }


    function resetTransform() {
        if (!transformed) return false;

        surface.selectAll('.radial-menu').interrupt().remove();
        utilSetTransform(supersurface, 0, 0);
        transformed = false;
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


    var queueRedraw = _.throttle(redraw, 750);


    var immediateRedraw = function(difference, extent) {
        if (!difference && !extent) queueRedraw.cancel();
        redraw(difference, extent);
    };


    function pointLocation(p) {
        var translate = projection.translate(),
            scale = projection.scale() * 2 * Math.PI;
        return [(p[0] - translate[0]) / scale, (p[1] - translate[1]) / scale];
    }


    function locationPoint(l) {
        var translate = projection.translate(),
            scale = projection.scale() * 2 * Math.PI;
        return [l[0] * scale + translate[0], l[1] * scale + translate[1]];
    }


    map.mouse = function() {
        var event = mousemove || d3.event;
        if (event) {
            var s;
            while ((s = event.sourceEvent)) { event = s; }
            return mouse(event);
        }
        return null;
    };


    map.mouseCoordinates = function() {
        return projection.invert(map.mouse());
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
                .call(zoom.transform, d3.zoomIdentity.translate(t2.x, t2.y).scale(t2.k));
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

        var k = projection.scale(),
            k2 = Math.max(ztok(2), Math.min(ztok(24), ztok(z2))) / (2 * Math.PI),
            center = pxCenter(),
            l = pointLocation(center);

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
                .call(zoom.transform, d3.zoomIdentity.translate(t[0], t[1]).scale(k2));
        } else {
            projection.translate(t);
            transformStart = projection.transform();
            _selection.call(zoom.transform, transformStart);
        }

        return true;
    }


    function setCenter(loc2, duration) {
        var c = map.center();
        if (loc2[0] === c[0] && loc2[1] === c[1]) {
            return false;
        }

        var t = projection.translate(),
            k = projection.scale(),
            pxC = pxCenter(),
            ll = projection(loc2);

        t[0] = t[0] - ll[0] + pxC[0];
        t[1] = t[1] - ll[1] + pxC[1];

        if (duration) {
            _selection
                .transition()
                .duration(duration)
                .on('start', function() { map.startEase(); })
                .call(zoom.transform, d3.zoomIdentity.translate(t[0], t[1]).scale(k));
        } else {
            projection.translate(t);
            transformStart = projection.transform();
            _selection.call(zoom.transform, transformStart);
        }

        return true;
    }


    map.pan = function(delta, duration) {
        var t = projection.translate(),
            k = projection.scale();

        t[0] += delta[0];
        t[1] += delta[1];

        if (duration) {
            _selection
                .transition()
                .duration(duration)
                .on('start', function() { map.startEase(); })
                .call(zoom.transform, d3.zoomIdentity.translate(t[0], t[1]).scale(k));
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

        queueRedraw();
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

        queueRedraw();
        return map;
    };


    map.zoom = function(z2) {
        if (!arguments.length) {
            return Math.max(ktoz(projection.scale() * 2 * Math.PI), 0);
        }

        if (z2 < minzoom) {
            surface.interrupt();
            uiFlash(context.container())
                .select('.content')
                .text(t('cannot_zoom'));
            z2 = context.minEditableZoom();
        }

        if (setZoom(z2)) {
            dispatch.call('move', this, map);
        }

        queueRedraw();
        return map;
    };


    map.zoomTo = function(entity, zoomLimits) {
        var extent = entity.extent(context.graph());
        if (!isFinite(extent.area())) return;

        var z2 = map.trimmedExtentZoom(extent);
        zoomLimits = zoomLimits || [context.minEditableZoom(), 20];
        map.centerZoom(extent.center(), Math.min(Math.max(z2, zoomLimits[0]), zoomLimits[1]));
    };


    map.centerZoom = function(loc2, z2) {
        var centered = setCenter(loc2),
            zoomed   = setZoom(z2);

        if (centered || zoomed) {
            dispatch.call('move', this, map);
        }

        queueRedraw();
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
            return new geoExtent(projection.invert([0, dimensions[1]]),
                                 projection.invert([dimensions[0], 0]));
        } else {
            var extent = geoExtent(_);
            map.centerZoom(extent.center(), map.extentZoom(extent));
        }
    };


    map.trimmedExtent = function(_) {
        if (!arguments.length) {
            var headerY = 60, footerY = 30, pad = 10;
            return new geoExtent(projection.invert([pad, dimensions[1] - footerY - pad]),
                                 projection.invert([dimensions[0] - pad, headerY + pad]));
        } else {
            var extent = geoExtent(_);
            map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
        }
    };


    function calcZoom(extent, dim) {
        var tl = projection([extent[0][0], extent[1][1]]),
            br = projection([extent[1][0], extent[0][1]]);

        // Calculate maximum zoom that fits extent
        var hFactor = (br[0] - tl[0]) / dim[0],
            vFactor = (br[1] - tl[1]) / dim[1],
            hZoomDiff = Math.log(Math.abs(hFactor)) / Math.LN2,
            vZoomDiff = Math.log(Math.abs(vFactor)) / Math.LN2,
            newZoom = map.zoom() - Math.max(hZoomDiff, vZoomDiff);

        return newZoom;
    }


    map.extentZoom = function(_) {
        return calcZoom(geoExtent(_), dimensions);
    };


    map.trimmedExtentZoom = function(_) {
        var trimY = 120, trimX = 40,
            trimmed = [dimensions[0] - trimX, dimensions[1] - trimY];
        return calcZoom(geoExtent(_), trimmed);
    };


    map.editable = function() {
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
