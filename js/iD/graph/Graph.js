iD.Graph = function() {
};

iD.Graph.prototype = {

    index: {},

    insert: function(o) {
        var obj;
        // Do not reinsert OSM objects
        if (this.index[o.id]) return;
        if (o.type === 'node') {
            obj = {
                type: 'node',
                id: o.id,
                uid: uuid.v4(),
                lat: o.lat,
                lon: o.lon,
                tags: o.tags
            };
        } else if (o.type === 'way') {
            obj = new iD.Way(
                o.id,
                uuid.v4(),
                o.nodes,
                o.tags);
        } else if (o.type === 'relation') {
            obj = new iD.Relation(
                o.id,
                uuid.v4(),
                o.members,
                o.tags);
        }
        if (!obj) return;
        this.index[obj.id] = [obj];
    },

    intersects: function(version, extent) {
        // summary:	Find all drawable entities that are within a given bounding box.
        // Each one is an array of entities.
        var items = [];
        for (var i in this.index) {
            if (this.index[i][version]) {
                items.push(this.index[i][version]);
            }
        }
        return items;
    },

    fetch: function(object) {
        var o = this.index[object][0];
        var f = _.clone(o);
        if (!f.children || !f.children.length) return f;
        f.children = f.children.map(function(c) {
            return this.fetch(c);
        }.bind(this));
        return f;
    }
};
