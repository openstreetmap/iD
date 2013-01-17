iD.Map = function() {
    var connection, history,
        dimensions = [],
        dispatch = d3.dispatch('move'),
        translateStart,
        keybinding = d3.keybinding(),
        projection = d3.geo.mercator().scale(1024),
        zoom = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale())
            .scaleExtent([1024, 256 * Math.pow(2, 24)])
            .on('zoom', zoomPan),
        dblclickEnabled = true,
        fastEnabled = true,
        minzoom = 0,
        background = iD.Background()
            .projection(projection),
        transformProp = iD.util.prefixCSSProperty('Transform'),
        points = iD.svg.Points(),
        vertices = iD.svg.Vertices(),
        lines = iD.svg.Lines(),
        areas = iD.svg.Areas(),
        midpoints = iD.svg.Midpoints(),
        tail = d3.tail(),
        surface, tilegroup;

    function map(selection) {
        tilegroup = selection.append('div')
            .attr('id', 'tile-g');

        var supersurface = selection.append('div')
            .style('position', 'absolute')
            .on('mousedown.drag', function() {
                translateStart = projection.translate();
            })
            .call(zoom);

        surface = supersurface.append('svg')
            .on('mouseup.reset-transform', resetTransform)
            .on('touchend.reset-transform', resetTransform)
            .on('mousedown.zoom', function() {
                if (d3.event.button == 2) {
                    d3.event.stopPropagation();
                }
            })
            .call(iD.svg.Surface());


        map.size(selection.size());
        map.surface = surface;

        supersurface
            .call(tail);

        d3.select(document).call(keybinding);
    }

    function pxCenter() { return [dimensions[0] / 2, dimensions[1] / 2]; }

    function drawVector(difference) {
        if (surface.style(transformProp) != 'none') return;
        var filter, all,
            extent = map.extent(),
            graph = history.graph();

        if (!difference) {
            all = graph.intersects(extent);
            filter = d3.functor(true);
        } else {
            var only = {},
                filterOnly = {};
            for (var j = 0; j < difference.length; j++) {
                var id = difference[j],
                    entity = graph.fetch(id);
                // Even if the entity is false (deleted), it needs to be
                // removed from the surface
                only[id] = entity;
                if (entity && entity.intersects(extent, graph)) {
                    if (only[id].type === 'node') {
                        var parents = graph.parentWays(only[id]);
                        for (var k = 0; k < parents.length; k++) {
                            // Don't re-fetch parents
                            if (only[parents[k].id] === undefined) {
                                only[parents[k].id] = graph.fetch(parents[k].id);
                            }
                        }
                    }
                }
            }
            all = _.compact(_.values(only));
            filter = function(d) { return d.midpoint ? d.way in only : d.id in only; };
        }

        if (all.length > 100000) {
            editOff();
            return;
        }

        surface
            .call(points, graph, all, filter, projection)
            .call(vertices, graph, all, filter, projection)
            .call(lines, graph, all, filter, projection)
            .call(areas, graph, all, filter, projection)
            .call(midpoints, graph, all, filter, projection);
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
        var fast = (d3.event.scale === projection.scale() && fastEnabled);
        projection
            .translate(d3.event.translate)
            .scale(d3.event.scale);
        if (fast && translateStart) {
            var a = d3.event.translate,
                b = translateStart,
                translate = 'translate(' + ~~(a[0] - b[0]) + 'px,' +
                    ~~(a[1] - b[1]) + 'px)';
            tilegroup.style(transformProp, translate);
            surface.style(transformProp, translate);
        } else {
            redraw();
            translateStart = null;
        }
    }

    function resetTransform() {
        if (!surface.style(transformProp)) return;
        translateStart = null;
        surface.style(transformProp, '');
        tilegroup.style(transformProp, '');
        redraw();
    }

    function redraw(difference) {
        dispatch.move(map);
        surface.attr('data-zoom', ~~map.zoom());
        tilegroup.call(background);
        if (map.zoom() >= 16) {
            connection.loadTiles(projection);
            drawVector(difference);
        } else {
            editOff();
        }
        return map;
    }

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

    map.zoom = function(z) {
        if (!arguments.length) {
            return Math.max(Math.log(projection.scale()) / Math.LN2 - 8, 0);
        }
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
        return redraw();
    };

    map.size = function(_) {
        if (!arguments.length) return dimensions;
        dimensions = _;
        surface
            .size(dimensions)
            .selectAll('#clip-rect')
            .size(dimensions);
        background.size(dimensions);
        return redraw();
    };

    map.zoomIn = function() { return map.zoom(Math.ceil(map.zoom() + 1)); };
    map.zoomOut = function() { return map.zoom(Math.floor(map.zoom() - 1)); };

    map.center = function(loc) {
        if (!arguments.length) {
            return projection.invert(pxCenter());
        } else {
            var t = projection.translate(),
                c = pxCenter(),
                ll = projection(loc);
            projection.translate([
                t[0] - ll[0] + c[0],
                t[1] - ll[1] + c[1]]);
            zoom.translate(projection.translate());
            return redraw();
        }
    };

    map.centerEase = function(loc) {
        var from = map.center().slice(), t = 0;
        d3.timer(function() {
            map.center(iD.util.geo.interp(from, loc, (t += 1) / 10));
            return t == 10;
        }, 20);
    };

    map.extent = function(tl, br) {
        if (!arguments.length) {
            return [projection.invert([0, 0]), projection.invert(dimensions)];
        } else {

            var TL = projection(tl),
                BR = projection(br);

            // Calculate maximum zoom that fits extent
            var hFactor = (BR[0] - TL[0]) / dimensions[0],
                vFactor = (BR[1] - TL[1]) / dimensions[1],
                hZoomDiff = Math.log(Math.abs(hFactor)) / Math.LN2,
                vZoomDiff = Math.log(Math.abs(vFactor)) / Math.LN2,
                newZoom = map.zoom() - Math.max(hZoomDiff, vZoomDiff);

            // Calculate center of projected extent
            var midPoint = [(TL[0] + BR[0]) / 2, (TL[1] + BR[1]) / 2],
                midLoc = projection.invert(midPoint);

            map.zoom(newZoom).center(midLoc);
        }
    };

    map.flush = function () {
        connection.flush();
        return map;
    };

    map.connection = function(_) {
        if (!arguments.length) return connection;
        connection = _;
        connection.on('load', connectionLoad);
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

    map.keybinding = function (_) {
        if (!arguments.length) return keybinding;
        keybinding = _;
        return map;
    };

    map.background = background;
    map.projection = projection;
    map.redraw = redraw;

    return d3.rebind(map, dispatch, 'on');
};
