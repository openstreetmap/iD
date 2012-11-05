iD.Graph = function() { };

iD.Graph.prototype = {

    head: {},

    // stack of previous versions of this datastructure
    prev: [],

    insert: function(a) {
        for (var i = 0; i < a.length; i++) {
            if (this.head[a[i].id]) return;
            this.head[a[i].id] = a[i];
        }
    },

    modify: function(callback) {
        // Previous version pushed onto stack
        var o = pdata.object(this.head).get();
        prev.push(o);

        // Make head a copy with no common history
        this.head = pdata.object(this.head).get();
    },

    intersects: function(version, extent) {
        // summary:	Find all drawable entities that are within a given bounding box.
        // Each one is an array of entities.
        var items = [];
        for (var i in this.head) {
            if (this.head[i]) items.push(this.head[i]);
        }
        return items;
    },

    fetch: function(id) {
        var o = this.head[id];
        var f = _.clone(o);
        if (!f.nodes || !f.nodes.length) return f;
        f.nodes = f.nodes.map(function(c) {
            return this.fetch(c);
        }.bind(this));
        return f;
    }
};
