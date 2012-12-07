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
        notice,
        background = iD.Background()
            .projection(projection),
        class_stroke = iD.Style.styleClasses('way line stroke'),
        class_casing = iD.Style.styleClasses('way line casing'),
        class_area = iD.Style.styleClasses('way area'),
        transformProp = iD.util.prefixCSSProperty('Transform'),
        supersurface, surface, defs, tilegroup, r, g, alength;

    function map() {
        tilegroup = this.append('div')
            .attr('id', 'tile-g');

        supersurface = this.append('div')
            .style('position', 'absolute')
            .call(zoom);

        surface = supersurface.append('svg')
            .on('mouseup.reset-transform', resetTransform)
            .on('touchend.reset-transform', resetTransform);

        defs = surface.append('defs');
        defs.append('clipPath')
                .attr('id', 'clip')
            .append('rect')
                .attr('id', 'clip-rect')
                .attr({ x: 0, y: 0 });

        r = surface.append('g')
            .attr('clip-path', 'url(#clip)');

        g = ['fill', 'casing', 'stroke', 'text', 'hit', 'temp'].reduce(function(mem, i) {
            return (mem[i] = r.append('g').attr('class', 'layer-g layer-' + i)) && mem;
        }, {});

        var arrow = surface.append('text').text('►----');
        alength = arrow.node().getComputedTextLength();
        arrow.remove();

        notice = iD.notice(supersurface
            .append('div')
            .attr('class', 'notice'));

        map.size(this.size());
        map.surface = surface;

        d3.select(document).call(keybinding);
    }

    function pxCenter() { return [dimensions[0] / 2, dimensions[1] / 2]; }
    function getline(d) { return d._line; }
    function key(d) { return d.id; }
    function nodeline(d) {
        return 'M' + _.pluck(d.nodes, 'loc').map(projection).map(iD.util.geo.roundCoords).join('L');
    }

    function drawVector(difference) {
        if (surface.style(transformProp) != 'none') return;
        var filter, all, ways = [], lines = [], areas = [], points = [], vertices = [],
            extent = map.extent(),
            graph = history.graph();

        if (!difference) {
            all = graph.intersects(extent);
            filter = d3.functor(true);
        } else {
            var only = {};
            difference.forEach(function buildDifference(id) {
                only[id] = graph.fetch(id);
                graph.parentWays(id).forEach(function buildOnly(parent) {
                    only[parent.id] = graph.fetch(parent.id);
                });
            });
            all = _.compact(_.values(only));
            filter = function(d) { return d.accuracy ? d.way in only : d.id in only; };
        }

        if (all.length > 10000) return editOff();
        else editOn();

        for (var i = 0; i < all.length; i++) {
            var a = all[i];
            if (a.type === 'way') {
                a._line = nodeline(a);
                ways.push(a);
                if (a.isArea()) areas.push(a);
                else lines.push(a);
            } else if (a._poi) {
                points.push(a);
            } else if (!a._poi && a.type === 'node' && a.intersects(extent)) {
                vertices.push(a);
            }
        }
        var parentStructure = graph.parentStructure(ways);
        var wayAccuracyHandles = [];
        for (i = 0; i < ways.length; i++) {
            accuracyHandles(ways[i], wayAccuracyHandles);
        }
        drawVertices(vertices, parentStructure, filter);
        drawAccuracyHandles(wayAccuracyHandles, filter);
        drawCasings(lines, filter);
        drawFills(areas, filter);
        drawStrokes(lines, filter);
        drawPoints(points, filter);
    }

    // updates handles by reference
    function accuracyHandles(way, handles) {
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
    }

    function pointTransform(entity) {
        return 'translate(' + iD.util.geo.roundCoords(projection(entity.loc)) + ')';
    }

    function drawVertices(vertices, parentStructure, filter) {
        function shared(d) { return parentStructure[d.id] > 1; }

        var circles = g.hit.selectAll('g.vertex')
            .filter(filter)
            .data(vertices, key);

        circles.exit().remove();

        var cg = circles.enter()
            .insert('g', ':first-child')
            .attr('class', 'node vertex');

        cg.append('circle')
            .attr('class', 'stroke')
            .attr('r', 6);

        cg.append('circle')
            .attr('class', 'fill')
            .attr('r', 4);

        circles.attr('transform', pointTransform)
            .classed('shared', shared);
    }

    function drawAccuracyHandles(waynodes, filter) {
        var handles = g.hit.selectAll('circle.accuracy-handle')
            .filter(filter)
            .data(waynodes, function (d) { return [d.way, d.index].join(","); });
        handles.exit().remove();
        handles.enter().append('circle')
            .attr({ r: 3, 'class': 'accuracy-handle' });
        handles.attr('transform', pointTransform);
    }

    function editOff() {
        notice.message('Zoom in to edit the map');
        surface.selectAll('.layer-g *').remove();
    }

    function editOn() {
        notice.message('');
    }

    function drawLines(data, filter, group, class_gen) {
        var lines = group.selectAll('path')
            .filter(filter)
            .data(data, key);
        lines.exit().remove();
        lines.enter().append('path');
        lines
            .order()
            .attr('d', getline)
            .attr('class', class_gen);
        return lines;
    }

    function drawFills(areas, filter) {
        drawLines(areas, filter, g.fill, class_area);
    }

    function drawCasings(ways, filter) {
        drawLines(ways, filter, g.casing, class_casing);
    }

    function drawPoints(points, filter) {
        var groups = g.hit.selectAll('g.point')
            .filter(filter)
            .data(points, key);

        groups.exit().remove();

        var group = groups.enter().append('g')
            .attr('class', 'node point');

        group.append('circle')
            .attr('class', 'stroke')
            .attr({ r: 10 });

        group.append('circle')
            .attr('class', 'fill')
            .attr({ r: 10 });

        group.append('image')
            .attr({ width: 16, height: 16 })
            .attr('transform', 'translate(-8, -8)');

        groups.attr('transform', pointTransform);

        groups.select('image').attr('xlink:href', iD.Style.pointImage);
    }

    function drawStrokes(ways, filter) {
        var strokes = drawLines(ways, filter, g.stroke, class_stroke);

        // Determine the lengths of oneway paths
        var lengths = {},
            oneways = strokes.filter(function (d) { return d.isOneWay(); }).each(function(d) {
                lengths[d.id] = Math.floor(this.getTotalLength() / alength);
            }).data();

        var uses = defs.selectAll('path')
            .filter(filter)
            .data(oneways, key);
        uses.exit().remove();
        uses.enter().append('path');
        uses
            .attr('id', function(d) { return 'shadow-' + d.id; })
            .attr('d', getline);

        var labels = g.text.selectAll('text')
            .filter(filter)
            .data(oneways, key);
        labels.exit().remove();
        var tp = labels.enter()
            .append('text').attr({ 'class': 'oneway', dy: 4 })
            .append('textPath').attr('class', 'textpath');
        g.text.selectAll('.textpath')
            .filter(filter)
            .attr('xlink:href', function(d, i) { return '#shadow-' + d.id; })
            .text(function(d) {
                return (new Array(Math.floor(lengths[d.id]))).join('►----');
            });
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
        var fast = (d3.event.scale === projection.scale() && fastEnabled);
        projection
            .translate(d3.event.translate)
            .scale(d3.event.scale);
        if (fast) {
            if (!translateStart) translateStart = d3.event.translate.slice();
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
        tilegroup.call(background);
        if (map.zoom() > 16) {
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
