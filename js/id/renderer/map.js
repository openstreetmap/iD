iD.Map = function() {
    var connection, history,
        dimensions = [],
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
        tail = d3.tail(),
        surface, tilegroup;

    function map(selection) {
        tilegroup = selection.append('div')
            .attr('id', 'tile-g');

        var supersurface = selection.append('div')
            .style('position', 'absolute')
            .call(zoom);

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
        if (surface.style(transformProp) != 'none') return;
        var filter, all,
            extent = map.extent(),
            graph = history.graph();

        function addParents(parents) {
            for (var i = 0; i < parents.length; i++) {
                var parent = parents[i];
                if (only[parent.id] === undefined) {
                    only[parent.id] = graph.fetch(parent.id);
                    addParents(graph.parentRelations(parent));
                }
            }
        }

        if (!difference) {
            all = graph.intersects(extent);
            filter = d3.functor(true);
        } else {
            var only = {};

            for (var j = 0; j < difference.length; j++) {
                var id = difference[j],
                    entity = graph.fetch(id);

                // Even if the entity is false (deleted), it needs to be
                // removed from the surface
                only[id] = entity;

                if (entity && entity.intersects(extent, graph)) {
                    addParents(graph.parentWays(only[id]));
                    addParents(graph.parentRelations(only[id]));
                }
            }

            all = _.compact(_.values(only));
            filter = function(d) { return d.midpoint ? d.way in only : d.id in only; };
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
                .call(midpoints, graph, all, filter);
        }
        dispatch.drawn(map);
    }

    function editOff() {
        surface.selectAll('.layer *').remove();
    }

    function connectionLoad(err, result) {
        history.merge(result);
        redraw(Object.keys(result.entities));
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
            iD.flash()
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
    }

    function resetTransform() {
        if (!surface.style(transformProp)) return;
        surface.style(transformProp, '');
        tilegroup.style(transformProp, '');
    }

    function redraw(difference) {
        resetTransform();
        dispatch.move(map);
        surface.attr('data-zoom', ~~map.zoom());
        tilegroup.call(background);
        if (map.zoom() >= 16) {
            connection.loadTiles(projection);
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
    }

    function setCenter(loc) {
        var t = projection.translate(),
            c = pxCenter(),
            ll = projection(loc);
        projection.translate([
            t[0] - ll[0] + c[0],
            t[1] - ll[1] + c[1]]);
        zoom.translate(projection.translate());
    }

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
        } else {
            setCenter(loc);
            return redraw();
        }
    };

    map.zoom = function(z) {
        if (!arguments.length) {
            return Math.max(Math.log(projection.scale()) / Math.LN2 - 8, 0);
        }
        setZoom(z);
        return redraw();
    };

    map.centerZoom = function(loc, z) {
        setCenter(loc);
        setZoom(z);
        return redraw();
    };

    map.centerEase = function(loc) {
        var from = map.center().slice(), t = 0;
        d3.timer(function() {
            map.center(iD.geo.interp(from, loc, (t += 1) / 10));
            return t == 10;
        }, 20);
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
        connection.flush();
        return map;
    };

    map.connection = function(_) {
        if (!arguments.length) return connection;
        connection = _;
        connection.on('load.tile', connectionLoad);
        return map;
    };

    map.tail = function (_) {
        tail.text(_);
        return map;
    };

    map.hint = function (_) {
        if (_ === false) {
            d3.select('div.inspector-wrap')
                .style('opacity', 0)
                .style('display', 'none');
        } else {
            d3.select('div.inspector-wrap')
                .html('')
                .style('display', 'block')
                .transition()
                .style('opacity', 1);
            d3.select('div.inspector-wrap')
                .append('div')
                .attr('class','inspector-inner')
                .text(_);
        }
    };

    map.minzoom = function(_) {
        if (!arguments.length) return minzoom;
        minzoom = _;
    };

    map.history = function (_) {
        if (!arguments.length) return history;
        history = _;
        history.on('change.map', redraw);
        return map;
    };

    map.background = background;
    map.projection = projection;
    map.redraw = redraw;

    return d3.rebind(map, dispatch, 'on');
};
