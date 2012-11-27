iD.Map = function(elem, connection) {

    var map = {},
        dimensions = [],
        dispatch = d3.dispatch('move', 'update'),
        history = iD.History(),
        inspector = iD.Inspector(),
        parent = d3.select(elem),
        selection = null,
        translateStart,
        apiTilesLoaded = {},
        projection = d3.geo.mercator()
            .scale(512).translate([512, 512]),
        zoom = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale())
            .scaleExtent([256, 134217728])
            .on('zoom', zoomPan),
        only,
        dragbehavior = d3.behavior.drag()
            .origin(function(entity) {
                var p = projection(ll2a(entity));
                only = iD.Util.trueObj([entity.id].concat(
                    _.pluck(history.graph().parents(entity.id), 'id')));
                return { x: p[0], y: p[1] };
            })
            .on('dragstart', function() {
                history.perform(iD.actions.noop());
            })
            .on('drag', function(entity) {
                var to = projection.invert([d3.event.x, d3.event.y]);
                history.replace(iD.actions.move(entity, to));
                redraw(only);
            })
            .on('dragend', update),
        nodeline = function(d) {
            return 'M' + d.nodes.map(ll2a).map(projection).map(roundCoords).join('L');
        },
        key = function(d) { return d.id; },
        messages = d3.select('.messages'),

        // Containers
        // ----------
        // The map uses SVG groups in order to restrict
        // visual and event ordering - fills below casings, casings below
        // strokes, and so on.
        //
        // div (supersurface)
        //   svg (surface)
        //     defs
        //       rect#clip
        //       path (textPath data)
        //     g (tilegroup)
        //     r (vector root)
        //       g (fill, casing, stroke, text, hit, temp)
        //         (path, g, marker, etc)
        supersurface = parent.append('div').call(zoom),
        surface = supersurface.append('svg'),
        defs = surface.append('defs'),
        tilegroup = surface.append('g')
            .on('click', deselectClick),
        r = surface.append('g')
            .on('click', selectClick)
            .attr('clip-path', 'url(#clip)'),
        // TODO: reduce repetition
        fill_g = r.append('g').attr('id', 'fill-g'),
        casing_g = r.append('g').attr('id', 'casing-g'),
        stroke_g = r.append('g').attr('id', 'stroke-g'),
        text_g = r.append('g').attr('id', 'text-g'),
        hit_g = r.append('g').attr('id', 'hit-g'),
        temp = r.append('g').attr('id', 'temp-g'),
        // class generators
        class_stroke = iD.Style.styleClasses('stroke'),
        class_fill = iD.Style.styleClasses('stroke'),
        class_area = iD.Style.styleClasses('area'),
        class_marker = iD.Style.styleClasses('marker'),
        class_casing = iD.Style.styleClasses('casing'),
        // For one-way roads, find the length of a triangle
        alength = (function() {
            var arrow = surface.append('text').text('►');
            var alength = arrow.node().getComputedTextLength();
            arrow.remove();
            return alength;
        })(),
        prefix = prefixMatch(['webkit', 'ms', 'Moz', 'O']),
        transformProp = prefix + 'transform';

    defs.append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('id', 'clip-rect')
        .attr({ x: 0, y: 0 });

    var tileclient = iD.Tiles(tilegroup, projection);

    function prefixMatch(p) { // via mbostock
        var i = -1, n = p.length, s = document.body.style;
        while (++i < n) if (p[i] + 'Transform' in s) return '-' + p[i].toLowerCase() + '-';
        return '';
    }
    function ll2a(o) { return [o.lon, o.lat]; }
    function a2ll(o) { return { lon: o[0], lat: o[1] }; }
    function roundCoords(c) { return [Math.floor(c[0]), Math.floor(c[1])]; }

    function hideInspector() {
        d3.select('.inspector-wrap').style('display', 'none');
    }

    function classActive(d) { return d.id === selection; }
    function nameHoverIn(d) { messages.text(d.tags.name || '(unknown)'); }
    function nameHoverOut(d) { messages.text(''); }

    function nodeIntersect(entity, extent) {
        return entity.lon > extent[0][0] &&
            entity.lon < extent[1][0] &&
            entity.lat < extent[0][1] &&
            entity.lat > extent[1][1];
    }

    function drawVector(only) {
        if (surface.style(transformProp) != 'none') return;
        var z = getZoom(),
            all = [], ways = [], areas = [], points = [], waynodes = [],
            extent = getExtent(),
            graph = history.graph();

        if (!only) {
            all = graph.intersects(extent);
        } else {
            for (var id in only) all.push(graph.fetch(id));
        }

        var filter = only ?
            function(d) { return only[d.id]; } : function() { return true; };

        for (var i = 0; i < all.length; i++) {
            var a = all[i];
            if (a.type === 'way') {
                a._line = nodeline(a);
                if (!iD.Way.isClosed(a)) ways.push(a);
                else areas.push(a);
            } else if (a._poi) {
                points.push(a);
            } else if (!a._poi && a.type === 'node' && nodeIntersect(a, extent)) {
                waynodes.push(a);
            }
        }

        if (z > 18) { drawHandles(waynodes, filter); } else { hideHandles(); }
        if (z > 18) { drawCasings(ways, filter); } else { hideCasings(); }
        drawFills(areas, filter);
        drawStrokes(ways, filter);
        drawMarkers(points, filter);
    }

    function drawHandles(waynodes, filter) {
        var handles = hit_g.selectAll('rect.handle')
            .filter(filter)
            .data(waynodes, key);
        handles.exit().remove();
        handles.enter().append('rect')
            .attr({ width: 4, height: 4, 'class': 'handle' })
            .call(dragbehavior);
        handles.attr('transform', function(entity) {
            var p = projection(ll2a(entity));
            return 'translate(' + [~~p[0], ~~p[1]] + ') translate(-2, -2) rotate(45, 2, 2)';
        });
    }

    function hideHandles() { hit_g.selectAll('rect.handle').remove(); }
    function hideVector() {
        fill_g.selectAll('*').remove();
        stroke_g.selectAll('*').remove();
        casing_g.selectAll('*').remove();
        text_g.selectAll('*').remove();
        hit_g.selectAll('*').remove();
    }

    function drawFills(areas, filter) {
        var fills = fill_g.selectAll('path')
            .filter(filter)
            .data(areas, key);
        fills.exit().remove();
        fills.enter().append('path')
            .attr('class', class_area)
            .classed('active', classActive);
        fills
            .attr('d', function(d) { return d._line; })
            .attr('class', class_area)
            .classed('active', classActive);
    }

    function drawMarkers(points, filter) {
        var markers = hit_g.selectAll('g.marker')
            .filter(filter)
            .data(points, key);
        markers.exit().remove();
        var marker = markers.enter().append('g')
            .attr('class', 'marker')
            .on('mouseover', nameHoverIn)
            .on('mouseout', nameHoverOut)
            .call(dragbehavior);
        marker.append('circle')
            .attr({ r: 10, cx: 8, cy: 8 });
        marker.append('image')
            .attr({ width: 16, height: 16, 'xlink:href': iD.Style.markerimage });
        markers.attr('transform', function(d) {
                var pt = projection([d.lon, d.lat]);
                return 'translate(' + [~~pt[0], ~~pt[1]] + ') translate(-8, -8)';
            })
            .classed('active', classActive);
    }

    function drawStrokes(ways, filter) {
        var strokes = stroke_g.selectAll('path')
            .filter(filter)
            .data(ways, key);
        strokes.exit().remove();
        strokes.enter().append('path')
            .on('mouseover', nameHoverIn)
            .on('mouseout', nameHoverOut)
            .attr('class', class_stroke)
            .classed('active', classActive);
        strokes
            .order()
            .attr('d', function(d) { return d._line; })
            .attr('class', class_stroke)
            .classed('active', classActive);

        // Determine the lengths of oneway paths
        var lengths = {};
        var oneways = strokes
        .filter(function(d, i) {
            return d.tags.oneway && d.tags.oneway === 'yes';
        }).each(function(d, i) {
            lengths[d.id] = Math.floor(this.getTotalLength() / alength);
        }).data();

        var uses = defs.selectAll('path')
            .data(oneways, key);
        uses.exit().remove();
        uses.enter().append('path');
        uses
            .attr('id', function(d, i) { return 'shadow-' + d.id; })
            .attr('d', function(d) { return d._line; });

        var labels = text_g.selectAll('text')
            .data(oneways, key);
        labels.exit().remove();
        var tp = labels.enter()
            .append('text').attr({ 'class': 'oneway', dy: 4 })
            .append('textPath').attr('class', 'textpath');
        // why not just selectAll('textPath')?
        // https://bugs.webkit.org/show_bug.cgi?id=46800
        // https://bugs.webkit.org/show_bug.cgi?id=83438
        // https://github.com/mbostock/d3/issues/925
        text_g.selectAll('.textpath')
            .attr('letter-spacing', alength * 2)
            .attr('xlink:href', function(d, i) { return '#shadow-' + d.id; })
            .text(function(d, i) {
                return (new Array(Math.floor(lengths[d.id] / 2))).join('►');
            });
    }

    function drawCasings(ways, filter) {
        var casings = casing_g.selectAll('path')
            .filter(filter)
            .data(ways, key);
        casings.exit().remove();
        casings.enter().append('path')
            .on('mouseover', nameHoverIn)
            .on('mouseout', nameHoverOut)
            .attr('class', class_casing)
            .classed('active', classActive);
        casings
            .order()
            .attr('d', function(d) { return d._line; })
            .attr('class', class_casing)
            .classed('active', classActive);
    }

    function hideCasings() { casing_g.selectAll('path').remove(); }

    function setSize(x) {
        dimensions = x;
        var attr = { width: dimensions[0], height: dimensions[1] };
        surface.attr(attr).selectAll('#clip-rect').attr(attr);
        tileclient.setSize(dimensions);
        return map;
    }

    function tileAtZoom(t, distance) {
        var power = Math.pow(2, distance);
        return [
            Math.floor(t[0] * power),
            Math.floor(t[1] * power),
            t[2] + distance];
    }

    function tileAlreadyLoaded(c) {
        if (apiTilesLoaded[c]) return false;
        for (var i = 0; i < 4; i++) {
            if (apiTilesLoaded[tileAtZoom(c, -i)]) return false;
        }
        return true;
    }

    function apiTiles() {
        var t = projection.translate(),
            s = projection.scale(),
            z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
            rz = Math.floor(z),
            ts = 512 * Math.pow(2, z - rz),
            tile_origin = [s / 2 - t[0], s / 2 - t[1]],
            coords = [],
            cols = d3.range(Math.max(0, Math.floor(tile_origin[0] / ts)),
                            Math.max(0, Math.ceil((tile_origin[0] +  dimensions[0]) / ts))),
            rows = d3.range(Math.max(0, Math.floor(tile_origin[1] / ts)),
                            Math.max(0, Math.ceil((tile_origin[1] +  dimensions[1]) / ts)));

        cols.forEach(function(x) {
            rows.forEach(function(y) {
                coords.push([x, y, rz]);
            });
        });

        function apiExtentBox(c) {
            var x = (c[0] * ts) - tile_origin[0];
            var y = (c[1] * ts) - tile_origin[1];
            apiTilesLoaded[c] = true;
            return [
                projection.invert([x, y]),
                projection.invert([x + ts, y + ts])];
        }

        return coords.filter(tileAlreadyLoaded).map(apiExtentBox);
    }

    function apiRequestExtent(extent) {
        connection.bboxFromAPI(extent, function (result) {
            if (result instanceof Error) {
                // TODO: handle
            } else {
                history.merge(result);
                drawVector();
            }
        });
    }

    var download = _.debounce(function() {
        apiTiles().map(apiRequestExtent);
    }, 1000);

    function deselectClick() {
        var hadSelection = !!selection;
        selection = null;
        if (hadSelection) {
            redraw();
            hideInspector();
        }
    }

    function selectClick() {
        var entity = d3.select(d3.event.target).data();
        if (entity) entity = entity[0];
        if (!entity || selection === entity.id) return;
        selection = entity.id;
        d3.select('.inspector-wrap')
            .style('display', 'block')
            .datum(history.graph().fetch(entity.id)).call(inspector);
        redraw();
    }

    inspector.on('changeTags', function(d, tags) {
        map.perform(iD.actions.changeTags(d, tags));
    }).on('changeWayDirection', function(d, tags) {
        map.perform(iD.actions.changeWayDirection(d));
    }).on('remove', function(d) {
        map.perform(iD.actions.remove(d));
        hideInspector();
    }).on('close', function(d) {
        deselectClick();
        hideInspector();
    });

    function zoomPan() {
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

    surface.on('mouseup', function() {
        if (surface.style(transformProp)) {
            translateStart = null;
            surface.style(transformProp, '');
            redraw();
        }
    });

    function redraw(only) {
        if (!only) {
            dispatch.move(map);
            tileclient.redraw();
        }
        if (getZoom() > 16) {
            download();
            drawVector(only);
        } else {
            hideVector();
        }
    }

    function update() {
        map.update();
        redraw();
    }

    function perform(action) {
        history.perform(action);
        update();
    }

    function undo() {
        history.undo();
        update();
    }

    function redo() {
        history.redo();
        update();
    }

    function getExtent() {
        return [projection.invert([0, 0]), projection.invert(dimensions)];
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

    function getZoom(zoom) {
        return Math.max(Math.log(projection.scale()) / Math.log(2) - 7, 0);
    }

    function pxCenter() {
        return [dimensions[0] / 2, dimensions[0] / 2];
    }

    function setZoom(z) {
        // summary:	Redraw the map at a new zoom level.
        var scale = 256 * Math.pow(2, z - 1);
        var center = pxCenter();
        var l = pointLocation(center);
        projection.scale(scale);
        zoom.scale(projection.scale());

        var t = projection.translate();
        l = locationPoint(l);
        t[0] += center[0] - l[0];
        t[1] += center[1] - l[1];
        projection.translate(t);
        zoom.translate(projection.translate());

        redraw();
        return map;
    }

    function zoomIn() { return setZoom(Math.ceil(getZoom() + 1)); }
    function zoomOut() { return setZoom(Math.floor(getZoom() - 1)); }
    function getCenter() { return projection.invert(pxCenter()); }

    function setCenter(loc) {
        // summary:		Update centre and bbox to a specified lat/lon.
        var t = projection.translate(),
            center = pxCenter();
            ll = projection(loc);
        projection.translate([
            t[0] - ll[0] + center[0], t[1] - ll[1] + center[1]]);
        zoom.translate(projection.translate());
        redraw();
        return map;
    }

    function commit() {
        connection.putChangeset(history.changes());
    }

    map.download = download;
    map.getExtent = getExtent;

    map.selectClick = selectClick;

    map.setCenter = setCenter;
    map.setCentre = setCenter;
    map.getCentre = getCenter;
    map.getCenter = getCenter;

    map.getZoom = getZoom;
    map.setZoom = setZoom;
    map.zoomIn = zoomIn;
    map.zoomOut = zoomOut;

    map.projection = projection;
    map.setSize = setSize;

    map.history = history;
    map.surface = surface;

    map.perform = perform;
    map.undo = undo;
    map.redo = redo;

    map.redraw = redraw;

    map.commit = commit;

    setSize([parent.node().offsetWidth, parent.node().offsetHeight]);
    hideInspector();
    redraw();

    return d3.rebind(map, dispatch, 'on', 'move', 'update');
};
