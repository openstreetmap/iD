iD.Node = function(id, lat, lon, tags, loaded) {
	this.id = id;
	this._id = iD.Util.id();
	this.lat = lat;
	this.lon = lon;
	this[0] = lon;
	this[1] = lat;
	this.tags = tags || {};
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

iD.Util.extend(iD.Node, iD.Entity);
