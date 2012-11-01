// iD/renderer/Map.js
// at present this combines P2's Map and MapPaint functionality

// ----------------------------------------------------------------------
// Connection base class

iD.Map = function(parentSelector) {
    var graph = new iD.Graph(),
        connection = new iD.Connection(graph);
        map = {},
        parent = d3.selectAll(parentSelector),
        selection = [],
        width = parent.node().offsetWidth,
        height = parent.node().offsetHeight,
        projection = d3.geo.mercator()
            .scale(512).translate([512, 512]),
        dispatch = d3.dispatch('move');

    var zoombehavior = d3.behavior.zoom()
            .translate(projection.translate())
            .scale(projection.scale())
            .scaleExtent([256, 134217728]),
        dragbehavior = d3.behavior.drag()
            .origin(function(d) {
                var p = projection(d);
                return { x: p[0], y: p[1] };
            })
            .on("drag", dragmove);

    var inspector = iD.Inspector(graph);

    var linegen = d3.svg.line()
        .x(function(d) {
            var node = connection.graph.index[d];
            return projection([node.lon, node.lat])[0];
        })
        .y(function(d) {
            var node = connection.graph.index[d];
            return projection([node.lon, node.lat])[1];
        });

   // http://bl.ocks.org/1557377
   function dragmove(d) {
        d3.select(this).attr('transform', function() {
            return 'translate(' + d3.event.x + ',' + d3.event.y + ')';
        });
        var ll = projection.invert([d3.event.x, d3.event.y]);
        d.lon = ll[0];
        d.lat = ll[1];
        drawVector();
    }

    zoombehavior.on('zoom', redraw);

    var surface = parent.append('svg')
        .call(zoombehavior);

    var defs = surface.append('defs');

    var clipPath = defs.append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('id', 'clip-rect')
        .attr({ x: 0, y: 0 });

    var tilegroup = surface.append('g')
            .attr('clip-path', 'url(#clip)')
            .on('click', deselectClick),
        r = surface.append('g')
            .attr('clip-path', 'url(#clip)');

   var tileclient = iD.Tiles(tilegroup, projection, width, height);

    function setSize(width, height) {
        surface.attr({ width: width, height: height });
        clipPath.attr({ width: width, height: height });
        tileclient.setSize(width, height);
    }

   var fill_g = r.append('g'),
       casing_g =  r.append('g'),
       stroke_g = r.append('g'),
       text_g = r.append('g'),
       hit_g = r.append('g'),
       elastic = r.append('g');

    var download = _.debounce(function() {
        connection.loadFromAPI(extent(), drawVector);
    }, 1000);

    function extent() {
        return [
            projection.invert([0, 0]),
            projection.invert([width, height])];
    }

    function select(d) {
        selection = [d._id];
    }

    function key(d) { return d._id; }

    function deselectClick() {
        selection = [];
        drawVector();
        d3.select('.inspector-wrap').style('display', 'none');
        d3.event.stopPropagation();
    }

    function selectClick(d) {
        select(d);
        drawVector();
        d3.select('.inspector-wrap')
            .style('display', 'block')
            .datum(d).call(inspector);
        d3.event.stopPropagation();
    }

    function nodeline(d) {
        return linegen(d.children);
    }

    // This is an unfortunate hack that should be improved.
    function augmentSelect(fn) {
        return function(d) {
            var c = fn(d);
            if (selection.indexOf(d._id) !== -1) {
                c += ' active';
            }
            return c;
        };
    }

    var class_stroke = augmentSelect(iD.Style.styleClasses('stroke')),
        class_fill =   augmentSelect(iD.Style.styleClasses('stroke')),
        class_area =   augmentSelect(iD.Style.styleClasses('area')),
        class_marker = augmentSelect(iD.Style.styleClasses('marker')),
        class_casing = augmentSelect(iD.Style.styleClasses('casing'));

    function drawVector() {
        var all = connection.intersects(extent());

        var ways = all.filter(function(a) {
                return a.type === 'way' && !a.isClosed();
            }).sort(iD.Style.waystack),
            areas = all.filter(function(a) {
                return a.type === 'way' && a.isClosed();
            }),
            points = all.filter(function(a) {
                return a.type === 'node';
            });

        var fills = fill_g.selectAll('path.area')
                .data(areas, key),
            casings = casing_g.selectAll('path.casing')
                .data(ways, key),
            strokes = stroke_g.selectAll('path.stroke')
                .data(ways, key),
            markers = hit_g.selectAll('image.marker')
                .data(points.filter(iD.markerimage), key);

        if (selection.length) {
            var _id = selection[0];
            var active_entity = all.filter(function(a) {
                return a._id === _id && a.entityType === 'way';
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

        fills.exit().remove();
        markers.exit().remove();
        casings.exit().remove();
        strokes.exit().remove();

        fills.enter().append('path')
            .on('click', selectClick);

        fills.attr('d', nodeline)
            .attr('class', class_area);

        casings.enter().append('path');
        casings.order()
            .attr('d', nodeline)
            .attr('class', class_casing);

        strokes.enter().append('path')
            .on('click', selectClick);

        strokes.order()
            .attr('d', nodeline)
            .attr('class', class_stroke);

        markers.enter().append('image')
            .attr('class', class_marker)
            .on('click', selectClick)
            .attr({ width: 16, height: 16 })
            .attr('xlink:href', iD.markerimage)
            .call(dragbehavior);

        markers
            .attr('transform', function(d) {
                return 'translate(' + projection(d) + ')';
            });
    }

    function getZoom(zoom) {
        var s = projection.scale();
        return Math.max(Math.log(s) / Math.log(2) - 7, 0);
    }

    function setZoom(zoom) {
        // summary:	Redraw the map at a new zoom level.
        projection.scale(256 * Math.pow(2, zoom - 1));
        zoombehavior.scale(projection.scale());
        drawVector();
        redraw();
        return map;
    }

    function zoomIn() { return setZoom(getZoom() + 1); }
    function zoomOut() { return setZoom(getZoom() - 1); }

    function redraw() {
        if (d3.event) {
            projection
              .translate(d3.event.translate)
              .scale(d3.event.scale);
        }
        dispatch.move(map);
        tileclient.redraw();
        drawVector();
        download();
    }

    function getCenter() {
        var ll = projection.invert([
            width / 2,
            height / 2]);
        return {
            lon: ll[0],
            lat: ll[1]
        };
    }

    function setCentre(loc) {
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
    map.extent = extent;

    map.setCentre = setCentre;
    map.setCenter = setCentre;
    map.getCentre = getCenter;
    map.getCenter = getCenter;

    map.getZoom = getZoom;
    map.setZoom = setZoom;
    map.zoomIn = zoomIn;
    map.zoomOut = zoomOut;

    map.connection = connection;
    map.projection = projection;
    map.setSize = setSize;

    setSize(width, height);
    redraw();
    return d3.rebind(map, dispatch, 'on');
};
