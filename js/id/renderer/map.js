iD.Map = function(context) {
    var dimensions = [1, 1],
        dispatch = d3.dispatch('move', 'drawn'),
        projection = context.projection,
        zoom = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale() * 2 * Math.PI)
            .scaleExtent([1024, 256 * Math.pow(2, 24)])
            .on('zoom', zoomPan),
        dblclickEnabled = true,
        redrawEnabled = true,
        transformStart,
        transformed = false,
        minzoom = 0,
        drawLayers = iD.svg.Layers(projection, context),
        drawPoints = iD.svg.Points(projection, context),
        drawVertices = iD.svg.Vertices(projection, context),
        drawLines = iD.svg.Lines(projection),
        drawAreas = iD.svg.Areas(projection),
        drawMidpoints = iD.svg.Midpoints(projection, context),
        drawLabels = iD.svg.Labels(projection, context),
        supersurface,
        wrapper,
        surface,
        mouse,
        mousemove;

    function map(selection) {
        context.history()
            .on('change.map', redraw);
        context.background()
            .on('change.map', redraw);
        context.features()
            .on('redraw.map', redraw);
        drawLayers
            .on('change.map', function() {
                context.background().updateImagery();
                redraw();
            });

        selection
            .on('dblclick.map', dblClick)
            .call(zoom);

        supersurface = selection.append('div')
            .attr('id', 'supersurface')
            .call(iD.util.setTransform, 0, 0);

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
            .on('mousedown.zoom', function() {
                if (d3.event.button === 2) {
                    d3.event.stopPropagation();
                }
            }, true)
            .on('mouseup.zoom', function() {
                if (resetTransform()) redraw();
            })
            .on('mousemove.map', function() {
                mousemove = d3.event;
            })
            .on('mouseover.vertices', function() {
                if (map.editable() && !transformed) {
                    var hover = d3.event.target.__data__;
                    surface.call(drawVertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                    dispatch.drawn({full: false});
                }
            })
            .on('mouseout.vertices', function() {
                if (map.editable() && !transformed) {
                    var hover = d3.event.relatedTarget && d3.event.relatedTarget.__data__;
                    surface.call(drawVertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                    dispatch.drawn({full: false});
                }
            });


        supersurface
            .call(context.background());


        context.on('enter.map', function() {
            if (map.editable() && !transformed) {
                var all = context.intersects(map.extent()),
                    filter = d3.functor(true),
                    graph = context.graph();

                all = context.features().filter(all, graph);
                surface
                    .call(drawVertices, graph, all, filter, map.extent(), map.zoom())
                    .call(drawMidpoints, graph, all, filter, map.trimmedExtent());
                dispatch.drawn({full: false});
            }
        });

        map.dimensions(selection.dimensions());

        drawLabels.supersurface(supersurface);
    }

    function pxCenter() { return [dimensions[0] / 2, dimensions[1] / 2]; }

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
                var set = d3.set(_.pluck(data, 'id'));
                filter = function(d) { return set.has(d.id); };

            } else {
                data = all;
                filter = d3.functor(true);
            }
        }

        data = features.filter(data, graph);

        surface
            .call(drawVertices, graph, data, filter, map.extent(), map.zoom())
            .call(drawLines, graph, data, filter)
            .call(drawAreas, graph, data, filter)
            .call(drawMidpoints, graph, data, filter, map.trimmedExtent())
            .call(drawLabels, graph, data, filter, dimensions, !difference && !extent)
            .call(drawPoints, graph, data, filter);

        dispatch.drawn({full: true});
    }

    function editOff() {
        context.features().resetStats();
        surface.selectAll('.layer-osm *').remove();
        dispatch.drawn({full: true});
    }

    function dblClick() {
        if (!dblclickEnabled) {
            d3.event.preventDefault();
            d3.event.stopImmediatePropagation();
        }
    }

    function zoomPan() {
        if (Math.log(d3.event.scale) / Math.LN2 - 8 < minzoom) {
            surface.interrupt();
            iD.ui.flash(context.container())
                .select('.content')
                .text(t('cannot_zoom'));
            setZoom(context.minEditableZoom(), true);
            queueRedraw();
            dispatch.move(map);
            return;
        }

        projection
            .translate(d3.event.translate)
            .scale(d3.event.scale / (2 * Math.PI));

        var scale = d3.event.scale / transformStart[0],
            tX = (d3.event.translate[0] / scale - transformStart[1][0]) * scale,
            tY = (d3.event.translate[1] / scale - transformStart[1][1]) * scale;

        transformed = true;
        iD.util.setTransform(supersurface, tX, tY, scale);
        queueRedraw();

        dispatch.move(map);
    }

    function resetTransform() {
        if (!transformed) return false;

        surface.selectAll('.radial-menu').interrupt().remove();
        iD.util.setTransform(supersurface, 0, 0);
        transformed = false;
        return true;
    }

    function redraw(difference, extent) {
        if (!surface || !redrawEnabled) return;

        clearTimeout(timeoutId);

        // If we are in the middle of a zoom/pan, we can't do differenced redraws.
        // It would result in artifacts where differenced entities are redrawn with
        // one transform and unchanged entities with another.
        if (resetTransform()) {
            difference = extent = undefined;
        }

        var zoom = String(~~map.zoom());
        if (surface.attr('data-zoom') !== zoom) {
            surface.attr('data-zoom', zoom)
                .classed('low-zoom', zoom <= 16);
        }

        if (!difference) {
            supersurface.call(context.background());
        }

        // OSM
        if (map.editable()) {
            context.loadTiles(projection, dimensions);
            drawVector(difference, extent);
        } else {
            editOff();
        }

        wrapper
            .call(drawLayers);

        transformStart = [
            projection.scale() * 2 * Math.PI,
            projection.translate().slice()];

        return map;
    }

    var timeoutId;
    function queueRedraw() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function() { redraw(); }, 300);
    }

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
        var e = mousemove || d3.event, s;
        while ((s = e.sourceEvent)) e = s;
        return mouse(e);
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

    function interpolateZoom(_) {
        var k = projection.scale(),
            t = projection.translate();

        surface.node().__chart__ = {
            x: t[0],
            y: t[1],
            k: k * 2 * Math.PI
        };

        setZoom(_);
        projection.scale(k).translate(t);  // undo setZoom projection changes

        zoom.event(surface.transition());
    }

    function setZoom(_, force) {
        if (_ === map.zoom() && !force)
            return false;
        var scale = 256 * Math.pow(2, _),
            center = pxCenter(),
            l = pointLocation(center);
        scale = Math.max(1024, Math.min(256 * Math.pow(2, 24), scale));
        projection.scale(scale / (2 * Math.PI));
        zoom.scale(scale);
        var t = projection.translate();
        l = locationPoint(l);
        t[0] += center[0] - l[0];
        t[1] += center[1] - l[1];
        projection.translate(t);
        zoom.translate(projection.translate());
        return true;
    }

    function setCenter(_) {
        var c = map.center();
        if (_[0] === c[0] && _[1] === c[1])
            return false;
        var t = projection.translate(),
            pxC = pxCenter(),
            ll = projection(_);
        projection.translate([
            t[0] - ll[0] + pxC[0],
            t[1] - ll[1] + pxC[1]]);
        zoom.translate(projection.translate());
        return true;
    }

    map.pan = function(d) {
        var t = projection.translate();
        t[0] += d[0];
        t[1] += d[1];
        projection.translate(t);
        zoom.translate(projection.translate());
        dispatch.move(map);
        return redraw();
    };

    map.dimensions = function(_) {
        if (!arguments.length) return dimensions;
        var center = map.center();
        dimensions = _;
        drawLayers.dimensions(dimensions);
        context.background().dimensions(dimensions);
        projection.clipExtent([[0, 0], dimensions]);
        mouse = iD.util.fastMouse(supersurface.node());
        setCenter(center);
        return redraw();
    };

    function zoomIn(integer) {
      interpolateZoom(~~map.zoom() + integer);
    }

    function zoomOut(integer) {
      interpolateZoom(~~map.zoom() - integer);
    }

    map.zoomIn = function() { zoomIn(1); };
    map.zoomInFurther = function() { zoomIn(4); };

    map.zoomOut = function() { zoomOut(1); };
    map.zoomOutFurther = function() { zoomOut(4); };

    map.center = function(loc) {
        if (!arguments.length) {
            return projection.invert(pxCenter());
        }

        if (setCenter(loc)) {
            dispatch.move(map);
        }

        return redraw();
    };

    map.zoom = function(z) {
        if (!arguments.length) {
            return Math.max(Math.log(projection.scale() * 2 * Math.PI) / Math.LN2 - 8, 0);
        }

        if (z < minzoom) {
            surface.interrupt();
            iD.ui.flash(context.container())
                .select('.content')
                .text(t('cannot_zoom'));
            z = context.minEditableZoom();
        }

        if (setZoom(z)) {
            dispatch.move(map);
        }

        return redraw();
    };

    map.zoomTo = function(entity, zoomLimits) {
        var extent = entity.extent(context.graph());
        if (!isFinite(extent.area())) return;

        var zoom = map.trimmedExtentZoom(extent);
        zoomLimits = zoomLimits || [context.minEditableZoom(), 20];
        map.centerZoom(extent.center(), Math.min(Math.max(zoom, zoomLimits[0]), zoomLimits[1]));
    };

    map.centerZoom = function(loc, z) {
        var centered = setCenter(loc),
            zoomed   = setZoom(z);

        if (centered || zoomed) {
            dispatch.move(map);
        }

        return redraw();
    };

    map.centerEase = function(loc) {
        var from = map.center().slice(),
            t = 0,
            stop;

        surface.one('mousedown.ease', function() {
            stop = true;
        });

        d3.timer(function() {
            if (stop) return true;
            map.center(iD.geo.interp(from, loc, (t += 1) / 10));
            return t === 10;
        }, 20);
        return map;
    };

    map.extent = function(_) {
        if (!arguments.length) {
            return new iD.geo.Extent(projection.invert([0, dimensions[1]]),
                                 projection.invert([dimensions[0], 0]));
        } else {
            var extent = iD.geo.Extent(_);
            map.centerZoom(extent.center(), map.extentZoom(extent));
        }
    };

    map.trimmedExtent = function(_) {
        if (!arguments.length) {
            var headerY = 60, footerY = 30, pad = 10;
            return new iD.geo.Extent(projection.invert([pad, dimensions[1] - footerY - pad]),
                    projection.invert([dimensions[0] - pad, headerY + pad]));
        } else {
            var extent = iD.geo.Extent(_);
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
        return calcZoom(iD.geo.Extent(_), dimensions);
    };

    map.trimmedExtentZoom = function(_) {
        var trimY = 120, trimX = 40,
            trimmed = [dimensions[0] - trimX, dimensions[1] - trimY];
        return calcZoom(iD.geo.Extent(_), trimmed);
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

    return d3.rebind(map, dispatch, 'on');
};
