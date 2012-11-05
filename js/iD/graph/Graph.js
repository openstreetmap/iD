iD.Graph = function() { };

iD.Graph.prototype = {

    // a pointer to the top of the stack.
    head: {},

    // stack of previous versions of this datastructure
    prev: [],

    // messages
    annotations: [],

    // get all points that are not part of a way. this is an expensive
    // call that needs to be optimized.
    pois: function(head) {
        var included = [], pois = [], idx = {};
        for (var i in head) {
            if (head[i].nodes) {
                included = included.concat(head[i].nodes);
            }
        }
        for (var j = 0; j < included.length; j++) { idx[included[j]] = true; }
        for (var k in head) {
            if (head[k].type === 'node' && !idx[head[k].id]) {
                pois.push(head[k]);
            }
        }
        return pois;
    },

    insert: function(a) {
        for (var i = 0; i < a.length; i++) {
            if (this.head[a[i].id]) return;
            this.head[a[i].id] = a[i];
        }
    },

    modify: function(callback, annotation) {
        // create a pdata wrapper of current head
        var o = pdata.object(this.head);

        // Archive current version
        this.prev.push(o.get());

        // Let the operation make modification of a safe
        // copy
        var modified = callback(o);

        // Archive this version
        this.prev.push(modified.get());
        // Annotate this version
        this.annotations.push(annotation);

        // Make head the top of the previous stack
        this.head = this.prev[this.prev.length - 1];
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
