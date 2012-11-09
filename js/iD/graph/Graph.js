iD.Graph = function(entities, annotation) {
    this.entities = entities || {};
    this.annotation = annotation;
};

iD.Graph.prototype = {
    entity: function(id) {
        return this.entities[id];
    },

    // get all points that are not part of a way. this is an expensive
    // call that needs to be optimized.
    pois: function() {
        var included = [], pois = [], idx = {};
        for (var i in this.entities) {
            if (this.entities[i].nodes) {
                included = included.concat(this.entities[i].nodes);
            }
        }
        for (var j = 0; j < included.length; j++) { idx[included[j]] = true; }
        for (var k in this.entities) {
            if (this.entities[k].type === 'node' && !idx[this.entities[k].id]) {
                pois.push(this.entities[k]);
            }
        }
        return pois;
    },

    insert: function(a) {
        for (var i = 0; i < a.length; i++) {
            if (this.entities[a[i].id]) return;
            this.entities[a[i].id] = a[i];
        }
    },

    replace: function(entity, annotation) {
        var o = {};
        o[entity.id] = entity;
        return new iD.Graph(pdata.object(this.entities).set(o).get(), annotation);
    },

    remove: function(entity, annotation) {
        return new iD.Graph(pdata.object(this.entities).remove(entity.id).get(), annotation);
    },

    // get all objects that intersect an extent.
    intersects: function(extent) {
        var items = [];
        for (var i in this.entities) {
            if (this.entities[i]) items.push(this.entities[i]);
        }
        return items;
    },

    // Resolve the id references in a way, replacing them with actual objects.
    fetch: function(id) {
        var o = this.entities[id];
        var f = _.clone(o);
        if (!f.nodes || !f.nodes.length) return f;
        f.nodes = f.nodes.map(function(c) {
            return this.fetch(c);
        }.bind(this));
        return f;
    }
};
