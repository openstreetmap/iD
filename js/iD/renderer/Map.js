// iD/renderer/Map.js
// at present this combines P2's Map and MapPaint functionality

// ----------------------------------------------------------------------
// Connection base class

iD.renderer.Map = function(obj) {
    var map = {},
        selection = [],
        width = obj.width || 800,
        height = obj.height || 400,
        controller = iD.Controller(),
        projection = d3.geo.mercator()
            .scale(512).translate([512, 512]),
        connection = obj.connection,
        layers = {};

    var tagclasses = [
        'highway', 'railway', 'motorway', 'amenity', 'landuse', 'building', 'bridge'];

    var linegen = d3.svg.line()
        .x(function(d) { return projection(d)[0]; })
        .y(function(d) { return projection(d)[1]; });

    var zoombehavior = d3.behavior.zoom()
        .translate(projection.translate())
        .scale(projection.scale())
        .scaleExtent([256, 134217728]);

    zoombehavior.on('zoom', redraw);

    var surface = d3.selectAll(obj.selector)
        .append('svg')
        .attr({ width: width, height: width })
        .call(zoombehavior);

    var defs = surface.append('defs');

    var clipPath = defs.append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('id', 'clip-rect')
        .attr({ x: 0, y: 0 })
        .attr({ width: width, height: height });

    var tilegroup = surface.append('g')
            .attr('clip-path', 'url(#clip)'),
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

    function selectClick(d) {
        select(d);
        drawVector();
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
        var all = connection.all();

        var ways = all.filter(function(a) {
                return a.entityType === 'way' && !a.isClosed();
            }),
            areas = all.filter(function(a) {
                return a.entityType === 'way' && a.isClosed();
            }),
            points = all.filter(function(a) {
                return a.entityType === 'node';
            });

        var defpaths = defs.selectAll('path')
                .data(ways, key),
            fills = layers[0].fill.selectAll('path.area')
                .data(areas, key),
            casings = layers[0].casing.selectAll('use.casing')
                .data(ways, key),
            strokes = layers[0].stroke.selectAll('use.stroke')
                .data(ways, key),
            texts = layers[0].text.selectAll('text')
                .data(ways.filter(function(w) {
                    return !!w.tags.name;
                }), key),
            markers = layers[0].hit.selectAll('image.marker')
                .data(points, key);

        var _id = selection[0];
        var active_entity = all.filter(function(a) {
            return a._id === _id;
        });

        var handles = layers[0].hit.selectAll('circle.handle')
            .data(active_entity.length ? active_entity[0].nodes : [], key);

        defpaths.exit().remove();
        texts.exit().remove();
        handles.exit().remove();
        fills.exit().remove();
        markers.exit().remove();
        casings.exit().remove();
        strokes.exit().remove();

        defpaths.enter().append('path');

        defpaths.attr('d', nodeline)
            .attr('id', function(d) {
                return 'd' + d._id;
            });

        function usehref(d) {
            return '#d' + d._id;
        }

        fills.enter().append('path')
            .on('click', selectClick);

        fills.attr('d', nodeline)
            .attr('class', classes('area'));

        casings.enter().append('use');
        casings.sort(waystack)
            .attr('xlink:href', usehref)
            .attr('class', classes('casing'));

        strokes.enter().append('use')
            .on('click', selectClick);

        strokes.sort(waystack).attr('xlink:href', usehref)
            .attr('class', classes('stroke'));

        markers.enter().append('image');
        markers.attr('class', classes('marker'))
            .attr({ width: 16, height: 16 })
            .attr('xlink:href', markerimage)
            .attr('transform', function(d) {
                return 'translate(' + projection(d) + ')';
            });

        var textems = texts.enter().append('text')
            .attr('dy', 3);

        textems.append('textPath')
            .attr('xlink:href', usehref)
            .attr('startOffset', '50%')
            .text(function(d) { return d.tags.name; });

        handles.enter().append('circle')
            .attr('class', 'handle')
            .attr('r', 5)
            .on('click', selectClick);
        handles.attr('transform', function(d) {
            return 'translate(' + projection(d) + ')';
        });
    }
    
    // -------------
    // Zoom handling
    function zoomIn() {
        // summary:	Zoom in by one level (unless maximum reached).
        return setZoom(getZoom() + 1);
    }

    function zoomOut() {
        // summary:	Zoom out by one level (unless minimum reached).
        return setZoom(getZoom() - 1);
    }

    function getZoom(zoom) {
        var s = projection.scale();
        return Math.max(Math.log(s) / Math.log(2) - 8, 0);
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
