if (typeof iD === 'undefined') iD = {};

// [Node](http://wiki.openstreetmap.org/wiki/Node)
iD.Node = function(connection, id, lat, lon, tags, loaded) {
	// summary: An OSM node.
	this.entityType = 'node';
	this.connection = connection;
	this.id = id;
	this._id = iD.Util.id();
	this.entity = iD.Entity();
	this.lat = lat;
	this.lon = lon;
    // TODO: keep or trash this custom
	this[0] = lon;
	this[1] = lat;
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
        return (this.lon >= extent[0][0]) &&
            (this.lon <= extent[1][0]) &&
            (this.lat <= extent[0][1]) &&
            (this.lat >= extent[1][1]);
    }
};
