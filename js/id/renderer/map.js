iD.Map = function(context) {
    var dimensions = [1, 1],
        dispatch = d3.dispatch('move', 'drawn'),
        projection = context.projection,
        roundedProjection = iD.svg.RoundProjection(projection),
        zoom = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale() * 2 * Math.PI)
            .scaleExtent([1024, 256 * Math.pow(2, 24)])
            .on('zoom', zoomPan),
        dblclickEnabled = true,
        transformStart,
        transformed = false,
        minzoom = 0,
        transformProp = iD.util.prefixCSSProperty('Transform'),
        points = iD.svg.Points(roundedProjection, context),
        vertices = iD.svg.Vertices(roundedProjection, context),
        lines = iD.svg.Lines(projection),
        areas = iD.svg.Areas(roundedProjection),
        midpoints = iD.svg.Midpoints(roundedProjection, context),
        labels = iD.svg.Labels(roundedProjection, context),
        supersurface, surface,
        mouse;

    function map(selection) {
        context.history()
            .on('change.map', redraw);
        context.background()
            .on('change.map', redraw);

        selection.call(zoom);

        supersurface = selection.append('div')
            .attr('id', 'supersurface');

        supersurface.call(context.background());

        // Need a wrapper div because Opera can't cope with an absolutely positioned
        // SVG element: http://bl.ocks.org/jfirebaugh/6fbfbd922552bf776c16
        var dataLayer = supersurface.append('div')
            .attr('class', 'layer-layer layer-data');

        map.surface = surface = dataLayer.append('svg')
            .on('mousedown.zoom', function() {
                if (d3.event.button == 2) {
                    d3.event.stopPropagation();
                }
            }, true)
            .on('mouseup.zoom', function() {
                if (resetTransform()) redraw();
            })
            .attr('id', 'surface')
            .call(iD.svg.Surface(context));

        surface.on('mouseover.vertices', function() {
            if (map.editable() && !transformed) {
                var hover = d3.event.target.__data__;
                surface.call(vertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                dispatch.drawn({full: false});
            }
        });

        surface.on('mouseout.vertices', function() {
            if (map.editable() && !transformed) {
                var hover = d3.event.relatedTarget && d3.event.relatedTarget.__data__;
                surface.call(vertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                dispatch.drawn({full: false});
            }
        });

        context.on('enter.map', function() {
            if (map.editable() && !transformed) {
                var all = context.intersects(map.extent()),
                    filter = d3.functor(true),
                    extent = map.extent(),
                    graph = context.graph();
                surface.call(vertices, graph, all, filter, extent, map.zoom());
                surface.call(midpoints, graph, all, filter, extent);
                dispatch.drawn({full: false});
            }
        });

        map.dimensions(selection.dimensions());

        labels.supersurface(supersurface);
    }

    function pxCenter() { return [dimensions[0] / 2, dimensions[1] / 2]; }

    function drawVector(difference, extent) {
        var filter, all,
            graph = context.graph();

        if (difference) {
            var complete = difference.complete(map.extent());
            all = _.compact(_.values(complete));
            filter = function(d) {
                if (d.type === 'midpoint') {

                    var a = d.edge[0],
                        b = d.edge[1];

                    // redraw a midpoint if it needs to be
                    // - moved (either edge node moved)
                    // - deleted (edge nodes not consecutive in any parent way)
                    if (a in complete || b in complete) return true;

                    var parentsWays = graph.parentWays({ id: a });
                    for (var i = 0; i < parentsWays.length; i++) {
                        var nodes = parentsWays[i].nodes;
                        for (var n = 0; n < nodes.length; n++) {
                            if (nodes[n] === a && (nodes[n - 1] === b || nodes[n + 1] === b)) return false;
                        }
                    }
                    return true;

                } else {
                    return d.id in complete;
                }
            };

        } else if (extent) {
            all = context.intersects(map.extent().intersection(extent));
            var set = d3.set(_.pluck(all, 'id'));
            filter = function(d) { return set.has(d.id); };

        } else {
            all = context.intersects(map.extent());
            filter = d3.functor(true);
        }

        surface
            .call(vertices, graph, all, filter, map.extent(), map.zoom())
            .call(lines, graph, all, filter)
            .call(areas, graph, all, filter)
            .call(midpoints, graph, all, filter, map.extent())
            .call(labels, graph, all, filter, dimensions, !difference && !extent);

        if (points.points(context.intersects(map.extent()), 100).length >= 100) {
            surface.select('.layer-hit').selectAll('g.point').remove();
        } else {
            surface.call(points, points.points(all), filter);
        }

        dispatch.drawn({full: true});
    }

    function editOff() {
        surface.selectAll('.layer *').remove();
        dispatch.drawn({full: true});
    }

    function zoomPan() {
        if (d3.event && d3.event.sourceEvent.type === 'dblclick') {
            if (!dblclickEnabled) {
                zoom.scale(projection.scale() * 2 * Math.PI)
                    .translate(projection.translate());
                return d3.event.sourceEvent.preventDefault();
            }
        }

        if (Math.log(d3.event.scale / Math.LN2 - 8) < minzoom + 1) {
            iD.ui.flash(context.container())
                .select('.content')
                .text(t('cannot_zoom'));
            return setZoom(16, true);
        }

        projection
            .translate(d3.event.translate)
            .scale(d3.event.scale / (2 * Math.PI));

        var scale = d3.event.scale / transformStart[0],
            tX = Math.round(d3.event.translate[0] / scale - transformStart[1][0]),
            tY = Math.round(d3.event.translate[1] / scale - transformStart[1][1]);

        var transform =
            'scale(' + scale + ')' +
            (iD.detect().opera ?
                'translate(' + tX + 'px,' + tY + 'px)' :
                'translate3d(' + tX + 'px,' + tY + 'px, 0)');

        transformed = true;
        supersurface.style(transformProp, transform);
        queueRedraw();

        dispatch.move(map);
    }

    function resetTransform() {
        if (!transformed) return false;
        supersurface.style(transformProp, '');
        transformed = false;
        return true;
    }

    function redraw(difference, extent) {

        if (!surface) return;

        clearTimeout(timeoutId);

        // If we are in the middle of a zoom/pan, we can't do differenced redraws.
        // It would result in artifacts where differenced entities are redrawn with
        // one transform and unchanged entities with another.
        if (resetTransform()) {
            difference = extent = undefined;
        }

        var zoom = String(~~map.zoom());
        if (surface.attr('data-zoom') !== zoom) {
            surface.attr('data-zoom', zoom);
        }

        if (!difference) {
            supersurface.call(context.background());
        }

        if (map.editable()) {
            context.connection().loadTiles(projection, dimensions);
            drawVector(difference, extent);
        } else {
            editOff();
        }

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
        var e = d3.event, s;
        while (s = e.sourceEvent) e = s;
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

    function setZoom(z, force) {
        if (z === map.zoom() && !force)
            return false;
        var scale = 256 * Math.pow(2, z),
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

    function setCenter(loc) {
        var t = projection.translate(),
            c = pxCenter(),
            ll = projection(loc);
        if (ll[0] === c[0] && ll[1] === c[1])
            return false;
        projection.translate([
            t[0] - ll[0] + c[0],
            t[1] - ll[1] + c[1]]);
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
        surface.dimensions(dimensions);
        context.background().dimensions(dimensions);
        projection.clipExtent([[0, 0], dimensions]);
        mouse = iD.util.fastMouse(supersurface.node());
        setCenter(center);
        return redraw();
    };

    map.zoomIn = function() { return map.zoom(Math.ceil(map.zoom() + 1)); };
    map.zoomOut = function() { return map.zoom(Math.floor(map.zoom() - 1)); };

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

        if (setZoom(z)) {
            dispatch.move(map);
        }

        return redraw();
    };

    map.zoomTo = function(entity, zoomLimits) {
        var extent = entity.extent(context.graph()),
            zoom = map.extentZoom(extent);
        zoomLimits = zoomLimits || [16, 20];
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
            return t == 10;
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

    map.extentZoom = function(_) {
        var extent = iD.geo.Extent(_),
            tl = projection([extent[0][0], extent[1][1]]),
            br = projection([extent[1][0], extent[0][1]]);

        // Calculate maximum zoom that fits extent
        var hFactor = (br[0] - tl[0]) / dimensions[0],
            vFactor = (br[1] - tl[1]) / dimensions[1],
            hZoomDiff = Math.log(Math.abs(hFactor)) / Math.LN2,
            vZoomDiff = Math.log(Math.abs(vFactor)) / Math.LN2,
            newZoom = map.zoom() - Math.max(hZoomDiff, vZoomDiff);

        return newZoom;
    };

    map.editable = function() {
        return map.zoom() >= 16;
    };

    map.minzoom = function(_) {
        if (!arguments.length) return minzoom;
        minzoom = _;
        return map;
    };

    return d3.rebind(map, dispatch, 'on');
};
