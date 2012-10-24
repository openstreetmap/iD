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
    this.zoombehavior = d3.behavior.zoom()
        .translate(this.projection.translate())
        .scale(this.projection.scale())
        .on("zoom", _.bind(this.redraw, this));

    this.surface = d3.selectAll(obj.selector)
        .append('svg')
        .attr({ width: this.width, height: this.width })
        .call(this.zoombehavior);

    this.tilegroup = this.surface.append('g');
    this.container = this.surface.append('g');
    this.connection = obj.connection;

    // Initialise layers
    this.layers={};
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
    container: null,		// root-level group within the surface
    backdrop: null,			// coloured backdrop (MapCSS canvas element)
    connection: null,				// data store
    controller: null,		// UI controller
    uis: {},

    tilegroup: null,		// group within container for adding bitmap tiles
    tiles: {},				// index of tile objects
    tilebaseURL: 'http://ecn.t0.tiles.virtualearth.net/tiles/a$quadkey.jpeg?g=587&mkt=en-gb&n=z',	// Bing imagery URL

    dragging: false,		// current drag state
    dragged: false,			// was most recent click a drag?
    dragtime: NaN,			// timestamp of mouseup (compared to stop resulting click from firing)
    dragconnect: null,		// event listener for endDrag

    containerx: 0,			// screen co-ordinates of container
    containery: 0,			//  |

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

    _moveToPosition:function(group, position) {
        // summary:		Supplementary method for dojox.gfx.
        // This should ideally be core Dojo stuff: see http://bugs.dojotoolkit.org/ticket/15296
        var parent=group.getParent();
        if (!parent) { return; }
        this._moveChildToPosition(parent,group,position);
        if (position === group.rawNode.parentNode.childNodes.length) {
            group.rawNode.parentNode.appendChild(group.rawNode);
        } else {
            group.rawNode.parentNode.insertBefore(group.rawNode, group.rawNode.parentNode.childNodes[position]);
        }
    },

    _moveChildToPosition: function(parent, child, position) {
        for (var i = 0; i < parent.children.length; ++i){
            if (parent.children[i] === child){
                parent.children.splice(i, 1);
                parent.children.splice(position, 0, child);
                break;
            }
        }
    },

    // ----------------------------
    // Sprite and EntityUI handling

    sublayer: function(layer,groupType,sublayer) {
        // summary:		Find the gfx.Group for a given OSM layer and rendering sublayer, creating it 
        // if necessary. Note that sublayers are only implemented for stroke and fill.
        // groupType: String	'casing','text','hit','stroke', or 'fill'
        var collection = this.layers[layer][groupType], sub;
        switch (groupType) {
            case 'casing':
                case 'text':
                case 'hit':
                return collection;
        }
        // Find correct sublayer, inserting if necessary
        var insertAt=collection.children.length;
        for (var i = 0; i < collection.children.length; i++) {
            sub=collection.children[i];
            if (sub.sublayer==sublayer) { return sub; }
            else if (sub.sublayer>sublayer) {
                sub = collection.createGroup();
                this._moveToPosition(sub,i);
                sub.sublayer=sublayer;
                return sub;
            }
        }
        sub = collection.createGroup().moveToFront();
        sub.sublayer=sublayer;
        return sub; // dojox.gfx.Group
    },

    createUI: function(e, stateClasses) {
        // summary:		Create a UI (sprite) for an entity, assigning any specified state classes
        //				(temporary attributes such as ':hover' or ':selected')
        if (!this.uis[e.id]) {
            if (e.entityType === 'node') {
                this.uis[e.id] = new iD.renderer.NodeUI(e, this, stateClasses);
            } else if (e.entityType === 'way') {
                this.uis[e.id] = new iD.renderer.WayUI(e, this, stateClasses);
            }
        } else {
            this.uis[e.id].setStateClasses(stateClasses).redraw();
        }
    },

    getUI: function(e) {
        // summary: Return the UI for an entity, if it exists.
        return this.uis[e.id];	// iD.renderer.EntityUI
    },

    refreshUI: function(e) {
        // summary:	Redraw the UI for an entity.
        if (this.uis[e.id]) { this.uis[e.id].redraw(); }
    },

    deleteUI: function(e) {
        // summary:		Delete the UI for an entity.
        if (this.uis[e.id]) {
            this.uis[e.id].removeSprites();
            delete this.uis[e.id];
        }
    },

    download: function() {
        // summary:		Ask the connection to download data for the current viewport.
        this.connection.loadFromAPI(this.extent(), _.bind(this.updateUIs, this));
    },

    extent: function() {
        return [
            this.projection.invert([0, 0]),
            this.projection.invert([this.width, this.height])];
    },

    updateUIs: function() {
        // summary:		Draw/refresh all EntityUIs within the bbox, and remove any others.
        // redraw: Boolean	Should we redraw any UIs that are already present?
        // remove: Boolean	Should we delete any UIs that are no longer in the bbox?
        var o = this.connection.getObjectsByBbox(this.extent);
        var touch = _(o.inside).chain()
            .filter(function(w) { return w.loaded; })
            .map(_.bind(function(e) {
                if (!this.uis[e.id]) {
                    this.createUI(e);
                } else {
                    this.uis[e.id].redraw();
                }
                return '' + e.id;
            }, this)).value();
            _.each(_.difference(_.keys(this.uis), touch), _.bind(function(k) {
                this.deleteUI(k);
            }, this));
    },

    // -------------
    // Zoom handling

    zoomIn: function() {
        // summary:		Zoom in by one level (unless maximum reached).
        return this.setZoom(this.zoom + 1);
    },

    zoomOut: function() {
        // summary:		Zoom out by one level (unless minimum reached).
        this.setZoom(this.zoom - 1);
        this.download();
        return this;
    },

    setZoom: function(zoom) {
        // summary:		Redraw the map at a new zoom level.
        this.projection.scale(256 * Math.pow(2, zoom - 1));
        this.zoombehavior.scale(this.projection.scale());
        this.updateUIs(true, true);
        this.redraw();
        return this;
    },

    _setScaleFactor: function() {
        // summary:		Calculate the scaling factor for this zoom level.
        this.zoomfactor = this.MASTERSCALE/Math.pow(2, 13 - this.zoom);
    },

    // ----------------------
    // Elastic band redrawing

    clearElastic: function() {
        // summary:		Remove the elastic band used to draw new ways.
        this.elastic.clear();
    },

    drawElastic: function(x1,y1,x2,y2) {
        // summary:		Draw the elastic band (for new ways) between two points.
        this.elastic.clear();
        // **** Next line is SVG-specific
        this.elastic.rawNode.setAttribute("pointer-events","none");
        this.elastic.createPolyline( [{ x:x1, y:y1 }, { x:x2, y:y2 }] ).setStroke( {
            color: [0, 0, 0, 1],
            style: 'Solid',
            width: 1
        });
    },
    redraw: function() {
        var projection = this.projection,
            width = this.width,
            height = this.height;

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
            coords = [],
            cols = d3.range(Math.max(0, Math.floor((tile_origin[0] - width) / ts)),
            Math.max(0, Math.ceil((tile_origin[0] + width) / ts))),
            rows = d3.range(Math.max(0, Math.floor((tile_origin[1] - height) / ts)),
            Math.max(0, Math.ceil((tile_origin[1] + height) / ts)));

        cols.forEach(function(x) {
            rows.forEach(function(y) { coords.push([Math.floor(z), x, y]); });
        });

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
    },

    // Turn event co-ordinates into map co-ordinates
    mouseX: function(e) { return e.clientX - this.marginBox.l - this.containerx; },
    mouseY: function(e) { return e.clientY - this.marginBox.t - this.containery; }
};
