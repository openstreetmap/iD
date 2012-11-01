iD.Node = function(id, lat, lon, tags, loaded) {
	this.id = id;
	this.lat = lat;
	this.lon = lon;
	this.tags = tags || {};
    this.children = [];
	this.loaded = (loaded === undefined) ? true : loaded;
};

iD.Node.prototype = {

    type: 'node',

    intersects: function(extent) {
        return (this.lon >= extent[0][0]) &&
            (this.lon <= extent[1][0]) &&
            (this.lat <= extent[0][1]) &&
            (this.lat >= extent[1][1]);
    }

};
