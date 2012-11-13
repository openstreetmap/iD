iD.Map = function(elem) {

    if (!iD.supported()) {
        elem.innerHTML = 'This editor is supported in Firefox, Chrome, Safari, Opera, ' +
            'and Internet Explorer 9 and above. Please upgrade your browser ' +
            'or use Potlatch 2 to edit the map.';
        elem.style.cssText = 'text-align:center;font-style:italic;';
        return;
    }

    // lon/lat object to array
    function ll2a(o) {
        return [o.lon, o.lat];
    }

    // array to lon/lat object
    function a2ll(o) {
        return { lon: o[0], lat: o[1] };
    }

    var map = {},
        width, height,
        dispatch = d3.dispatch('move', 'update'),
        // data
        history = iD.History(),
        connection = iD.Connection(),
        inspector = iD.Inspector(history),
        parent = d3.select(elem),
        selection = null,
        projection = d3.geo.mercator()
            .scale(512).translate([512, 512]),
        // behaviors
        zoombehavior = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale())
            .scaleExtent([256, 134217728])
            .on('zoom', zoomPan),

        // this is used with handles
        dragbehavior = d3.behavior.drag()
            .origin(function(entity) {
                var p = projection(ll2a(entity));
                return { x: p[0], y: p[1] };
            })
            .on('dragstart', function() {
                history.operate(iD.operations.noop());
            })
            .on('drag', function(entity) {
                var to = projection.invert([d3.event.x, d3.event.y]);
                history.replace(iD.operations.move(entity, to));
                drawVector();
            })
            .on('dragend', function() {
                map.update();
            }),
        // geo
        linegen = d3.svg.line()
            .defined(function(d) {
                return !!history.entity(d);
            })
            .x(function(d) {
                return projection(ll2a(history.entity(d)))[0];
            })
            .y(function(d) {
                return projection(ll2a(history.entity(d)))[1];
            }),
        // Abstract linegen so that it pulls from `.children`. This
        // makes it possible to call simply `.attr('d', nodeline)`.
        nodeline = function(d) {
            return linegen(d.nodes);
        },
        key = function(d) { return d.id; };

    // Containers
    // ----------
    // The map uses SVG groups in order to restrict
    // visual and event ordering - fills below casings, casings below
    // strokes, and so on.
    var surface = parent.append('svg').call(zoombehavior);

    surface.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('id', 'clip-rect')
        .attr({ x: 0, y: 0 });

    var tilegroup = surface.append('g')
        .attr('clip-path', 'url(#clip)')
        .on('click', deselectClick),
    r = surface.append('g')
        .attr('clip-path', 'url(#clip)');

    var fill_g = r.append('g').attr('id', 'fill-g'),
        casing_g = r.append('g').attr('id', 'casing-g'),
        stroke_g = r.append('g').attr('id', 'stroke-g'),
        text_g = r.append('g').attr('id', 'text-g'),
        hit_g = r.append('g').attr('id', 'hit-g'),
        temp = r.append('g').attr('id', 'temp-g');

    var class_stroke = iD.Style.styleClasses('stroke'),
        class_fill = iD.Style.styleClasses('stroke'),
        class_area = iD.Style.styleClasses('area'),
        class_marker = iD.Style.styleClasses('marker'),
        class_casing = iD.Style.styleClasses('casing');

    var tileclient = iD.Tiles(tilegroup, projection);

    function drawVector() {
        var graph = history.graph(),
            all = graph.intersects(getExtent());

        var ways = [], areas = [], points = [];

        var active_entity = null;
        var selected_id = selection;

        for (var i = 0; i < all.length; i++) {
            var a = all[i];
            if (a.id === selected_id) active_entity = a;
            if (a.type === 'way') {
                a._line = nodeline(a);
                if (!iD.Way.isClosed(a)) {
                    ways.push(a);
                } else {
                    areas.push(a);
                }
            } else if (a._poi) {
                points.push(a);
            }
        }

        function classActive(d) {
            return d.id === selected_id;
        }

        var fills = fill_g.selectAll('path.area').data(areas, key),
            casings = casing_g.selectAll('path.casing').data(ways, key),
            strokes = stroke_g.selectAll('path.stroke').data(ways, key),
            markers = hit_g.selectAll('g.marker').data(points, key);

        // Fills
        fills.exit().remove();
        fills.enter().append('path')
            .on('click', selectClick);
        fills.attr('d', nodeline)
            .attr('class', class_area);

        // Casings
        casings.exit().remove();
        casings.enter().append('path');
        casings.order()
            .attr('d', function(d) { return d._line; })
            .attr('class', class_casing)
            .classed('active', classActive);

        // Strokes
        strokes.exit().remove();
        strokes.enter().append('path')
            .on('click', selectClick);
        strokes.order()
            .attr('d', function(d) { return d._line; })
            .attr('class', class_stroke)
            .classed('active', classActive);

        // Markers
        markers.exit().remove();
        var marker = markers.enter().append('g')
            .attr('class', 'marker')
            .on('click', selectClick)
            .call(dragbehavior);
        marker.append('circle')
            .attr('r', 10)
            .attr('cx', 8)
            .attr('cy', 8);
        marker.append('image')
            .attr({ width: 16, height: 16 })
            .attr('xlink:href', iD.Style.markerimage);
        markers.classed('active', classActive)
            .attr('transform', function(d) {
            var pt = projection([d.lon, d.lat]);
            pt[0] -= 8;
            pt[1] -= 8;
            return 'translate(' + pt + ')';
        });

        var handles = hit_g.selectAll('circle.handle')
            .data(active_entity ? graph.fetch(active_entity.id).nodes : []);

        handles.exit().remove();
        handles.enter().append('circle')
            .attr('class', 'handle')
            .attr('r', 5)
            .call(dragbehavior);
        handles.attr('transform', function(entity) {
            return 'translate(' + projection(ll2a(entity)) + ')';
        });
    }

    function setSize(w, h) {
        width = w;
        height = h;
        surface.attr({ width: width, height: height });
        surface.selectAll('#clip-rect').attr({ width: width, height: height });
        tileclient.setSize(width, height);
    }

    var download = _.debounce(function() {
        connection.bboxFromAPI(getExtent(), function (result) {
            if (result instanceof Error) {
                // TODO: handle
            } else {
                history.merge(result);
                drawVector();
            }
        });
    }, 1000);

    function deselectClick() {
        selection = null;
        drawVector();
        d3.select('.inspector-wrap').style('display', 'none');
        d3.event.stopPropagation();
    }

    function selectClick(d) {
        if (selection === d.id) return;
        selection = d.id;
        drawVector();
        d3.select('.inspector-wrap')
            .style('display', 'block')
            .datum(d).call(inspector);
        d3.event.stopPropagation();
    }

    inspector.on('change', function(d, tags) {
        map.operate(iD.operations.changeTags(d, tags));
    });

    inspector.on('remove', function(d) {
        map.operate(iD.operations.remove(d));
    });

    function zoomPan() {
        projection
            .translate(d3.event.translate)
            .scale(d3.event.scale);
        redraw();
        download();
    }

    function redraw() {
        dispatch.move(map);
        tileclient.redraw();
        if (getZoom() > 13) {
            download();
            drawVector();
        } else {
            // TODO: hide vector features
        }
    }

    // UI elements
    // -----------
    var undolabel = d3.select('button#undo small');
    dispatch.on('update', function() {
        undolabel.text(history.graph().annotation);
        redraw();
    });

    function _do(operation) {
        history.operate(operation);
        map.update();
    }

    // Undo/redo
    function undo() {
        history.undo();
        map.update();
    }

    function redo() {
        history.redo();
        map.update();
    }

    // Getters & setters for map state
    // -------------------------------
    // The map state can be expressed entirely as the combination
    // of a centerpoint and a zoom level. Zoom levels are floating-point
    // values, and we express lat, lon points as `{ lat, lon }` objects.
    function getExtent() {
        return [
            projection.invert([0, 0]),
            projection.invert([width, height])];
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
        var s = projection.scale();
        return Math.max(Math.log(s) / Math.log(2) - 7, 0);
    }

    function setZoom(zoom) {
        // summary:	Redraw the map at a new zoom level.
        var scale = 256 * Math.pow(2, zoom - 1);
        var l = pointLocation([width / 2, height / 2]);
        projection.scale(scale);
        zoombehavior.scale(projection.scale());

        var t = projection.translate();
        l = locationPoint(l);
        t[0] += (width / 2) - l[0];
        t[1] += (height / 2) - l[1];
        projection.translate(t);
        zoombehavior.translate(projection.translate());

        drawVector();
        redraw();
        return map;
    }

    function zoomIn() { return setZoom(Math.ceil(getZoom() + 1)); }
    function zoomOut() { return setZoom(Math.floor(getZoom() - 1)); }

    function getCenter() {
        return a2ll(projection.invert([
            width / 2,
            height / 2]));
    }

    function setCenter(loc) {
        // summary:		Update centre and bbox to a specified lat/lon.
        var t = projection.translate(),
        ll = projection([loc.lon, loc.lat]);
        projection.translate([
            t[0] - ll[0] + width / 2,
            t[1] - ll[1] + height / 2]);
        zoombehavior.translate(projection.translate());
        redraw();
        return map;
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

    map.connection = connection;
    map.projection = projection;
    map.setSize = setSize;

    map.history = history;
    map.surface = surface;

    map.operate = _do;
    map.undo = undo;
    map.redo = redo;

    map.redraw = redraw;

    setSize(parent.node().offsetWidth, parent.node().offsetHeight);
    redraw();

    return d3.rebind(map, dispatch, 'on', 'move', 'update');
};
