// iD/renderer/Map.js
// at present this combines P2's Map and MapPaint functionality

// ----------------------------------------------------------------------
// Connection base class

iD.Map = function(obj) {
    var map = {},
        selection = [],
        width = obj.width || 800,
        height = obj.height || 400,
        controller = iD.Controller(),
        projection = d3.geo.mercator()
            .scale(512).translate([512, 512]),
        connection = obj.connection,
        layers = {};

    var inspector = iD.Inspector();

    var tagclasses = [
        'highway', 'railway', 'motorway', 'amenity', 'landuse', 'building', 'bridge'];

    var linegen = d3.svg.line()
        .x(function(d) { return projection(d)[0]; })
        .y(function(d) { return projection(d)[1]; });

    var zoombehavior = d3.behavior.zoom()
        .translate(projection.translate())
        .scale(projection.scale())
        .scaleExtent([256, 134217728]);

    var dragbehavior = d3.behavior.drag()
        .origin(function(d) {
            var p = projection(d);
            return { x: p[0], y: p[1] };
        })
        .on("drag", dragmove);

   // http://bl.ocks.org/1557377
   function dragmove(d) {
      d3.select(this).attr('transform', function() {
          return 'translate(' + d3.event.x + ',' + d3.event.y + ')';
      });
      var ll = projection.invert([d3.event.x, d3.event.y]);
      d[0] = ll[0];
      d[1] = ll[1];
      drawVector();
    }

    zoombehavior.on('zoom', redraw);

    var surface = d3.selectAll(obj.selector)
        .append('svg')
        .attr({ width: width, height: width })
        .call(zoombehavior).on('dblclick', function() {
            // TODO: round zooms
            /*
            var s = projection.scale();
            projection.scale(Math.round(Math.max(Math.log(s) / Math.log(2) - 7, 0)));
            */
        });

    var defs = surface.append('defs');

    var clipPath = defs.append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('id', 'clip-rect')
        .attr({ x: 0, y: 0 })
        .attr({ width: width, height: height });

    var tilegroup = surface.append('g')
            .attr('clip-path', 'url(#clip)')
            .on('click', deselectClick),
        container = surface.append('g')
            .attr('clip-path', 'url(#clip)');

   var r = container.append('g');

   layers[0] = {
       root: r,
       fill: r.append('g'),
       casing: r.append('g'),
       stroke: r.append('g'),
       text: r.append('g'),
       hit: r.append('g')
   };

    var elastic = container.append('g');

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

    function classes(pre) {
        return function(d) {
            var tags = d.tags;
            var c = [pre];
            function clean(x) {
                return tagclasses.indexOf(x) !== -1;
            }
            for (var k in tags) {
                if (!clean(k)) continue;
                c.push(k + '-' + tags[k]);
                c.push(k);
            }
            if (selection.indexOf(d._id) !== -1) {
                c.push('active');
            }
            return c.join(' ');
        };
    }

    var icons = {
        tourism: ['hotel'],
        shop: [
            'convenience',
            'supermarket'],
        amenity:
            [
            'atm',
            'bank',
            'cafe',
            'pub',
            'place',
            'parking',
            'bicycle_parking',
            'pharmacy',
            'pharmacy',
            'police',
            'post_box',
            'recycling',
            'restaurant',
            'school',
            'taxi',
            'telephone']
    };

    function markerimage(d) {
        for (var k in icons) {
            if (d.tags[k] && icons[k].indexOf(d.tags[k]) !== -1) {
                return 'icons/' + d.tags[k] + '.png';
            }
        }
    }

    function deselectClick() {
        selection = [];
        drawVector();
        d3.event.stopPropagation();
        d3.select('.inspector-wrap').style('display', 'none');
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
        return linegen(d.nodes);
    }

    var highway_stack = [
        'motorway',
        'motorway_link',
        'trunk',
        'trunk_link',
        'primary',
        'primary_link',
        'secondary',
        'tertiary',
        'unclassified',
        'residential',
        'service',
        'footway'
    ];

    function waystack(a, b) {
        if (!a || !b) return 0;
        if (a.tags.layer !== undefined && b.tags.layer !== undefined) {
            return a.tags.layer - b.tags.layer;
        }
        if (a.tags.bridge) return 1;
        if (b.tags.bridge) return -1;
        var as = 0, bs = 0;
        if (a.tags.highway && b.tags.highway) {
            as -= highway_stack.indexOf(a.tags.highway);
            bs -= highway_stack.indexOf(b.tags.highway);
        }
        return as - bs;
    }

    function drawVector() {
        var all = connection.intersects(extent());

        var ways = all.filter(function(a) {
                return a.entityType === 'way' && !a.isClosed();
            }).sort(waystack),
            areas = all.filter(function(a) {
                return a.entityType === 'way' && a.isClosed();
            }),
            points = all.filter(function(a) {
                return a.entityType === 'node';
            });

        var fills = layers[0].fill.selectAll('path.area')
                .data(areas, key),
            casings = layers[0].casing.selectAll('path.casing')
                .data(ways, key),
            strokes = layers[0].stroke.selectAll('path.stroke')
                .data(ways, key),
            markers = layers[0].hit.selectAll('image.marker')
                .data(points.filter(markerimage), key);

        var _id = selection[0];
        var active_entity = all.filter(function(a) {
            return a._id === _id && a.entityType === 'way';
        });

        var handles = layers[0].hit.selectAll('circle.handle')
            .data(active_entity.length ? active_entity[0].nodes : [], key);

        handles.exit().remove();
        fills.exit().remove();
        markers.exit().remove();
        casings.exit().remove();
        strokes.exit().remove();

        fills.enter().append('path')
            .on('click', selectClick);

        fills.attr('d', nodeline)
            .attr('class', classes('area'));

        casings.enter().append('path');
        casings.order()
            .attr('d', nodeline)
            .attr('class', classes('casing'));

        strokes.enter().append('path')
            .on('click', selectClick);

        strokes.order()
            .attr('d', nodeline)
            .attr('class', classes('stroke'));

        markers.enter().append('image')
            .attr('class', classes('marker'))
            .on('click', selectClick)
            .attr({ width: 16, height: 16 })
            .attr('xlink:href', markerimage);

        markers
            .attr('transform', function(d) {
                return 'translate(' + projection(d) + ')';
            });

        handles.enter().append('circle')
            .attr('class', 'handle')
            .attr('r', 5)
            .call(dragbehavior);
        handles.attr('transform', function(d) {
            return 'translate(' + projection(d) + ')';
        });
    }

    function zoomIn() {
        return setZoom(getZoom() + 1);
    }

    function zoomOut() {
        return setZoom(getZoom() - 1);
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

    function tilesForView() {
        var t = projection.translate(),
            s = projection.scale(),
            z = Math.max(Math.log(s) / Math.log(2) - 8, 0);
            rz = Math.floor(z),
            ts = 256 * Math.pow(2, z - rz);

        // This is the 0, 0 px of the projection
        var tile_origin = [s / 2 - t[0], s / 2 - t[1]],
            coords = [],
            cols = d3.range(Math.max(0, Math.floor((tile_origin[0] - width) / ts)),
            Math.max(0, Math.ceil((tile_origin[0] + width) / ts))),
            rows = d3.range(Math.max(0, Math.floor((tile_origin[1] - height) / ts)),
            Math.max(0, Math.ceil((tile_origin[1] + height) / ts)));

        cols.forEach(function(x) {
            rows.forEach(function(y) { coords.push([Math.floor(z), x, y]); });
        });
        return coords;
    }

    function tileUrl(coord) {
        var tmpl = 'http://ecn.t0.tiles.virtualearth.net/tiles/a$quadkey.jpeg?g=587&mkt=en-gb&n=z';
        var u = '';
        for (var zoom = coord[0]; zoom > 0; zoom--) {
            var byte = 0;
            var mask = 1 << (zoom - 1);
            if ((coord[1] & mask) !== 0) byte++;
            if ((coord[2] & mask) !== 0) byte += 2;
            u += byte.toString();
        }
        return tmpl.replace('$quadkey', u);
    }

    function redraw() {
        if (d3.event) {
            projection
              .translate(d3.event.translate)
              .scale(d3.event.scale);
        }

        var t = projection.translate(),
            s = projection.scale(),
            z = Math.max(Math.log(s) / Math.log(2) - 8, 0);
            rz = Math.floor(z),
            ts = 256 * Math.pow(2, z - rz);

        // This is the 0, 0 px of the projection
        var tile_origin = [s / 2 - t[0], s / 2 - t[1]],
            coords = tilesForView();

        var tiles = tilegroup.selectAll('image.tile')
            .data(coords, function(d) { return d.join(','); });

        tiles.exit().remove();
        tiles.enter().append('image')
            .attr('class', 'tile')
            .attr('xlink:href', tileUrl);
        tiles.attr({ width: ts, height: ts })
            .attr('transform', function(d) {
                return 'translate(' + [(d[1] * ts) - tile_origin[0], (d[2] * ts) - tile_origin[1]] + ')';
            });
        drawVector();
        download();
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

    map.getZoom = getZoom;
    map.setZoom = setZoom;
    map.zoomIn = zoomIn;
    map.zoomOut = zoomOut;

    map.connection = connection;
    map.controller = controller;
    map.projection = projection;

    redraw();
    return map;
};
