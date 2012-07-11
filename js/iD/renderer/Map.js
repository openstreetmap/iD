// iD/renderer/Map.js
// at present this combines P2's Map and MapPaint functionality

define(['dojo/_base/declare','dojo/_base/array','dojo/_base/event','dojo/_base/lang',
        'dojo/dom-geometry',
        'dojox/gfx','dojox/gfx/matrix',
        'iD/Connection','iD/Entity','iD/renderer/EntityUI','iD/renderer/WayUI','iD/renderer/NodeUI'], 
       function(declare,array,Event,lang,domGeom,Gfx,Matrix){

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
	edgel: NaN,				//  |
	edger: NaN,				//  |
	edget: NaN,				//  |
	edgeb: NaN,				//  |
	mapheight: NaN,			// size of map object in pixels
	mapwidth: NaN,			//  |
	
	layers: null,			// array-like object of Groups, one for each OSM layer
	minlayer: -5,			// minimum OSM layer supported
	maxlayer: 5,			// maximum OSM layer supported

	elastic: null,			// Group for drawing elastic band

	ruleset: null,			// map style
	
	// Constructor
	// takes object with lat, lon, scale, div, connection, width, height properties
	
	constructor:function(obj) {
		// Bounds
		this.mapwidth=obj.width ? obj.width : 800;
		this.mapheight=obj.height ? obj.height : 400;

		// Initialise variables
		this.nodeuis={},
		this.wayuis={},
		this.div=document.getElementById(obj.div);
		this.surface=Gfx.createSurface(obj.div, this.mapwidth, this.mapheight);
		this.backdrop=this.surface.createRect( { x:0, y:0, width: this.mapwidth, height: this.mapheight }).setFill(new dojo.Color([255,255,245,1]));
		this.tilegroup=this.surface.createGroup();
		this.container=this.surface.createGroup();
		this.conn=obj.connection;
		this.scale=obj.scale ? obj.scale : 17;
		this.baselon=obj.lon;
		this.baselat=obj.lat;
		this.baselatp=this.lat2latp(obj.lat);
		this.setScaleFactor();
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
		this.backdrop.connect("onmousedown", lang.hitch(this,"startDrag"));
		this.tilegroup.connect("onmousedown", lang.hitch(this,"startDrag"));
		this.surface.connect("onclick", lang.hitch(this,"clickSurface"));
		this.surface.connect("onmousemove", lang.hitch(this,"processMove"));
		this.surface.connect("onmousedown", lang.hitch(this,"mouseEvent"));
		this.surface.connect("onmouseup", lang.hitch(this,"mouseEvent"));
	},
	
	setController:function(_controller) {
		this.controller=_controller;
	},

	// Supplementary method for gfx - moveToPosition
	// This should ideally be core Dojo stuff: see http://bugs.dojotoolkit.org/ticket/15296

	moveToPosition:function(group,position) {
		var parent=group.getParent();
		if (!parent) { return; }
		this.moveChildToPosition(parent,group,position);
		if (position==group.rawNode.parentNode.childNodes.length) {
			group.rawNode.parentNode.appendChild(group.rawNode);
		} else {
			group.rawNode.parentNode.insertBefore(group.rawNode, group.rawNode.parentNode.childNodes[position]);
		}
	},

	moveChildToPosition: function(parent,child,position) {
		for(var i = 0; i < parent.children.length; ++i){
			if(parent.children[i] == child){
				parent.children.splice(i, 1);
				parent.children.splice(position, 0, child);
				break;
			}
		}
	},

	// Sprite and EntityUI handling

	sublayer:function(layer,groupType,sublayer) {
		// Sublayers are only implemented for stroke and fill
		var collection=this.layers[layer][groupType];
		switch (groupType) {
			case 'casing':
			case 'text':
			case 'hit':
				return collection;
		}
		// Find correct sublayer, inserting if necessary
		var insertAt=collection.children.length;
		for (var i=0; i<collection.children.length; i++) {
			var sub=collection.children[i];
			if (sub.sublayer==sublayer) { return sub; }
			else if (sub.sublayer>sublayer) {
				sub=collection.createGroup();
				this.moveToPosition(sub,i);
				sub.sublayer=sublayer;
				return sub;
			}
		}
		sub=collection.createGroup().moveToFront();
		sub.sublayer=sublayer;
		return sub;
	},
	
	createUI:function(entity,stateClasses) {
		var id=entity.id;
		switch (entity.entityType) {
			case 'node':
				if (!this.nodeuis[id]) { this.nodeuis[id]=new iD.renderer.NodeUI(entity,this,stateClasses); }
				                  else { this.nodeuis[id].setStateClasses(stateClasses).redraw(); }
				return this.nodeuis[id];
			case 'way':
				if (!this.wayuis[id]) { this.wayuis[id]=new iD.renderer.WayUI(entity,this,stateClasses); }
				                 else { this.wayuis[id].setStateClasses(stateClasses).redraw(); }
				return this.wayuis[id];
		}
	},

	getUI:function(entity) {
		switch (entity.entityType) {
			case 'node': 	return this.nodeuis[entity.id];
			case 'way': 	return this.wayuis[entity.id];
		}
		return null;
	},
	
	refreshUI:function(entity) {
		switch (entity.entityType) {
			case 'node': 	if (this.nodeuis[entity.id]) { this.nodeuis[entity.id].redraw(); } break;
			case 'way': 	if (this.wayuis[entity.id] ) { this.wayuis[entity.id].redraw(); } break;
		}
	},
	
	deleteUI:function(entity) {
		switch (entity.entityType) {
			case 'node': 	if (this.nodeuis[entity.id]) { this.nodeuis[entity.id].removeSprites(); delete this.nodeuis[entity.id]; } break;
			case 'way': 	if (this.wayuis[entity.id] ) { this.wayuis[entity.id].removeSprites();  delete this.wayuis[entity.id];  } break;
		}
	},
	
	// Ask connection to load data
	download:function() {
		this.conn.loadFromAPI(this.edgel, this.edger, this.edget, this.edgeb);
	},

	// Draw/refresh all EntityUIs within the bbox, and remove any others
	updateUIs:function(redraw,remove) {
		var m = this;
		var way, poi;
		var o = this.conn.getObjectsByBbox(this.edgel,this.edger,this.edget,this.edgeb);

		array.forEach(o.waysInside, function(way) {
			if (!way.loaded) return;
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

	// Zoom handling
	
	zoomIn:function() {
		if (this.scale!=this.MAXSCALE) { this.changeScale(this.scale+1); }
	},
	
	zoomOut:function() {
		if (this.scale!=this.MINSCALE) { this.changeScale(this.scale-1); }
		this.download();
	},

	changeScale:function(_scale) {
		this.scale=_scale;
		this.setScaleFactor();
		this.blankTiles();
		this.updateCoordsFromLatLon(this.centrelat,this.centrelon);	// recentre
		this.updateUIs(true,true);
	},
	
	setScaleFactor:function() {
		this.scalefactor=this.MASTERSCALE/Math.pow(2,13-this.scale);
	},

	// Elastic band redrawing
	
	clearElastic:function() {
		this.elastic.clear();
	},
	
	drawElastic:function(x1,y1,x2,y2) {
		this.elastic.clear();
		// **** Next line is SVG-specific
		this.elastic.rawNode.setAttribute("pointer-events","none");
		this.elastic.createPolyline( [{ x:x1, y:y1 }, { x:x2, y:y2 }] ).setStroke( {
			color: [0,0,0,1],
			style: 'Solid',
			width: 1 });
	},

	// Tile handling
	// ** FIXME: needs to have configurable URLs
	// ** FIXME: needs Bing attribution/logo etc.
	// ** FIXME: needs to be nudgable
	
	loadTiles:function() {
		var tile_l=this.lon2tile(this.edgel);
		var tile_r=this.lon2tile(this.edger);
		var tile_t=this.lat2tile(this.edget);
		var tile_b=this.lat2tile(this.edgeb);
		for (var x=tile_l; x<=tile_r; x++) {
			for (var y=tile_t; y<=tile_b; y++) {
				if (!this.getTile(this.scale,x,y)) { this.fetchTile(this.scale,x,y); }
			}
		}
	},
	
	fetchTile:function(z,x,y) {
		var t=this.tilegroup.createImage({
			x: this.lon2coord(this.tile2lon(x)),
			y: this.lat2coord(this.tile2lat(y)),
			width: 256, height: 256,
			src: this.tileURL(z,x,y)
		});
		this.assignTile(z,x,y,t);
	},
	
	getTile:function(z,x,y) {
		if (this.tiles[z]==undefined) { return undefined; }
		if (this.tiles[z][x]==undefined) { return undefined; }
		return this.tiles[z][x][y];
	},

	assignTile:function(z,x,y,t) {
		if (this.tiles[z]==undefined) { this.tiles[z]=[]; }
		if (this.tiles[z][x]==undefined) { this.tiles[z][x]=[]; }
		this.tiles[z][x][y]=t;
	},
	
	tileURL:function(z,x,y) {
		var u='';
		for (var zoom=z; zoom>0; zoom--) {
			var byte=0;
			var mask=1<<(zoom-1);
			if ((x & mask)!=0) byte++;
			if ((y & mask)!=0) byte+=2;
			u=u+byte.toString();
		}
		return this.tilebaseURL.replace('$z',z).replace('$x',x).replace('$y',y).replace('$quadkey',u);
	},
	
	blankTiles:function() {
		this.tilegroup.clear();
		this.tiles=[];
	},

	// Co-ordinate management, dragging and redraw

	startDrag:function(e) {
		var srcElement = (e.gfxTarget==this.backdrop) ? e.gfxTarget : e.gfxTarget.parent;
		Event.stop(e);
		this.dragging=true;
		this.dragged=false;
		this.dragx=this.dragy=NaN;
		this.startdragx=e.clientX;
		this.startdragy=e.clientY;
		this.dragconnect=srcElement.connect("onmouseup", lang.hitch(this,"endDrag"));
	},

	endDrag:function(e) {
		Event.stop(e);
		dojo.disconnect(this.dragconnect);
		this.dragging=false;
		this.dragtime=e.timeStamp;
		this.updateCoordsFromViewportPosition();
		if (Math.abs(e.clientX-this.startdragx)<3 && Math.abs(e.clientY-this.startdragy)<3) { return; }
		this.download();
	},

	processMove:function(e) {
		var x=e.clientX;
		var y=e.clientY;
		if (this.dragging) {
			if (this.dragx) {
				this.containerx+=(x-this.dragx);
				this.containery+=(y-this.dragy);
				this.updateOrigin();
				this.dragged=true;
			}
			this.dragx=x;
			this.dragy=y;
		} else {
			this.controller.entityMouseEvent(e,null);
		}
	},
	
	// Tell Dojo to update the viewport origin
	updateOrigin:function() {
		this.container.setTransform([Matrix.translate(this.containerx,this.containery)]);
		this.tilegroup.setTransform([Matrix.translate(this.containerx,this.containery)]);
	},
	
	mouseEvent:function(e) {
		// If the user mouses down within the fill of a shape, start the drag
		if (e.type=='mousedown') { this.startDrag(e); }
		// ** FIXME: we may want to reinstate this at some point...
		// this.controller.entityMouseEvent(e,null);
	},
	
	// Update centre and bbox from the current viewport origin
	updateCoordsFromViewportPosition:function(e) {
		this.updateCoords(this.containerx,this.containery);
	},
	
	// Update centre and bbox to a specified lat/lon
	updateCoordsFromLatLon:function(lat,lon) {
		this.updateCoords(-(this.lon2coord(lon)-this.mapwidth/2),
		                  -(this.lat2coord(lat)-this.mapheight/2));
	},

	// Set centre and bbox, called from the above methods
	updateCoords:function(x,y) {
		this.containerx=x; this.containery=y; this.updateOrigin();
		this.centrelon=this.coord2lon(-x + this.mapwidth/2);
		this.centrelat=this.coord2lat(-y + this.mapheight/2);
		this.edget=this.coord2lat(-y);
		this.edgeb=this.coord2lat(-y + this.mapheight);
		this.edgel=this.coord2lon(-x);
		this.edger=this.coord2lon(-x + this.mapwidth);
		this.loadTiles();
	},

	clickSurface:function(e) {
		if (this.dragged && e.timeStamp==this.dragtime) { return; }
		this.controller.entityMouseEvent(e,null);
	},

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
	mouseY:function(e) { return e.clientY - domGeom.getMarginBox(this.div).t - this.containery; },

});

// ----------------------------------------------------------------------
// End of module
});
