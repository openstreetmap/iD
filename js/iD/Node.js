if (typeof iD === 'undefined') iD = {};

iD.Node = function(connection, id, lat, lon, tags, loaded) {
	// summary: An OSM node.
	this.entityType = 'node';
	this.connection = connection;
	this.id = id;
	this._id = iD.Util.id();
	this.entity = new iD.Entity();
	this.lat = lat;
	this.lon = lon;
	this.tags = tags;
	this.loaded = (loaded === undefined) ? true : loaded;
	this.modified = this.id < 0;
};

iD.Node.prototype = {
    toGeoJSON: function() {
        return {
            type: 'Feature',
            properties: this.tags,
            geometry: {
                type: 'Point',
                coordinates: [this.lon, this.lat]
            }
        };
    },

    within: function(extent) {
        return (this.lon >= extent[0].lon) &&
            (this.lon <= extent[1].lon) &&
            (this.lat <= extent[0].lat) &&
            (this.lat >= extent[1].lat);
    },

    refresh: function() {
        var ways = this.parentWays();
        _.each(ways, _.bind(function(way) { this.connection.refreshEntity(way); }, this));
        this.connection.refreshEntity(this);
    },

    doSetLonLatp: function(lon, latproj, performAction) {
        // summary:		Change the position of a node, using an undo stack.
        performAction(new iD.actions.MoveNodeAction(this,
            this.latp2lat(latproj),
            lon,
            _.bind(this._setLatLonImmediate, this)));
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
