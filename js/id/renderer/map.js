iD.Map = function() {
    var connection, history,
        dimensions = [],
        dispatch = d3.dispatch('move'),
        selection = null, hover = null,
        translateStart,
        keybinding,
        projection = d3.geo.mercator(),
        zoom = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale())
            .scaleExtent([1024, 256 * Math.pow(2, 24)])
            .on('zoom', zoomPan),
        dblclickEnabled = true,
        dragging = false,
        fastEnabled = true,
        background = iD.Background()
            .projection(projection),
        class_stroke = iD.Style.styleClasses('stroke'),
        class_fill = iD.Style.styleClasses('stroke'),
        class_area = iD.Style.styleClasses('area'),
        class_casing = iD.Style.styleClasses('casing'),
        transformProp = iD.util.prefixProperty('Transform'),
        support3d = iD.util.support3d(),
        supersurface, surface, defs, tilegroup, r, g, alength;

    function map() {
        tilegroup = this.append('div')
            .attr('id', 'tile-g');

        supersurface = this.append('div')
            .style('position', 'absolute')
            .call(zoom);

        surface = supersurface.append('svg')
            .on('mouseup', resetTransform)
            .on('touchend', resetTransform);

        defs = surface.append('defs');
        defs.append('clipPath')
                .attr('id', 'clip')
            .append('rect')
                .attr('id', 'clip-rect')
                .attr({ x: 0, y: 0 });

        r = surface.append('g')
            .on('mouseover', hoverIn)
            .on('mouseout', hoverOut)
            .attr('clip-path', 'url(#clip)');

        g = ['fill', 'casing', 'stroke', 'text', 'hit', 'temp'].reduce(function(mem, i) {
            return (mem[i] = r.append('g').attr('class', 'layer-g layer-' + i)) && mem;
        }, {});

        var arrow = surface.append('text').text('►----');
        alength = arrow.node().getComputedTextLength();
        arrow.remove();

        map.size(this.size());
        map.surface = surface;
    }

    function pxCenter() { return [dimensions[0] / 2, dimensions[1] / 2]; }
    function classHover(d) { return d.id === hover; }
    function classActive(d) { return d.id === selection; }
    function getline(d) { return d._line; }
    function key(d) { return d.id; }
    function nodeline(d) {
        return 'M' + _.pluck(d.nodes, 'loc').map(projection).map(iD.util.geo.roundCoords).join('L');
    }

    function drawVector(only) {
        if (surface.style(transformProp) != 'none') return;
        var all = [], ways = [], areas = [], points = [], waynodes = [],
            extent = map.extent(),
            graph = history.graph();

        if (!only) {
            all = graph.intersects(extent);
        } else {
            for (var id in only) all.push(graph.fetch(id));
        }

        var filter = only ?
            function(d) { return only[d.id]; } : function() { return true; };

        if (all.length > 200000) return hideVector();

        for (var i = 0; i < all.length; i++) {
            var a = all[i];
            if (a.type === 'way') {
                a._line = nodeline(a);
                if (iD.Way.isArea(a)) areas.push(a);
                else ways.push(a);
            } else if (a._poi) {
                points.push(a);
            } else if (!a._poi && a.type === 'node' && a.intersects(extent)) {
                waynodes.push(a);
            }
        }
        var wayAccuracyHandles = ways.reduce(function(mem, w) {
            return mem.concat(accuracyHandles(w));
        }, []);
        drawHandles(waynodes, filter);
        drawAccuracyHandles(wayAccuracyHandles, filter);
        drawCasings(ways, filter);
        drawFills(areas, filter);
        drawStrokes(ways, filter);
        drawMarkers(points, filter);
    }

    function accuracyHandles(way) {
        var handles = [];
        for (var i = 0; i < way.nodes.length - 1; i++) {
            if (iD.util.geo.dist(way.nodes[i].loc, way.nodes[i + 1].loc) > 0.0001) {
                handles.push({
                    loc: iD.util.geo.interp(way.nodes[i].loc, way.nodes[i + 1].loc, 0.5),
                    way: way.id,
                    index: i + 1,
                    accuracy: true
                });
            }
        }
        return handles;
    }

    function drawHandles(waynodes, filter) {
        var handles = g.hit.selectAll('image.handle')
            .filter(filter)
            .data(waynodes, key);
        function olderOnTop(a, b) {
            return (+a.id.slice(1)) - (+b.id.slice(1));
        }
        handles.exit().remove();
        handles.enter().append('image')
            .attr({
                width: 6,
                height: 6,
                'class': 'handle',
                'xlink:href': 'css/handle.png'
            });
        handles.attr('transform', function(entity) {
                var p = projection(entity.loc);
                return 'translate(' + [~~p[0], ~~p[1]] +
                    ') translate(-3, -3) rotate(45, 3, 3)';
            })
            .classed('active', classActive)
            .sort(olderOnTop);
    }

    function drawAccuracyHandles(waynodes, filter) {
        var handles = g.hit.selectAll('circle.accuracy-handle')
            .filter(filter)
            .data(waynodes, key);
        handles.exit().remove();
        handles.enter().append('circle')
            .attr({ r: 2, 'class': 'accuracy-handle' });
        handles.attr('transform', function(entity) {
            var p = projection(entity.loc);
            return 'translate(' + [~~p[0], ~~p[1]] + ')';
        }).classed('active', classActive);
    }

    function hideVector() {
        surface.selectAll('.layer-g *').remove();
    }

    function drawLines(data, filter, group, class_gen) {
        var lines = group.selectAll('path')
            .filter(filter)
            .data(data, key);
        lines.exit().remove();
        lines.enter().append('path')
            .classed('hover', classHover)
            .classed('active', classActive);
        lines
            .order()
            .attr('d', getline)
            .attr('class', class_gen)
            .classed('hover', classHover)
            .classed('active', classActive);
        return lines;
    }

    function drawFills(areas, filter) {
        drawLines(areas, filter, g.fill, class_area);
    }

    function drawCasings(ways, filter) {
        drawLines(ways, filter, g.casing, class_casing);
    }

    function drawMarkers(points, filter) {
        var markers = g.hit.selectAll('g.marker')
            .filter(filter)
            .data(points, key);
        markers.exit().remove();
        var marker = markers.enter().append('g')
            .attr('class', 'marker');
        marker.append('circle')
            .attr({ r: 10, cx: 8, cy: 8 });
        marker.append('image')
            .attr({ width: 16, height: 16 });
        markers.attr('transform', function(d) {
                var pt = projection(d.loc);
                return 'translate(' + [~~pt[0], ~~pt[1]] + ') translate(-8, -8)';
            })
            .classed('active', classActive);
        markers.select('image').attr('xlink:href', iD.Style.markerimage);
    }

    function drawStrokes(ways, filter) {
        var strokes = drawLines(ways, filter, g.stroke, class_stroke);

        // Determine the lengths of oneway paths
        var lengths = {},
            oneways = strokes.filter(iD.Way.isOneWay).each(function(d) {
                lengths[d.id] = Math.floor(this.getTotalLength() / alength);
            }).data();

        var uses = defs.selectAll('path')
            .data(oneways, key);
        uses.exit().remove();
        uses.enter().append('path');
        uses
            .attr('id', function(d) { return 'shadow-' + d.id; })
            .attr('d', getline);

        var labels = g.text.selectAll('text')
            .data(oneways, key);
        labels.exit().remove();
        var tp = labels.enter()
            .append('text').attr({ 'class': 'oneway', dy: 4 })
            .append('textPath').attr('class', 'textpath');
        g.text.selectAll('.textpath')
            .attr('xlink:href', function(d, i) { return '#shadow-' + d.id; })
            .text(function(d) {
                return (new Array(Math.floor(lengths[d.id]))).join('►----');
            });
    }

    function connectionLoad(err, result) {
        history.merge(result);
        drawVector(iD.util.trueObj(Object.keys(result.entities)));
    }

    function hoverIn() {
        var datum = d3.select(d3.event.target).datum();
        if (datum instanceof iD.Entity) {
            hover = datum.id;
            drawVector(iD.util.trueObj([hover]));
            d3.select('.messages').text(datum.tags.name || '#' + datum.id);
        }
    }

    function hoverOut() {
        if (hover) {
            var oldHover = hover;
            hover = null;
            drawVector(iD.util.trueObj([oldHover]));
            d3.select('.messages').text('');
        }
    }

    function zoomPan() {
        if (d3.event && d3.event.sourceEvent.type === 'dblclick') {
            if (!dblclickEnabled) return;
        }
        var fast = (d3.event.scale === projection.scale() && fastEnabled);
        projection
            .translate(d3.event.translate)
            .scale(d3.event.scale);
        if (fast) {
            if (!translateStart) translateStart = d3.event.translate.slice();
            var a = d3.event.translate,
                b = translateStart;
            if (support3d) {
                tilegroup.style(transformProp,
                    'translate3d(' + ~~(a[0] - b[0]) + 'px,' + ~~(a[1] - b[1]) + 'px, 0px)');
                surface.style(transformProp,
                    'translate3d(' + ~~(a[0] - b[0]) + 'px,' + ~~(a[1] - b[1]) + 'px, 0px)');
            } else {
                tilegroup.style(transformProp,
                    'translate(' + ~~(a[0] - b[0]) + 'px,' + ~~(a[1] - b[1]) + 'px)');
                surface.style(transformProp,
                    'translate(' + ~~(a[0] - b[0]) + 'px,' + ~~(a[1] - b[1]) + 'px)');
            }
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

    function redraw() {
        dispatch.move(map);
        tilegroup.call(background);
        if (map.zoom() > 16) {
            connection.loadTiles(projection);
            drawVector();
        } else {
            hideVector();
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
        return projection.invert(d3.mouse(surface.node()));
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

    map.extent = function() {
        return [projection.invert([0, 0]), projection.invert(dimensions)];
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

    map.hint = function (_) {
        if (_ === false) {
            d3.select('div.inspector-wrap')
                .style('opacity', 0)
                .style('display', 'none');
        } else {
            d3.select('div.inspector-wrap')
                .style('display', 'block')
                .transition()
                .style('opacity', 1)
                .text(_);
        }
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

    map.selection = function (_) {
        if (!arguments.length) return selection;
        selection = _;
        return redraw();
    };

    map.background = background;
    map.projection = projection;
    map.redraw = redraw;

    return d3.rebind(map, dispatch, 'on', 'move');
};
