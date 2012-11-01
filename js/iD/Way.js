// Way
// wiki: http://wiki.openstreetmap.org/wiki/Way
//
// Ways can either be open or closed. A closed way is such that the
// last node is the first node.
//
// If a a way is _closed_, it is assumed to be an area unless it has a
// `highway` or `barrier` tag and is not also tagged `area`.
iD.Way = function(id, children, tags, loaded) {
    this.id = id;
    this._id = iD.Util.id();
    this.tags = tags || {};
    this.children = children || [];
    this.loaded = (loaded === undefined) ? true : loaded;
    this.extent = {};
};

iD.Way.prototype = {

    type: 'way',

    // JOSM: http://josm.openstreetmap.de/browser/josm/trunk/src/org/openstreetmap/josm/data/osm/Way.java#L466
    isClosed: function() {
        // summary:	Is this a closed way (first and last nodes the same)?
        if (!this.children.length) return true;
        return this.children[this.children.length - 1] === this.children[0];
    },

    isType: function(type) {
        // summary:	Is this a 'way' (always true), an 'area' (closed) or a 'line' (unclosed)?
        if (type === 'way') return true;
        if (type === 'area') return this.isClosed();
        if (type === 'line') return !(this.isClosed());
        return false;	// Boolean
    },

    updateBounds: function() {
        this._bounds = d3.geo.bounds(iD.GeoJSON.mapping(this));
    },

    bounds: function() {
        // TODO: cache
        if (!this._bounds) this.updateBounds();
        return this._bounds;
    },

    // ---------------------
    // Bounding-box handling
    intersects: function(extent) {
        // TODO: rewrite with new id-mapping
        return true;
        // No-node ways are inside of nothing.
        if (!this.children.length) return false;
        var bounds = this.bounds();
        // left
        return !(
            // the bottom right is to the top-left
            // of the top-left
            bounds[1][0] < extent[0][0] &&
            bounds[1][1] < extent[0][1] ||
            // The top left is to the bottom-right
            // of the top-left
            bounds[0][0] > extent[1][0] &&
            bounds[0][1] > extent[1][1]);
    }
};

// iD.Util.extend(iD.Way, iD.Entity);
