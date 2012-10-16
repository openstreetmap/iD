// iD/Node.js
if (typeof iD === 'undefined') iD = {};
iD.Node = function(conn, id, lat, lon, tags, loaded) {
	// summary: An OSM node.
	this.entityType = 'node';
	this.connection = conn;
	this.id = id;
	this.lat = lat;
	this.lon = lon;
	this.tags = tags;
	this.loaded = (loaded === undefined) ? true : loaded;
	this.project();
	this.modified = this.id < 0;
};

iD.Node.prototype = {
	project: function() {
		// summary:		Update the projected latitude value (this.latp) from the latitude (this.lat).
		this.latp = 180/Math.PI * Math.log(Math.tan(Math.PI/4+this.lat*(Math.PI/180)/2));
	},
	latp2lat: function(a) {
		// summary:		Get a latitude from a projected latitude.
		// returns:		Latitude.
		return 180/Math.PI * (2 * Math.atan(Math.exp(a*Math.PI/180)) - Math.PI/2);	// Number
	},

	within: function(left, right, top, bottom) {
        return (this.lon >= left) &&
            (this.lon <= right) &&
            (this.lat >= bottom) &&
            (this.lat <= top);
    },

	refresh: function() {
		var ways=this.parentWays();
		var conn=this.connection;
		array.forEach(ways,function(way) { conn.refreshEntity(way); });
		this.connection.refreshEntity(this);
	},

	doSetLonLatp: function(lon,latproj,performAction) {
		// summary:		Change the position of a node, using an undo stack.
		performAction(new iD.actions.MoveNodeAction(this,
            this.latp2lat(latproj),
            lon,
            lang.hitch(this,this._setLatLonImmediate)));
	},

	_setLatLonImmediate: function(lat,lon) {
		this.lat = lat;
		this.lon = lon;
		this.project();
		var ways = this.parentWays();
        _.each(ways, _.bind(function(way) {
            way.expandBbox(this);
        }, this));
	}
};
