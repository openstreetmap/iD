// iD/renderer/Map.js
// at present this combines P2's Map and MapPaint functionality

// ----------------------------------------------------------------------
// Connection base class

iD.renderer.Map = function(obj) {
    // summary:		The main map display, containing the individual sprites (UIs) for each entity.
    // obj: Object	An object containing .lat, .lon, .scale, .div (the name of the <div> to be used),
    //	.connection, .width (px) and .height (px) properties.
    this.width = obj.width ? obj.width : 800;
    this.height = obj.height ? obj.height : 400;

    // Initialise variables
    this.uis = {};

    this.projection = d3.geo.mercator()
        .scale(512).translate([512, 512]);

	// List of co-ordinates
    var proj = this.projection;

    this.linegen = d3.svg.line()
        .x(function(d) { return proj(d)[0]; })
        .y(function(d) { return proj(d)[1]; });

    this.zoombehavior = d3.behavior.zoom()
        .translate(this.projection.translate())
        .scale(this.projection.scale());

    this.zoombehavior.on("zoom", _.bind(this.redraw, this));

    this.surface = d3.selectAll(obj.selector)
        .append('svg')
        .attr({ width: this.width, height: this.width })
        .call(this.zoombehavior);

    var clip = this.surface.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("id", "clip-rect")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", this.width)
        .attr("height", this.height);

    this.tilegroup = this.surface.append('g')
        .attr("clip-path", "url(#clip)");
    this.container = this.surface.append('g')
        .attr("clip-path", "url(#clip)");

    this.connection = obj.connection;

    // Initialise layers
    this.layers = {};
    for (var l=this.minlayer; l<=this.maxlayer; l++) {
        var r = this.container.append('g');
        this.layers[l]={
            root: r,
            fill: r.append('g'),
            casing: r.append('g'),
            stroke: r.append('g'),
            text: r.append('g'),
            hit: r.append('g')
        };
    }

    // Create group for elastic band
    this.elastic = this.container.append('g');

    // Make draggable
    this.surface.on('onclick', _.bind(this.clickSurface, this));

    this.redraw();
};

iD.renderer.Map.prototype = {

    div: '',				// <div> of this map
    surface: null,			// <div>.surface containing the rendering
    container: null,        // root-level group within the surface
    connection: null,       // data store
    controller: null,		// UI controller

    tilegroup: null,		// group within container for adding bitmap tiles
    tilebaseURL: 'http://ecn.t0.tiles.virtualearth.net/tiles/a$quadkey.jpeg?g=587&mkt=en-gb&n=z',	// Bing imagery URL

    height: NaN,			// size of map object in pixels
    width: NaN,			//  |

    layers: null,			// array-like object of Groups, one for each OSM layer
    minlayer: -5,			// minimum OSM layer supported
    maxlayer: 5,			// maximum OSM layer supported

    elastic: null,			// Group for drawing elastic band
    ruleset: null,			// map style

    setController:function(controller) {
        // summary:		Set the controller that will handle events on the map (e.g. mouse clicks).
        this.controller = controller;
    },

    download: _.debounce(function() {
        // summary:		Ask the connection to download data for the current viewport.
        this.connection.loadFromAPI(this.extent(), _.bind(this.updateUIs, this));
    }, 1000),

    extent: function() {
        return [
            this.projection.invert([0, 0]),
            this.projection.invert([this.width, this.height])];
    },

    updateUIs: function() {
        // summary:		Draw/refresh all EntityUIs within the bbox, and remove any others.
        // redraw: Boolean	Should we redraw any UIs that are already present?
        // remove: Boolean	Should we delete any UIs that are no longer in the bbox?
        function classes(d) {
            var tags = d.tags;
            var c = [];
            function clean(x) {
                return x.indexOf(' ') === -1 && x.length < 30;
            }
            for (var k in tags) {
                var v = tags[k];
                if (!clean(k) || !clean(v)) {
                    continue;
                }
                c.push(k + '-' + v);
                c.push(k);
                c.push(v);
            }
            return c.join(' ');
        }

        var linegen = this.linegen;

        var all = this.connection.all();

        function key(d) { return d._id; }

        var ways = all.filter(function(a) {
            return a.entityType === 'way' && !a.isClosed();
        });

        var areas = all.filter(function(a) {
            return a.entityType === 'way' && a.isClosed();
        });

        var fills = this.layers[0].fill.selectAll('path.area')
            .data(areas, key);

        fills.enter().append('path')
            .attr('class', function(d) {
                return 'area ' + classes(d);
            });
        fills.exit().remove();
        fills.attr("d", function(d) {
            return linegen(d.nodes);
        });

        var casings = this.layers[0].casing.selectAll('path.casing')
            .data(ways, key);

        casings.enter().append('path')
            .attr('class', function(d) {
                return 'casing ' + classes(d);
            });
        casings.exit().remove();
        casings.attr("d", function(d) {
            return linegen(d.nodes);
        });

        var strokes = this.layers[0].stroke.selectAll('path.stroke')
            .data(ways, key);

        strokes.enter().append('path')
            .attr('class', function(d) {
                return 'stroke ' + classes(d);
            });
        strokes.exit().remove();
        strokes.attr("d", function(d) {
            return linegen(d.nodes);
        });
    },

    // -------------
    // Zoom handling
    zoomIn: function() {
        // summary:	Zoom in by one level (unless maximum reached).
        return this.setZoom(this.getZoom() + 1);
    },

    zoomOut: function() {
        // summary:	Zoom out by one level (unless minimum reached).
        return this.setZoom(this.getZoom() - 1);
    },

    getZoom: function(zoom) {
        var s = this.projection.scale();
        return Math.max(Math.log(s) / Math.log(2) - 8, 0);
    },

    setZoom: function(zoom) {
        // summary:	Redraw the map at a new zoom level.
        this.projection.scale(256 * Math.pow(2, zoom - 1));
        this.zoombehavior.scale(this.projection.scale());
        this.updateUIs(true, true);
        this.redraw();
        return this;
    },

    // ----------------------
    // Elastic band redrawing

    clearElastic: function() {
        // summary:	Remove the elastic band used to draw new ways.
        this.elastic.clear();
    },

    drawElastic: function(x1,y1,x2,y2) {
        // summary:	Draw the elastic band (for new ways) between two points.
        this.elastic.clear();
        // **** Next line is SVG-specific
        this.elastic.rawNode.setAttribute("pointer-events","none");
        this.elastic.createPolyline( [{ x:x1, y:y1 }, { x:x2, y:y2 }] ).setStroke( {
            color: [0, 0, 0, 1],
            style: 'Solid',
            width: 1
        });
    },

    tilesForView: function() {
        var projection = this.projection,
            width = this.width,
            height = this.height;

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
    },

    redraw: function() {
        var projection = this.projection;

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
            coords = this.tilesForView();

        var tmpl = this.tilebaseURL;

        function tileUrl(coord) {
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

        var tiles = this.tilegroup.selectAll('image.tile')
            .data(coords, function(d) { return d.join(','); });

        tiles.exit().remove();
        tiles.enter().append('image')
            .attr('class', 'tile')
            .attr('xlink:href', tileUrl);
        tiles.attr({ width: ts, height: ts })
            .attr('transform', function(d) {
                return 'translate(' + [(d[1] * ts) - tile_origin[0], (d[2] * ts) - tile_origin[1]] + ')';
            });
        this.updateUIs();
        this.download();
    },

    setCentre: function(loc) {
        // summary:		Update centre and bbox to a specified lat/lon.
        var t = this.projection.translate(),
            ll = this.projection([loc.lon, loc.lat]);
        this.projection.translate([
            t[0] - ll[0] + this.width / 2,
            t[1] - ll[1] + this.height / 2]);
        this.zoombehavior.translate(this.projection.translate());
        this.redraw();
        return this;
    },

    setCenter: function(loc) { this.setCentre(loc); },

    clickSurface:function(e) {
        // summary:		Handle a click on an empty area of the map.
        if (this.dragged && e.timeStamp==this.dragtime) { return; }
        this.controller.entityMouseEvent(e,null);
    }
};
