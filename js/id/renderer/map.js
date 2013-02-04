iD.Map = function(context) {
    var dimensions = [],
        dispatch = d3.dispatch('move', 'drawn'),
        projection = d3.geo.mercator().scale(1024),
        roundedProjection = iD.svg.RoundProjection(projection),
        zoom = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale())
            .scaleExtent([1024, 256 * Math.pow(2, 24)])
            .on('zoom', zoomPan),
        dblclickEnabled = true,
        fastEnabled = true,
        transformStart,
        minzoom = 0,
        background = iD.Background()
            .projection(projection),
        transformProp = iD.util.prefixCSSProperty('Transform'),
        points = iD.svg.Points(roundedProjection),
        vertices = iD.svg.Vertices(roundedProjection),
        lines = iD.svg.Lines(roundedProjection),
        areas = iD.svg.Areas(roundedProjection),
        multipolygons = iD.svg.Multipolygons(roundedProjection),
        midpoints = iD.svg.Midpoints(roundedProjection),
        labels = iD.svg.Labels(roundedProjection),
        tail = d3.tail(),
        surface, tilegroup;

    function map(selection) {
        context.history()
            .on('change.map', redraw);

        selection.call(zoom);

        tilegroup = selection.append('div')
            .attr('id', 'tile-g');

        var supersurface = selection.append('div')
            .style('position', 'absolute');

        surface = supersurface.append('svg')
            .on('mousedown.zoom', function() {
                if (d3.event.button == 2) {
                    d3.event.stopPropagation();
                }
            }, true)
            .attr('id', 'surface')
            .call(iD.svg.Surface());


        map.size(selection.size());
        map.surface = surface;

        supersurface
            .call(tail);
    }

    function pxCenter() { return [dimensions[0] / 2, dimensions[1] / 2]; }

    function drawVector(difference) {
        var filter, all,
            extent = map.extent(),
            graph = context.graph();

        if (!difference) {
            all = graph.intersects(extent);
            filter = d3.functor(true);
        } else {
            var complete = difference.complete(extent);
            all = _.compact(_.values(complete));
            filter = function(d) {
                if (d.type === 'midpoint') {
                    for (var i = 0; i < d.ways.length; i++) {
                        if (d.ways[i].id in complete) return true;
                    }
                } else {
                    return d.id in complete;
                }
            };
        }

        if (all.length > 100000) {
            editOff();
        } else {
            surface
                .call(points, graph, all, filter)
                .call(vertices, graph, all, filter)
                .call(lines, graph, all, filter)
                .call(areas, graph, all, filter)
                .call(multipolygons, graph, all, filter)
                .call(midpoints, graph, all, filter)
                .call(labels, graph, all, filter, dimensions, !difference);
        }
        dispatch.drawn(map);
    }

    function editOff() {
        surface.selectAll('.layer *').remove();
    }

    function zoomPan() {
        if (d3.event && d3.event.sourceEvent.type === 'dblclick') {
            if (!dblclickEnabled) {
                zoom.scale(projection.scale())
                    .translate(projection.translate());
                return d3.event.sourceEvent.preventDefault();
            }
        }

        if (Math.log(d3.event.scale / Math.LN2 - 8) < minzoom + 1) {
            iD.ui.flash()
                .select('.content')
                .text('Cannot zoom out further in current mode.');
            return map.zoom(16);
        }

        projection
            .translate(d3.event.translate)
            .scale(d3.event.scale);

        var ascale = d3.event.scale;
        var bscale = transformStart[0];
        var scale = (ascale / bscale);

        var tX = Math.round((d3.event.translate[0] / scale) - (transformStart[1][0]));
        var tY = Math.round((d3.event.translate[1] / scale) - (transformStart[1][1]));

        var transform =
            'scale(' + scale + ')' +
            'translate(' + tX + 'px,' + tY + 'px) ';

        tilegroup.style(transformProp, transform);
        surface.style(transformProp, transform);
        queueRedraw();

        dispatch.move(map);
    }

    function resetTransform() {
        var prop = surface.style(transformProp);
        if (!prop || prop === 'none') return false;
        surface.style(transformProp, '');
        tilegroup.style(transformProp, '');
        return true;
    }

    function redraw(difference) {
        // If we are in the middle of a zoom/pan, we can't do differenced redraws.
        // It would result in artifacts where differenced entities are redrawn with
        // one transform and unchanged entities with another.
        if (resetTransform())
            difference = undefined;

        surface.attr('data-zoom', ~~map.zoom());
        tilegroup.call(background);

        if (map.editable()) {
            context.connection().loadTiles(projection, dimensions);
            drawVector(difference);
        } else {
            editOff();
        }

        transformStart = [
            projection.scale(),
            projection.translate().slice()];

        return map;
    }

    var queueRedraw = _.debounce(redraw, 200);

    function pointLocation(p) {
        var translate = projection.translate(),
            scale = projection.scale();
        return [(p[0] - translate[0]) / scale, (p[1] - translate[1]) / scale];
    }

    function locationPoint(l) {
        var translate = projection.translate(),
            scale = projection.scale();
        return [l[0] * scale + translate[0], l[1] * scale + translate[1]];
    }

    map.mouseCoordinates = function() {
        try {
            return projection.invert(d3.mouse(surface.node()));
        } catch(e) {
            // when called with hidden elements, d3.mouse() will throw
            return [NaN, NaN];
        }
    };

    map.dblclickEnable = function(_) {
        if (!arguments.length) return dblclickEnabled;
        dblclickEnabled = _;
        return map;
    };

    map.fastEnable = function(_) {
        if (!arguments.length) return fastEnabled;
        fastEnabled = _;
        return map;
    };

    function setZoom(z) {
        if (z === map.zoom())
            return false;
        var scale = 256 * Math.pow(2, z),
            center = pxCenter(),
            l = pointLocation(center);
        scale = Math.max(1024, Math.min(256 * Math.pow(2, 24), scale));
        projection.scale(scale);
        zoom.scale(projection.scale());
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
        return map;
    };

    map.size = function(_) {
        if (!arguments.length) return dimensions;
        dimensions = _;
        surface.size(dimensions);
        background.size(dimensions);
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
            return Math.max(Math.log(projection.scale()) / Math.LN2 - 8, 0);
        }

        if (setZoom(z)) {
            dispatch.move(map);
        }

        return redraw();
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
        var from = map.center().slice(), t = 0;
        d3.timer(function() {
            map.center(iD.geo.interp(from, loc, (t += 1) / 10));
            return t == 10;
        }, 20);
        return map;
    };

    map.extent = function(_) {
        if (!arguments.length) {
            return iD.geo.Extent(projection.invert([0, dimensions[1]]),
                                 projection.invert([dimensions[0], 0]));
        } else {
            var extent = iD.geo.Extent(_),
                tl = projection([extent[0][0], extent[1][1]]),
                br = projection([extent[1][0], extent[0][1]]);

            // Calculate maximum zoom that fits extent
            var hFactor = (br[0] - tl[0]) / dimensions[0],
                vFactor = (br[1] - tl[1]) / dimensions[1],
                hZoomDiff = Math.log(Math.abs(hFactor)) / Math.LN2,
                vZoomDiff = Math.log(Math.abs(vFactor)) / Math.LN2,
                newZoom = map.zoom() - Math.max(hZoomDiff, vZoomDiff);

            map.centerZoom(extent.center(), newZoom);
        }
    };

    map.flush = function () {
        context.connection().flush();
        context.history().reset();
        return map;
    };

    var usedTails = {};
    map.tail = function (_) {
        if (!_ || usedTails[_] === undefined) {
            tail.text(_);
            usedTails[_] = true;
        }
        return map;
    };

    map.editable = function() {
        return map.zoom() >= 16;
    };

    map.minzoom = function(_) {
        if (!arguments.length) return minzoom;
        minzoom = _;
        return map;
    };

    map.background = background;
    map.projection = projection;
    map.redraw = redraw;

    return d3.rebind(map, dispatch, 'on');
};
