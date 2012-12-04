iD.Map = function() {
    var connection, history,
        dimensions = [],
        dispatch = d3.dispatch('move'),
        inspector = iD.Inspector(),
        selection = null,
        translateStart,
        keybinding,
        apiTilesLoaded = {},
        projection = d3.geo.mercator(),
        zoom = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale())
            .scaleExtent([1024, 256 * Math.pow(2, 24)])
            .on('zoom', zoomPan),
        dblclickEnabled = true,
        dragEnabled = true,
        dragging,
        dragbehavior = d3.behavior.drag()
            .origin(function(entity) {
                if (!dragEnabled) return { x: 0, y: 0 };
                var p = projection(ll2a(entity));
                return { x: p[0], y: p[1] };
            })
            .on('drag', function(entity) {
                d3.event.sourceEvent.stopPropagation();

                if (!dragging) {
                    if (entity.accuracy) {
                        var way = history.graph().entity(entity.way);
                        history.perform(iD.actions.addWayNode(way, iD.Node(entity), entity.index));
                    }

                    dragging = iD.util.trueObj([entity.id].concat(
                        _.pluck(history.graph().parents(entity.id), 'id')));
                    history.perform(iD.actions.noop());
                }

                var to = projection.invert([d3.event.x, d3.event.y]);
                history.replace(iD.actions.move(entity, to));

                redraw();
            })
            .on('dragend', function () {
                if (!dragEnabled || !dragging) return;
                dragging = undefined;
                redraw();
            }),
        waydragbehavior = d3.behavior.drag()
            .origin(function(entity) {
                var p = projection(ll2a(entity.nodes[0]));
                return { x: p[0], y: p[1] };
            })
            .on('drag', function(entity) {
                console.log(dragEnabled);
                if (!dragEnabled) return;
                d3.event.sourceEvent.stopPropagation();

                if (!dragging) {
                    dragging = iD.util.trueObj([entity.id].concat(
                        _.pluck(history.graph().parents(entity.id), 'id')));
                    history.perform(iD.actions.noop());
                }

                entity.nodes.forEach(function(node) {
                    var start = projection(ll2a(node));
                    var end = projection.invert([start[0] + d3.event.dx, start[1] + d3.event.dy]);
                    node.lon = end[0];
                    node.lat = end[1];
                    history.replace(iD.actions.move(node, end));
                });
            })
            .on('dragend', function () {
                if (!dragEnabled || !dragging) return;
                dragging = undefined;
                redraw();
            }),
        background = iD.Background()
            .projection(projection)
            .scaleExtent([0, 20]),
        class_stroke = iD.Style.styleClasses('stroke'),
        class_fill = iD.Style.styleClasses('stroke'),
        class_area = iD.Style.styleClasses('area'),
        class_casing = iD.Style.styleClasses('casing'),
        transformProp = iD.util.prefix() + 'transform',
        supersurface, surface, defs, tilegroup, r, g, alength;

    function map() {
        supersurface = this.append('div').call(zoom);

        surface = supersurface.append('svg')
            .on('mouseup', resetTransform)
            .on('touchend', resetTransform);

        defs = surface.append('defs');
        defs.append('clipPath')
                .attr('id', 'clip')
            .append('rect')
                .attr('id', 'clip-rect')
                .attr({ x: 0, y: 0 });

        tilegroup = surface.append('g')
            .attr('clip-path', 'url(#clip)')
            .on('click', deselectClick);

        r = surface.append('g')
            .on('click', selectClick)
            .on('mouseover', nameHoverIn)
            .on('mouseout', nameHoverOut)
            .attr('clip-path', 'url(#clip)');

        g = ['fill', 'casing', 'stroke', 'text', 'hit', 'temp'].reduce(function(mem, i) {
            return (mem[i] = r.append('g').attr('class', 'layer-g')) && mem;
        }, {});

        var arrow = surface.append('text').text('►----');
        alength = arrow.node().getComputedTextLength();
        arrow.remove();

        inspector.on('changeTags', function(d, tags) {
            var entity = history.graph().entity(d.id);
            history.perform(iD.actions.changeTags(entity, tags));
        }).on('changeWayDirection', function(d) {
            history.perform(iD.actions.changeWayDirection(d));
        }).on('remove', function(d) {
            removeEntity(d);
            hideInspector();
        }).on('close', function() {
            deselectClick();
            hideInspector();
        });

        map.size(this.size());
        map.surface = surface;
    }

    function ll2a(o) { return [o.lon, o.lat]; }
    function pxCenter() { return [dimensions[0] / 2, dimensions[0] / 2]; }
    function classActive(d) { return d.id === selection; }
    function getline(d) { return d._line; }
    function key(d) { return d.id; }
    function nodeline(d) {
        return 'M' + d.nodes.map(ll2a).map(projection).map(iD.util.geo.roundCoords).join('L');
    }

    function hideInspector() {
        d3.select('.inspector-wrap').style('display', 'none');
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
            } else if (!a._poi && a.type === 'node' && iD.util.geo.nodeIntersect(a, extent)) {
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
            handles[i] = iD.Node(iD.util.geo.interp(way.nodes[i], way.nodes[i + 1], 0.5));
            handles[i].way = way.id;
            handles[i].index = i + 1;
            handles[i].accuracy = true;
            handles[i].tags = { name: 'Improve way accuracy' };
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
            .attr({ width: 6, height: 6, 'class': 'handle', 'xlink:href': 'css/handle.png' })
            .call(dragbehavior);
        handles.attr('transform', function(entity) {
                var p = projection(ll2a(entity));
                return 'translate(' + [~~p[0], ~~p[1]] + ') translate(-3, -3) rotate(45, 3, 3)';
            })
            .classed('active', classActive)
            .sort(olderOnTop);
    }

    function drawAccuracyHandles(waynodes) {
        var handles = g.hit.selectAll('circle.accuracy-handle')
            .data(waynodes, key);
        handles.exit().remove();
        handles.enter().append('circle')
            .attr({ r: 2, 'class': 'accuracy-handle' })
            .call(dragbehavior);
        handles.attr('transform', function(entity) {
            var p = projection(ll2a(entity));
            return 'translate(' + [~~p[0], ~~p[1]] + ')';
        }).classed('active', classActive);
    }

    function hideVector() {
        surface.selectAll('.layer-g *').remove();
    }

    function drawFills(areas, filter) {
        var fills = g.fill.selectAll('path')
            .filter(filter)
            .data(areas, key);
        fills.exit().remove();
        fills.enter().append('path')
            .attr('class', class_area)
            .classed('active', classActive);
        fills
            .attr('d', getline)
            .attr('class', class_area)
            .classed('active', classActive);
    }

    function drawMarkers(points, filter) {
        var markers = g.hit.selectAll('g.marker')
            .filter(filter)
            .data(points, key);
        markers.exit().remove();
        var marker = markers.enter().append('g')
            .attr('class', 'marker')
            .call(dragbehavior);
        marker.append('circle')
            .attr({ r: 10, cx: 8, cy: 8 });
        marker.append('image')
            .attr({ width: 16, height: 16 });
        markers.attr('transform', function(d) {
                var pt = projection([d.lon, d.lat]);
                return 'translate(' + [~~pt[0], ~~pt[1]] + ') translate(-8, -8)';
            })
            .classed('active', classActive);
        markers.select('image').attr('xlink:href', iD.Style.markerimage);
    }

    function drawStrokes(ways, filter) {
        var strokes = g.stroke.selectAll('path')
            .filter(filter)
            .data(ways, key);
        strokes.exit().remove();
        strokes.enter().append('path')
            .attr('class', class_stroke)
            .classed('active', classActive);
        strokes
            .order()
            .attr('d', getline)
            .attr('class', class_stroke)
            .classed('active', classActive);

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

    function drawCasings(ways, filter) {
        var casings = g.casing.selectAll('path')
            .filter(filter)
            .data(ways, key);
        casings.exit().remove();
        casings.enter().append('path')
            .attr('class', class_casing)
            .classed('active', classActive);
        casings
            .order()
            .attr('d', getline)
            .attr('class', class_casing)
            .classed('active', classActive);
    }


    function connectionLoad(err, result) {
        history.merge(result);
        drawVector(iD.util.trueObj(Object.keys(result.entities)));
    }

    function nameHoverIn() {
        var entity = d3.select(d3.event.target).data();
        if (entity) d3.select('.messages').text(entity[0].tags.name || '#' + entity[0].id);
    }

    function nameHoverOut() { d3.select('.messages').text(''); }

    function selectClick() {
        var entity = d3.select(d3.event.target).data();
        if (entity) entity = entity[0];
        if (!entity || selection === entity.id || (entity.tags && entity.tags.elastic)) return;
        if (entity.type === 'way') d3.select(d3.event.target).call(waydragbehavior);
        map.selectEntity(entity);
        keybinding.on('⌫.deletefeature', function(e) {
            removeEntity(entity);
            e.preventDefault();
        });
    }

    function deselectClick() {
        if (selection && selection.type === 'way') {
            d3.select(d3.event.target)
                .on('mousedown.drag', null)
                .on('touchstart.drag', null);
        }
        selection = null;
        redraw();
        hideInspector();
        keybinding.on('⌫.deletefeature', null);
    }

    function removeEntity(entity) {
        // Remove this node from any ways that is a member of
        history.graph().parents(entity.id)
            .filter(function(d) { return d.type === 'way'; })
            .forEach(function(parent) {
                history.perform(iD.actions.removeWayNode(parent, entity));
            });
        deselectClick();
        history.perform(iD.actions.remove(entity));
    }

    function zoomPan() {
        if (d3.event && d3.event.sourceEvent.type === 'dblclick') {
            if (!dblclickEnabled) return;
        }
        var fast = (d3.event.scale === projection.scale());
        projection
            .translate(d3.event.translate)
            .scale(d3.event.scale);
        if (fast) {
            if (!translateStart) translateStart = d3.event.translate.slice();
            var a = d3.event.translate,
                b = translateStart;
            surface.style(transformProp,
                'translate3d(' + ~~(a[0] - b[0]) + 'px,' + ~~(a[1] - b[1]) + 'px, 0px)');
        } else {
            redraw();
            translateStart = null;
        }
    }

    function resetTransform() {
        if (!surface.style(transformProp)) return;
        translateStart = null;
        surface.style(transformProp, '');
        redraw();
    }

    function redraw() {
        if (!dragging) {
            dispatch.move(map);
            tilegroup.call(background);
        }
        if (map.zoom() > 16) {
            connection.loadTiles(projection);
            drawVector(dragging);
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

    map.dblclickEnable = function(_) {
        if (!arguments.length) return dblclickEnabled;
        dblclickEnabled = _;
        return map;
    };

    map.dragEnable = function(_) {
        if (!arguments.length) return dragEnabled;
        dragEnabled = _;
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
                t[1] - ll[1] + (c[1] /2)]);
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

    map.selectEntity = function(entity) {
        selection = entity.id;
        d3.select('.inspector-wrap')
            .style('display', 'block')
            .datum(history.graph().fetch(entity.id))
            .call(inspector);
        redraw();
    };

    map.background = background;
    map.projection = projection;
    map.redraw = redraw;

    return d3.rebind(map, dispatch, 'on', 'move');
};
