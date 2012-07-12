// iD/Node.js

define(['dojo/_base/declare','dojo/_base/array','dojo/_base/lang',
        'iD/Entity','iD/actions/AddNodeToWayAction','iD/actions/MoveNodeAction'
       ], function(declare,array,lang){

// ----------------------------------------------------------------------
// Node class

declare("iD.Node", [iD.Entity], {
	lat:NaN,
	latp:NaN,
	lon:NaN,
	entityType:"node",

	constructor:function(conn,id,lat,lon,tags,loaded) {
		// summary:		An OSM node.
		this.connection=conn;
		this.id=Number(id);
		this.lat=Number(lat);
		this.lon=Number(lon);
		this.tags=tags;
		this.loaded=(loaded==undefined) ? true : loaded;
		this.project();
		this.modified=this.id<0;
	},
	
	project:function() {
		// summary:		Update the projected latitude value (this.latp) from the latitude (this.lat).
		this.latp=180/Math.PI * Math.log(Math.tan(Math.PI/4+this.lat*(Math.PI/180)/2));
	},
	latp2lat:function(a) {
		// summary:		Get a latitude from a projected latitude.
		// returns:		Latitude.
		return 180/Math.PI * (2 * Math.atan(Math.exp(a*Math.PI/180)) - Math.PI/2);	// Number
	},

	within:function(left,right,top,bottom) { return (this.lon>=left) && (this.lon<=right) && (this.lat>=bottom) && (this.lat<=top) && !this.deleted; },

	refresh:function() {
		var ways=this.parentWays();
		var conn=this.connection;
		array.forEach(ways,function(way) { conn.refreshEntity(way); });
		this.connection.refreshEntity(this);
	},

	doSetLonLatp:function(lon,latproj,performAction) {
		// summary:		Change the position of a node, using an undo stack.
		performAction(new iD.actions.MoveNodeAction(this, this.latp2lat(latproj), lon, lang.hitch(this,this._setLatLonImmediate) ));
	},

	_setLatLonImmediate:function(lat,lon) {
		this.lat = lat;
		this.lon = lon;
		this.project();
		var ways = this.parentWays();
		for (var i=0; i<ways.length; i++) { ways[i].expandBbox(this); }
	},
	
});

// ----------------------------------------------------------------------
// End of module
});
