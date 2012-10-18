// iD/renderer/Map.js
// at present this combines P2's Map and MapPaint functionality

define(['dojo/_base/declare','dojo/_base/array','dojo/_base/event','dojo/_base/lang',
        'dojo/dom-geometry',
        'dojox/gfx','dojox/gfx/matrix',
        'iD/Connection','iD/Entity','iD/renderer/EntityUI','iD/renderer/WayUI','iD/renderer/NodeUI'], 
       function(declare, array, Event, lang, domGeom, Gfx, Matrix){

// ----------------------------------------------------------------------
// Connection base class

declare("iD.renderer.Map", null, {

	MASTERSCALE: 5825.4222222222,
	MINSCALE: 14,
	MAXSCALE: 23,
	scale: NaN,
	scalefactor: NaN,
	baselon: NaN,			// original longitude at top left of viewport
	baselat: NaN,			// original latitude at top left of viewport
	baselatp: NaN,			// original projected latitude at top left of viewport

	div: '',				// <div> of this map
	surface: null,			// <div>.surface containing the rendering
	container: null,		// root-level group within the surface
	backdrop: null,			// coloured backdrop (MapCSS canvas element)
	conn: null,				// data store
	controller: null,		// UI controller
	nodeuis: {},			// graphic representations of data
	wayuis: {},				//  |

	tilegroup: null,		// group within container for adding bitmap tiles
	tiles: [],				// index of tile objects
	tilebaseURL: 'http://ecn.t0.tiles.virtualearth.net/tiles/a$quadkey.jpeg?g=587&mkt=en-gb&n=z',	// Bing imagery URL

	dragging: false,		// current drag state
	dragged: false,			// was most recent click a drag?
	dragx: NaN,				// click co-ordinates at previously recorded drag event
	dragy: NaN,				//  |
	startdragx: NaN,		// click co-ordinates at start of drag
	startdragy: NaN,		//  |
	dragtime: NaN,			// timestamp of mouseup (compared to stop resulting click from firing)
	dragconnect: null,		// event listener for endDrag

	containerx: 0,			// screen co-ordinates of container
	containery: 0,			//  |
	centrelat: NaN,			// lat/long and bounding box of map
	centrelon: NaN,			//  |
	extent: {},				//  |
	mapheight: NaN,			// size of map object in pixels
	mapwidth: NaN,			//  |

	layers: null,			// array-like object of Groups, one for each OSM layer
	minlayer: -5,			// minimum OSM layer supported
	maxlayer: 5,			// maximum OSM layer supported

	elastic: null,			// Group for drawing elastic band

	ruleset: null,			// map style

	constructor:function(obj) {
		// summary:		The main map display, containing the individual sprites (UIs) for each entity.
		// obj: Object	An object containing .lat, .lon, .scale, .div (the name of the <div> to be used),
		//				.connection, .width (px) and .height (px) properties.

		this.mapwidth=obj.width ? obj.width : 800;
		this.mapheight=obj.height ? obj.height : 400;

		// Initialise variables
		this.nodeuis={},
		this.wayuis={},
		this.div=document.getElementById(obj.div);
		this.surface=Gfx.createSurface(obj.div, this.mapwidth, this.mapheight);
		this.backdrop=this.surface.createRect({
            x: 0,
            y: 0,
            width: this.mapwidth,
            height: this.mapheight
        }).setFill(new dojo.Color([255,255,245,1]));
		this.tilegroup=this.surface.createGroup();
		this.container=this.surface.createGroup();
		this.conn=obj.connection;
		this.scale=obj.scale ? obj.scale : 17;
		this.baselon=obj.lon;
		this.baselat=obj.lat;
		this.baselatp=this.lat2latp(obj.lat);
		this._setScaleFactor();
		this.updateCoordsFromViewportPosition();

		// Initialise layers
		this.layers={};
		for (var l=this.minlayer; l<=this.maxlayer; l++) {
			var r=this.container.createGroup();
			this.layers[l]={
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
	},

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
		if (position==group.rawNode.parentNode.childNodes.length) {
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
		var collection=this.layers[layer][groupType], sub;
		switch (groupType) {
			case 'casing':
			case 'text':
			case 'hit':
				return collection;
		}
		// Find correct sublayer, inserting if necessary
		var insertAt=collection.children.length;
		for (var i=0; i<collection.children.length; i++) {
			sub=collection.children[i];
			if (sub.sublayer==sublayer) { return sub; }
			else if (sub.sublayer>sublayer) {
				sub = collection.createGroup();
				this._moveToPosition(sub,i);
				sub.sublayer=sublayer;
				return sub;
			}
		}
		sub=collection.createGroup().moveToFront();
		sub.sublayer=sublayer;
		return sub; // dojox.gfx.Group
	},

	createUI:function(entity,stateClasses) {
		// summary:		Create a UI (sprite) for an entity, assigning any specified state classes
		//				(temporary attributes such as ':hover' or ':selected')
		var id = entity.id;
        if (entity.entityType === 'node') {
            if (!this.nodeuis[id]) {
                this.nodeuis[id] = new iD.renderer.NodeUI(entity,this,stateClasses);
            } else {
                this.nodeuis[id].setStateClasses(stateClasses).redraw();
            }
            return this.nodeuis[id];	// iD.renderer.EntityUI
        } else if (entity.entityType === 'way') {
            if (!this.wayuis[id]) {
                this.wayuis[id] = new iD.renderer.WayUI(entity,this,stateClasses);
            } else {
                this.wayuis[id].setStateClasses(stateClasses).redraw();
            }
            return this.wayuis[id];		// iD.renderer.EntityUI
        }
	},

	getUI:function(entity) {
		// summary: Return the UI for an entity, if it exists.
		if (entity.entityType === 'node') {
            return this.nodeuis[entity.id];	// iD.renderer.EntityUI
        } else if (entity.entityType === 'way') {
			return this.wayuis[entity.id];	// iD.renderer.EntityUI
		}
		return null;
	},

	refreshUI:function(entity) {
		// summary:	Redraw the UI for an entity.
		switch (entity.entityType) {
			case 'node': if (this.nodeuis[entity.id]) { this.nodeuis[entity.id].redraw(); } break;
			case 'way': if (this.wayuis[entity.id] ) { this.wayuis[entity.id].redraw(); } break;
		}
	},

	deleteUI:function(entity) {
		// summary:		Delete the UI for an entity.
		switch (entity.entityType) {
			case 'node': if (this.nodeuis[entity.id]) { this.nodeuis[entity.id].removeSprites(); delete this.nodeuis[entity.id]; } break;
			case 'way': if (this.wayuis[entity.id] ) { this.wayuis[entity.id].removeSprites();  delete this.wayuis[entity.id];  } break;
		}
	},

	download:function() {
		// summary:		Ask the connection to download data for the current viewport.
		this.conn.loadFromAPI(this.extent);
	},

	updateUIs:function(redraw,remove) {
		// summary:		Draw/refresh all EntityUIs within the bbox, and remove any others.
		// redraw: Boolean	Should we redraw any UIs that are already present?
		// remove: Boolean	Should we delete any UIs that are no longer in the bbox?

		var m = this;
		var way, poi;
		var o = this.conn.getObjectsByBbox(this.extent);

        _(o.waysInside).chain()
            .filter(function(w) { return w.loaded; })
            .each(function(way) {
                if (!m.wayuis[way.id]) { m.createUI(way); }
                else if (redraw) { m.wayuis[way.id].recalculate(); m.wayuis[way.id].redraw(); }
            });

		if (remove) {
			array.forEach(o.waysOutside, function(way) {
				if (m.wayuis[way.id]) {	//  && !m.wayuis[way.id].purgable
					if (redraw) { m.wayuis[way.id].recalculate(); m.wayuis[way.id].redraw(); }
				} else { m.deleteUI(way); }
			});
		}

		array.forEach(o.poisInside, function(poi) {
			if (!poi.loaded) return;
			if (!m.nodeuis[poi.id]) { m.createUI(poi); }
			else if (redraw) { m.nodeuis[poi.id].redraw(); }
		});

		if (remove) {
			array.forEach(o.poisOutside, function(poi) {
				if (m.nodeuis[poi.id]) {	//  && !m.nodeuis[poi.id].purgable
					if (redraw) { m.nodeuis[poi.id].redraw(); }
				} else { m.deleteUI(poi); }
			});
		}
	},

	// -------------
	// Zoom handling

	zoomIn: function() {
		// summary:		Zoom in by one level (unless maximum reached).
		if (this.scale !== this.MAXSCALE) { this.changeScale(this.scale+1); }
	},

	zoomOut: function() {
		// summary:		Zoom out by one level (unless minimum reached).
		if (this.scale !== this.MINSCALE) { this.changeScale(this.scale-1); }
		this.download();
	},

	changeScale: function(scale) {
		// summary:		Redraw the map at a new zoom level.
		this.scale=scale;
		this._setScaleFactor();
		this._blankTiles();
		this.updateCoordsFromLatLon(this.centrelat,this.centrelon);	// recentre
		this.updateUIs(true,true);
	},

	_setScaleFactor: function() {
		// summary:		Calculate the scaling factor for this zoom level.
		this.scalefactor=this.MASTERSCALE/Math.pow(2,13-this.scale);
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

	// -------------
	// Tile handling
	// ** FIXME: see docs
	loadTiles: function() {
		// summary:		Load all tiles for the current viewport. This is a bare-bones function 
		//				at present: it needs configurable URLs (not just Bing), attribution/logo
		//				support, and to be 'nudgable' (i.e. adjust the offset).
		var tile_l=this.lon2tile(this.extent.west);
		var tile_r=this.lon2tile(this.extent.east);
		var tile_t=this.lat2tile(this.extent.north);
		var tile_b=this.lat2tile(this.extent.south);

		for (var x=tile_l; x<=tile_r; x++) {
			for (var y=tile_t; y<=tile_b; y++) {
				if (!this._getTile(this.scale,x,y)) {
                    this._fetchTile(this.scale,x,y);
                }
			}
		}
	},

	_fetchTile: function(z,x,y) {
		// summary:		Load a tile image at the given tile co-ordinates.
		var t=this.tilegroup.createImage({
			x: Math.floor(this.lon2coord(this.tile2lon(x))),
			y: Math.floor(this.lat2coord(this.tile2lat(y))),
			width: 256, height: 256,
			src: this._tileURL(z,x,y)
		});
		this._assignTile(z,x,y,t);
	},

	_getTile: function(z,x,y) {
		// summary:		See if this tile is already loaded.
        var k = z + ',' + x + ',' + y;
		return this.tiles[k];
	},

	_assignTile: function(z,x,y,t) {
		// summary:		Store a reference to the tile so we know it's loaded.
        var k = z + ',' + x + ',' + y;
        if (!this.tiles[k]) {
            this.tiles[z + ',' + x + ',' + y] = t;
        }
	},

	_tileURL: function(z,x,y) {
		// summary:		Calculate the URL for a tile at the given co-ordinates.
		var u='';
		for (var zoom=z; zoom>0; zoom--) {
			var byte=0;
			var mask=1<<(zoom-1);
			if ((x & mask) !== 0) byte++;
			if ((y & mask) !== 0) byte += 2;
			u=u+byte.toString();
		}
		return this.tilebaseURL.replace('$z',z).replace('$x',x).replace('$y',y).replace('$quadkey',u);
	},

	_blankTiles: function() {
		// summary:		Unload all tiles and remove from the display.
		this.tilegroup.clear();
		this.tiles = {};
	},

	// -------------------------------------------
	// Co-ordinate management, dragging and redraw

	startDrag: function(e) {
		// summary:		Start dragging the map in response to a mouse-down.
		// e: MouseEvent	The mouse-down event that triggered it.
		var srcElement = (e.gfxTarget==this.backdrop) ? e.gfxTarget : e.gfxTarget.parent;
		Event.stop(e);
		this.dragging=true;
		this.dragged=false;
		this.dragx=this.dragy=NaN;
		this.startdragx=e.clientX;
		this.startdragy=e.clientY;
		this.dragconnect=srcElement.connect("onmouseup", lang.hitch(this,"endDrag"));
	},

	endDrag: function(e) {
		// summary:		Stop dragging the map in response to a mouse-up.
		// e: MouseEvent	The mouse-up event that triggered it.
		Event.stop(e);
		dojo.disconnect(this.dragconnect);
		this.dragging=false;
		this.dragtime=e.timeStamp;
		this.updateCoordsFromViewportPosition();
		if (Math.abs(e.clientX-this.startdragx)<3 && Math.abs(e.clientY-this.startdragy)<3) { return; }
		this.download();
	},

	processMove: function(e) {
		// summary:		Drag the map to a new origin.
		// e: MouseEvent	The mouse-move event that triggered it.
		var x = e.clientX;
		var y = e.clientY;
		if (this.dragging) {
			if (this.dragx) {
				this.containerx += (x - this.dragx);
				this.containery += (y - this.dragy);
				this.updateOrigin();
				this.dragged=true;
			}
			this.dragx=x;
			this.dragy=y;
		} else {
			this.controller.entityMouseEvent(e,null);
		}
	},

	updateOrigin: function() {
		// summary:		Tell Dojo to update the viewport origin.
		this.container.setTransform([Matrix.translate(this.containerx,this.containery)]);
		this.tilegroup.setTransform([Matrix.translate(this.containerx,this.containery)]);
	},

	_mouseEvent: function(e) {
        // summary: Catch mouse events on the surface but not the tiles - in other words,
        // on drawn items that don't have their own hitzones, like the fill of a shape.
        if (e.type=='mousedown') { this.startDrag(e); }
        // ** FIXME: we may want to reinstate this at some point...
        // this.controller.entityMouseEvent(e,null);
    },

	updateCoordsFromViewportPosition:function(e) {
		// summary:		Update centre and bbox from the current viewport origin.
		this._updateCoords(this.containerx,this.containery);
	},

	updateCoordsFromLatLon:function(lat,lon) {
        // summary:		Update centre and bbox to a specified lat/lon.
        this._updateCoords(-(this.lon2coord(lon)-this.mapwidth/2),
                           -(this.lat2coord(lat)-this.mapheight/2));
    },

	_updateCoords:function(x, y) {
		// summary:		Set centre and bbox.
		this.containerx=x; this.containery=y; this.updateOrigin();
		this.centrelon=this.coord2lon(-x + this.mapwidth/2);
		this.centrelat=this.coord2lat(-y + this.mapheight/2);
        
        this.extent = {
            north: this.coord2lat(-y),
            south: this.coord2lat(-y + this.mapheight),
            west: this.coord2lon(-x),
            east: this.coord2lon(-x + this.mapwidth)
        };

		this.loadTiles();
	},

	clickSurface:function(e) {
		// summary:		Handle a click on an empty area of the map.
		if (this.dragged && e.timeStamp==this.dragtime) { return; }
		this.controller.entityMouseEvent(e,null);
	},

	// -----------------------
	// Co-ordinate conversions

	latp2coord:function(a) { return -(a-this.baselatp)*this.scalefactor; },
	coord2latp:function(a) { return a/-this.scalefactor+this.baselatp; },
	lon2coord:function(a)  { return (a-this.baselon)*this.scalefactor; },
	coord2lon:function(a)  { return a/this.scalefactor+this.baselon; },
	lon2screen:function(a) { return this.lon2coord(a) + domGeom.getMarginBox(this.div).l + this.containerx; },

	lat2latp:function(a)   { return 180/Math.PI * Math.log(Math.tan(Math.PI/4+a*(Math.PI/180)/2)); },
	latp2lat:function(a)   { return 180/Math.PI * (2 * Math.atan(Math.exp(a*Math.PI/180)) - Math.PI/2); },
	lat2coord:function(a)  { return -(this.lat2latp(a)-this.baselatp)*this.scalefactor; },
	coord2lat:function(a)  { return this.latp2lat(a/-this.scalefactor+this.baselatp); },
	lat2screen:function(a) { return this.lat2coord(a) + domGeom.getMarginBox(this.div).t + this.containery; },

	lon2tile:function(a)   { return (Math.floor((a+180)/360*Math.pow(2,this.scale))); },
	lat2tile:function(a)   { return (Math.floor((1-Math.log(Math.tan(a*Math.PI/180) + 1/Math.cos(a*Math.PI/180))/Math.PI)/2 *Math.pow(2,this.scale))); },
	tile2lon:function(a)   { return (a/Math.pow(2,this.scale)*360-180); },
	tile2lat:function(a)   {
		var n=Math.PI-2*Math.PI*a/Math.pow(2,this.scale);
		return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
	},

	// Turn event co-ordinates into map co-ordinates

	mouseX:function(e) { return e.clientX - domGeom.getMarginBox(this.div).l - this.containerx; },
	mouseY:function(e) { return e.clientY - domGeom.getMarginBox(this.div).t - this.containery; }
});

// ----------------------------------------------------------------------
// End of module
});
