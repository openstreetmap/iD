iD.Graph = function() { };

iD.Graph.prototype = {

    // a pointer to the top of the stack.
    head: {},
    // a pointer to the latest annotation
    annotation: null,

    // stack of previous versions of this datastructure
    prev: [],
    // stack of previous annotations
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

    // rewind and fast-forward the graph. these preserve the other modes of the
    // graph. these attempt to skip over any edits that didn't have an annotation,
    // like 'invisible edits' and sub-edits.
    undo: function() {
        if (this.prev.length && this.prev[0] !== this.head) {
            for (var idx = this.prev.indexOf(this.head) - 1; idx > 0; idx--) {
                if (this.annotations[idx]) break;
            }
            this.head = this.prev[idx];
            this.annotation = this.annotations[idx];
        }
    },
    redo: function() {
        if (this.prev.length && this.prev[this.prev.length - 1] !== this.head) {
            for (var idx = this.prev.indexOf(this.head) + 1; idx < this.prev.length - 1; idx++) {
                if (this.annotations[idx]) break;
            }
            this.head = this.prev[idx];
            this.annotation = this.annotations[idx];
        }
    },

    insert: function(a) {
        for (var i = 0; i < a.length; i++) {
            if (this.head[a[i].id]) return;
            this.head[a[i].id] = a[i];
        }
    },

    // the gist of all operations on the graph: the callback function
    // receives the current graph and returns a modified graph. the graph
    // given to the callback is guaranteed to be immutable at one level - the
    // key -> object mappings. the callback is responsible for keeping objects
    // in the graph immutable.
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
        this.annotation = this.annotations[this.annotations.length - 1];
    },

    // get all objects that intersect an extent.
    intersects: function(extent) {
        var items = [];
        for (var i in this.head) {
            if (this.head[i]) items.push(this.head[i]);
        }
        return items;
    },

    // Resolve the id references in a way, replacing them with actual objects.
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
