// iD/renderer/Map.js
// at present this combines P2's Map and MapPaint functionality

define(['dojo/_base/declare','dojo/_base/event',
        'dojo/dom-geometry',
        'dojox/gfx','dojox/gfx/matrix',
        'iD/Connection','iD/Entity','iD/renderer/EntityUI','iD/renderer/WayUI','iD/renderer/NodeUI'], 
       function(declare, Event, domGeom, Gfx, Matrix){

// ----------------------------------------------------------------------
// Connection base class

declare("iD.renderer.Map", null, {

	MINSCALE: 0,
	MIN_DOWNLOAD_SCALE: 14,
	MAXSCALE: 23,

	div: '',				// <div> of this map
	surface: null,			// <div>.surface containing the rendering
	container: null,		// root-level group within the surface
	backdrop: null,			// coloured backdrop (MapCSS canvas element)
	connection: null,				// data store
	controller: null,		// UI controller
	nodeuis: {},			// graphic representations of data
	wayuis: {},				//  |

	tilegroup: null,		// group within container for adding bitmap tiles
	tiles: {},				// index of tile objects
	tilebaseURL: 'http://ecn.t0.tiles.virtualearth.net/tiles/a$quadkey.jpeg?g=587&mkt=en-gb&n=z',	// Bing imagery URL

	dragging: false,		// current drag state
	dragged: false,			// was most recent click a drag?
	dragx: NaN,				// click co-ordinates at previously recorded drag event
	dragy: NaN,				//  |
	startdragx: NaN,		// click co-ordinates at start of drag
	startdragy: NaN,		//  |
	dragtime: NaN,			// timestamp of mouseup (compared to stop resulting click from firing)
	dragconnect: null,		// event listener for endDrag

	coord: { z: 0, x: 0.5, y: 0.5 },			// lat/long and bounding box of map
	mapheight: NaN,			// size of map object in pixels
	mapwidth: NaN,			//  |

	layers: null,			// array-like object of Groups, one for each OSM layer
	minlayer: -5,			// minimum OSM layer supported
	maxlayer: 5,			// maximum OSM layer supported

	elastic: null,			// Group for drawing elastic band

	ruleset: null,			// map style
	projection: null,			// map style
	tileSize: 256,			// map style

	constructor: function(obj) {
		// summary:		The main map display, containing the individual sprites (UIs) for each entity.
		// obj: Object	An object containing .lat, .lon, .scale, .div (the name of the <div> to be used),
		//				.connection, .width (px) and .height (px) properties.

		this.mapwidth = obj.width ? obj.width : 800;
		this.mapheight = obj.height ? obj.height : 400;
        this.coord = this.zoomCoord(this.coord, 5);

		// Initialise variables
		this.nodeuis = {},
		this.wayuis = {},
        this.projection = new SphericalMercator();
		this.div = document.getElementById(obj.div);
		this.surface=Gfx.createSurface(obj.div, this.mapwidth, this.mapheight);
		this.backdrop=this.surface.createRect({
            x: 0,
            y: 0,
            width: this.mapwidth,
            height: this.mapheight
        }).setFill(new dojo.Color([100,100,100,1]));
		this.tilegroup = this.surface.createGroup();
		this.container = this.surface.createGroup();
		this.connection = obj.connection;

        // Cache the margin box, since this is expensive.
        this.marginBox = domGeom.getMarginBox(this.div);

		// Initialise layers
		this.layers = {};
		for (var l = this.minlayer; l <= this.maxlayer; l++) {
			var r = this.container.createGroup();
			this.layers[l] = {
				root: r,
				fill: r.createGroup(),
				casing: r.createGroup(),
				stroke: r.createGroup(),
				text: r.createGroup(),
				hit: r.createGroup()
			};
		}

		// Create group for elastic band
		this.elastic = this.container.createGroup();

		// Make draggable
		this.backdrop.connect("onmousedown", _.bind(this.startDrag, this));
		this.tilegroup.connect("onmousedown", _.bind(this.startDrag, this));
		this.surface.connect("onclick", _.bind(this.clickSurface, this));
		this.surface.connect("onmousemove", _.bind(this.processMove, this));
		this.surface.connect("onmousedown", _.bind(this._mouseEvent, this));
		this.surface.connect("onmouseup", _.bind(this._mouseEvent, this));

        this.draw();
	},

	setController:function(controller) {
		// summary:		Set the controller that will handle events on the map (e.g. mouse clicks).
		this.controller = controller;
	},

	_moveToPosition:function(group, position) {
		// summary:		Supplementary method for dojox.gfx.
		// This should ideally be core Dojo stuff: see http://bugs.dojotoolkit.org/ticket/15296
		var parent = group.getParent();
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

	sublayer:function(layer,groupType,sublayer) {
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
		var insertAt = collection.children.length;
		for (var i = 0; i < collection.children.length; i++) {
			sub = collection.children[i];
			if (sub.sublayer === sublayer) { return sub; }
			else if (sub.sublayer>sublayer) {
				sub = collection.createGroup();
				this._moveToPosition(sub,i);
				sub.sublayer = sublayer;
				return sub;
			}
		}
		sub = collection.createGroup().moveToFront();
		sub.sublayer = sublayer;
		return sub; // dojox.gfx.Group
	},

	createUI: function(entity,stateClasses) {
		// summary:		Create a UI (sprite) for an entity, assigning any specified state classes
		//				(temporary attributes such as ':hover' or ':selected')
        if (this.getUI(entity)) {
            return this.getUI(entity).setStateClasses(stateClasses).redraw();
        } else if (entity.entityType === 'node') {
            this.nodeuis[entity.id] = new iD.renderer.NodeUI(entity,this,stateClasses);
            return this.nodeuis[entity.id]; // iD.renderer.EntityUI
        } else if (entity.entityType === 'way') {
            this.wayuis[entity.id] = new iD.renderer.WayUI(entity,this,stateClasses);
            return this.wayuis[entity.id]; // iD.renderer.EntityUI
        }
	},

	getUI: function(entity) {
		// summary: Return the UI for an entity, if it exists.
		if (entity.entityType === 'node') {
            return this.nodeuis[entity.id];	// iD.renderer.EntityUI
        } else if (entity.entityType === 'way') {
			return this.wayuis[entity.id];	// iD.renderer.EntityUI
		}
		return null;
	},

	refreshUI: function(entity) {
		// summary:	Redraw the UI for an entity.
        if (this.getUI(entity)) this.getUI(entity).redraw();
	},

	deleteUI: function(entity) {
		// summary:		Delete the UI for an entity.
        var uis = { node: 'nodeuis', way: 'wayuis' }[entity.entityType];
		if (uis && this[uis][entity.id]) {
			this[uis][entity.id].removeSprites();
            delete this[uis][entity.id];
		}
	},

    getExtent: function() {
        return [
            this.coordLocation(this.pointCoord({ x: 0, y: 0 })),
            this.coordLocation(this.pointCoord({
            x: this.mapwidth,
            y: this.mapheight }))];
    },

    download: function() {
        // summary:		Ask the connection to download data for the current viewport.
        $('#progress').show().addClass('spinner');
        this.connection.loadFromAPI(this.getExtent(), _.bind(this.updateUIs, this));
    },

	updateUIs: function() {
		// summary:		Draw/refresh all EntityUIs within the bbox, and remove any others.
		// redraw: Boolean	Should we redraw any UIs that are already present?
		// remove: Boolean	Should we delete any UIs that are no longer in the bbox?
        $('#progress').hide().removeClass('spinner');

		var m = this;
		var way, poi;
		var o = this.connection.getObjectsByBbox(this.getExtent());

        _(o.waysInside).chain()
            .filter(function(w) { return w.loaded; })
            .each(function(way) {
                if (!m.wayuis[way.id]) { m.createUI(way); }
                else { m.wayuis[way.id].recalculate(); m.wayuis[way.id].redraw(); }
            });

		_.each(o.waysOutside, function(way) {
			if (m.wayuis[way.id]) {	//  && !m.wayuis[way.id].purgable
                m.wayuis[way.id].recalculate();
                m.wayuis[way.id].redraw();
			} else {
                m.deleteUI(way);
            }
		});

		_.each(o.poisInside, function(poi) {
			if (!poi.loaded) return;
			if (!m.nodeuis[poi.id]) { m.createUI(poi); }
			else { m.nodeuis[poi.id].redraw(); }
		});

		_.each(o.poisOutside, function(poi) {
			if (m.nodeuis[poi.id]) {	//  && !m.nodeuis[poi.id].purgable
				m.nodeuis[poi.id].redraw();
			} else { m.deleteUI(poi); }
		});

        return this;
	},

	// -------------
    // Zoom handling
    zoomBy: function(by) {
        var to = this.coord.z + by;
        if (to < this.MINSCALE || to > this.MAXSCALE) return this;
        this.coord = this.zoomCoord(this.coord, to);
        return this.draw();
    },

    zoomIn: function() { return this.zoomBy(1); },
    zoomOut: function() { return this.zoomBy(-1); },
    setZoom: function(zoom) { return this.zoomBy(zoom - this.coord.z); },

	setCentre: function(loc) {
        // summary:		Update centre and bbox to a specified lat/lon.
        this.coord = this.locationCoord(loc, this.z);
        return this.draw();
    },
	setCenter: function(loc) { this.setCentre(loc); },

    draw: function() {
        if (this.coord.z > this.MIN_DOWNLOAD_SCALE) this.download();
        return this.clearTiles().loadTiles().updateOrigin().updateUIs();
    },

	// ----------------------
	// Elastic band redrawing

	clearElastic: function() {
		// summary:		Remove the elastic band used to draw new ways.
		this.elastic.clear();
	},

    drawElastic: function(x1, y1, x2, y2) {
		// summary:		Draw the elastic band (for new ways) between two points.
		this.elastic.clear();
		// **** Next line is SVG-specific
		this.elastic.rawNode.setAttribute("pointer-events","none");
		this.elastic.createPolyline([{ x:x1, y:y1 }, { x:x2, y:y2 }]).setStroke({
			color: [0, 0, 0, 1],
			style: 'Solid',
			width: 1
        });
	},

    // -------------
    // Tile handling
    // ** FIXME: see docs
    loadTiles: function() {
        // summary:		Load all tiles for the current viewport. This is a bare-bones function 
        //				at present: it needs configurable URLs (not just Bing), attribution/logo
        //				support, and to be 'nudgable' (i.e. adjust the offset).
        var tl = this.parentCoord(this.pointCoord({ x: 0, y: 0 })),
            br = this.parentCoord(this.pointCoord({
                x: this.mapwidth,
                y: this.mapheight })),
            tileKeys = _.keys(this.tiles),
            seen = [],
            coord = { z: this.coord.z };

        for (coord.x = tl.x; coord.x <= br.x; coord.x++) {
            for (coord.y = tl.y; coord.y <= br.y; coord.y++) {
                this.fetchTile(coord);
                seen.push(iD.Util.tileKey(coord));
            }
        }

        _.each(_.without(tileKeys, seen), _.bind(function(key) {
            delete this.tiles[key];
        }, this));

        return this;
    },

	fetchTile: function(coord) {
        if (this.tiles[iD.Util.tileKey(coord)]) return;
		// summary:		Load a tile image at the given tile co-ordinates.
		var t = this.tilegroup.createImage({
			x: coord.x * this.tileSize,
			y: coord.y * this.tileSize,
			width: this.tileSize,
            height: this.tileSize,
			src: this.tileURL(coord)
		});
        this.tiles[iD.Util.tileKey(coord)] = t;
	},

	tileURL: function(coord) {
		// summary:		Calculate the URL for a tile at the given co-ordinates.
		var u = '';
		for (var zoom = coord.z; zoom > 0; zoom--) {
			var byte = 0;
			var mask = 1 << (zoom - 1);
			if ((coord.x & mask) !== 0) byte++;
			if ((coord.y & mask) !== 0) byte += 2;
			u += byte.toString();
		}
		return this.tilebaseURL
            .replace('$z', coord.z)
            .replace('$x', coord.x)
            .replace('$y', coord.y)
            .replace('$quadkey', u);
	},

	clearTiles: function() {
		// summary:	Unload all tiles and remove from the display.
		this.tilegroup.clear();
		this.tiles = {};
        return this;
	},

	// -------------------------------------------
	// Co-ordinate management, dragging and redraw

	startDrag: function(e) {
		// summary:		Start dragging the map in response to a mouse-down.
		// e: MouseEvent	The mouse-down event that triggered it.
		var srcElement = (e.gfxTarget === this.backdrop) ?
            e.gfxTarget : e.gfxTarget.parent;
		Event.stop(e);
		this.dragging = true;
		this.dragged = false;
		this.dragx = this.dragy=NaN;
		this.startdragx = e.clientX;
		this.startdragy = e.clientY;
		this.dragconnect = srcElement.connect('onmouseup', _.bind(this.endDrag, this));
	},

	endDrag: function(e) {
		// summary:		Stop dragging the map in response to a mouse-up.
		// e: MouseEvent	The mouse-up event that triggered it.
		Event.stop(e);
		dojo.disconnect(this.dragconnect);
		this.dragging = false;
		this.dragtime = e.timeStamp;
		if (Math.abs(e.clientX - this.startdragx) < 3 &&
            Math.abs(e.clientY - this.startdragy) < 3) {
            return;
        }
        this.draw();
	},

    processMove: function(e) {
        // summary:		Drag the map to a new origin.
        // e: MouseEvent	The mouse-move event that triggered it.
        var x = e.clientX, y = e.clientY;
        if (this.dragging) {
            if (this.dragx) {
                this.coord.x -= (x - this.dragx) / 256;
                this.coord.y -= (y - this.dragy) / 256;
                this.updateOrigin();
                this.dragged = true;
            }
            this.dragx = x;
            this.dragy = y;
        } else {
            this.controller.entityMouseEvent(e,null);
        }
    },

	updateOrigin: function() {
		// summary:		Tell Dojo to update the viewport origin.
        var ox = (this.mapwidth / 2) - this.coord.x * 256,
            oy = (this.mapheight / 2) - this.coord.y * 256,
            t = [Matrix.translate(ox, oy)];
		this.container.setTransform(t);
		this.tilegroup.setTransform(t);
        return this;
	},

	_mouseEvent: function(e) {
        // summary: Catch mouse events on the surface but not the tiles - in other words,
        // on drawn items that don't have their own hitzones, like the fill of a shape.
        if (e.type === 'mousedown') { this.startDrag(e); }
        // ** FIXME: we may want to reinstate this at some point...
        // this.controller.entityMouseEvent(e,null);
    },

	clickSurface: function(e) {
		// summary:		Handle a click on an empty area of the map.
		if (this.dragged && e.timeStamp==this.dragtime) { return; }
		this.controller.entityMouseEvent(e,null);
	},

	// -----------------------
	// Co-ordinate conversions

	locationCoord: function(ll, z) {
        z = (typeof z === 'undefined') ? this.coord.z : z;
        var px = this.locationPoint(ll, z);
        return { z: z,
            x: Math.floor(px.x / this.tileSize),
            y: Math.floor(px.y / this.tileSize)
        };
    },

    locationPoint: function(ll, z) {
        z = (typeof z === 'undefined') ? this.coord.z : z;
        var px = this.projection.px([ll.lon, ll.lat], z);
        return { x: px[0], y: px[1] };
    },

	coordLocation: function(coord) {
        var ll = this.projection.ll([coord.x * 256, coord.y * 256], coord.z);
        return { lon: ll[0], lat: ll[1] };
    },

	parentCoord: function(c) {
        return { z: c.z,
            x: Math.floor(c.x),
            y: Math.floor(c.y)
        };
    },

	pointCoord: function(px) {
        return {
            x: (px.x + (this.coord.x * this.tileSize - this.mapwidth / 2)) / this.tileSize,
            y: (px.y + (this.coord.y * this.tileSize - this.mapheight / 2)) / this.tileSize,
            z: this.coord.z
        };
    },

    zoomCoord: function(c, z) {
        var power = Math.pow(2, z - c.z);
        return { z: z,
            x: c.x * power,
            y: c.y * power
        };
    },

	// Turn event co-ordinates into map co-ordinates
	mouseX: function(e) { return e.clientX - this.marginBox.l - this.containerx; },
	mouseY: function(e) { return e.clientY - this.marginBox.t - this.containery; }
});

// ----------------------------------------------------------------------
// End of module
});
