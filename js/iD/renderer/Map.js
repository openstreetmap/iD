iD.Map = function(elem) {

    if (!iD.supported()) {
        elem.innerHTML = 'This editor is supported in Firefox, Chrome, Safari, Opera, ' +
            'and Internet Explorer 9 and above. Please upgrade your browser ' +
            'or use Potlatch 2 to edit the map.';
        elem.style.cssText = 'text-align:center;font-style:italic;';
        return;
    }

    var version = 0;

    var map = {},
        width, height,
        dispatch = d3.dispatch('move'),
        // data
        graph = new iD.Graph(),
        connection = new iD.Connection(graph);
        inspector = iD.Inspector(graph),
        parent = d3.select(elem),
        selection = [],
        projection = d3.geo.mercator()
            .scale(512).translate([512, 512]),
        // behaviors
        zoombehavior = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale())
            .scaleExtent([256, 134217728])
            .on('zoom', zoomPan),
        dragbehavior = d3.behavior.drag()
            .origin(function(d) {
                var p = projection(d);
                return { x: p[0], y: p[1] };
            })
            .on('drag', function dragmove(d) {
                d3.select(this).attr('transform', function() {
                    return 'translate(' + d3.event.x + ',' + d3.event.y + ')';
                });
                var ll = projection.invert([d3.event.x, d3.event.y]);
                d.lon = ll[0];
                d.lat = ll[1];
                drawVector();
            }),
        // geo
        linegen = d3.svg.line()
            .x(function(d) {
                var node = connection.graph.index[d][version];
                return projection([node.lon, node.lat])[0];
            })
            .y(function(d) {
                var node = connection.graph.index[d][version];
                return projection([node.lon, node.lat])[1];
            }),
        // Abstract linegen so that it pulls from `.children`. This
        // makes it possible to call simply `.attr('d', nodeline)`.
        nodeline = function(d) {
            return linegen(d.children);
        },
        // Abstract a key function that looks for uids. This is given
        // as a second argument to `.data()`.
        key = function(d) { return d.uid; };

    // Creating containers
    // -------------------
    // The map uses SVG groups in order to restrict
    // visual and event ordering - fills below casings, casings below
    // strokes, and so on.
    var surface = parent.append('svg')
        .call(zoombehavior);

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

    var fill_g = r.append('g'),
        casing_g =  r.append('g'),
        stroke_g = r.append('g'),
        text_g = r.append('g'),
        hit_g = r.append('g'),
        elastic = r.append('g');

    var class_stroke = augmentSelect(iD.Style.styleClasses('stroke')),
        class_fill = augmentSelect(iD.Style.styleClasses('stroke')),
        class_area = augmentSelect(iD.Style.styleClasses('area')),
        class_marker = augmentSelect(iD.Style.styleClasses('marker')),
        class_casing = augmentSelect(iD.Style.styleClasses('casing'));

    var tileclient = iD.Tiles(tilegroup, projection);

    function drawVector() {
        var all = graph.intersects(version, getExtent());

        var ways = all.filter(function(a) {
                return a.type === 'way' && !a.isClosed();
            }).sort(iD.Style.waystack),
            areas = all.filter(function(a) {
                return a.type === 'way' && a.isClosed();
            }),
            points = all.filter(function(a) {
                return a.type === 'node';
            });

        var fills = fill_g.selectAll('path.area').data(areas, key),
            casings = casing_g.selectAll('path.casing').data(ways, key),
            strokes = stroke_g.selectAll('path.stroke').data(ways, key),
            markers = hit_g.selectAll('image.marker')
                .data(points.filter(iD.markerimage), key);

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
            .attr('d', nodeline)
            .attr('class', class_casing);

        // Strokes
        strokes.exit().remove();
        strokes.enter().append('path')
            .on('click', selectClick);
        strokes.order()
            .attr('d', nodeline)
            .attr('class', class_stroke);

        // Markers
        markers.exit().remove();
        markers.enter().append('image')
            .attr('class', class_marker)
            .on('click', selectClick)
            .attr({ width: 16, height: 16 })
            .attr('xlink:href', iD.markerimage)
            .call(dragbehavior);
        markers.attr('transform', function(d) {
                return 'translate(' + projection([d.lon, d.lat]) + ')';
            });

        if (selection.length) {
            var uid = selection[0];
            var active_entity = all.filter(function(a) {
                return a.uid === uid && a.entityType === 'way';
            });

            var handles = hit_g.selectAll('circle.handle')
            .data(active_entity.length ? active_entity[0].children : [], key);

            handles.exit().remove();

            handles.enter().append('circle')
                .attr('class', 'handle')
                .attr('r', 5)
                .call(dragbehavior);
            handles.attr('transform', function(d) {
                return 'translate(' + projection(d) + ')';
            });
        }
    }

    function setSize(w, h) {
        width = w;
        height = h;
        surface.attr({ width: width, height: height });
        surface.selectAll('#clip-rect').attr({ width: width, height: height });
        tileclient.setSize(width, height);
    }

    var download = _.debounce(function() {
        connection.loadFromAPI(getExtent(), drawVector);
    }, 1000);

    function deselectClick() {
        selection = [];
        drawVector();
        d3.select('.inspector-wrap').style('display', 'none');
        d3.event.stopPropagation();
    }

    function selectClick(d) {
        selection = [d.uid];
        drawVector();
        d3.select('.inspector-wrap')
        .style('display', 'block')
        .datum(d).call(inspector);
        d3.event.stopPropagation();
    }

    // This is an unfortunate hack that should be improved.
    function augmentSelect(fn) {
        return function(d) {
            var c = fn(d);
            if (selection.indexOf(d.uid) !== -1) {
                c += ' active';
            }
            return c;
        };
    }

    function zoomPan() {
        projection
            .translate(d3.event.translate)
            .scale(d3.event.scale);
        redraw();
    }

    function redraw() {
        dispatch.move(map);
        tileclient.redraw();
        if (getZoom() > 13) {
            download();
            drawVector();
        } else {
        }
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

        drawVector();
        redraw();
        return map;
    }

    function zoomIn() { return setZoom(Math.ceil(getZoom() + 1)); }
    function zoomOut() { return setZoom(Math.floor(getZoom() - 1)); }

    function getCenter() {
        var ll = projection.invert([
            width / 2,
            height / 2]);
        return {
            lon: ll[0],
            lat: ll[1]
        };
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

    map.graph = graph;

    setSize(
        parent.node().offsetWidth,
        parent.node().offsetHeight);
    redraw();
    return d3.rebind(map, dispatch, 'on');
};
