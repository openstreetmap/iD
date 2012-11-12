iD.Graph = function(entities, annotation) {
    if (!(this instanceof iD.Graph)) return new iD.Graph(entities, annotation);
    this.entities = entities || {};
    this.annotation = annotation;
};

iD.Graph.prototype = {
    entity: function(id) {
        return this.entities[id];
    },

    merge: function(graph) {
        var entities = _.clone(this.entities);
        _.defaults(entities, graph.entities);
        return iD.Graph(entities, this.annotation);
    },

    replace: function(entity, annotation) {
        var entities = _.clone(this.entities);
        entities[entity.id] = entity;
        return iD.Graph(entities, annotation);
    },

    remove: function(entity, annotation) {
        var entities = _.clone(this.entities);
        delete entities[entity.id];
        return iD.Graph(entities, annotation);
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
        var entity = iD.Entity(this.entities[id]);
        if (!entity.nodes || !entity.nodes.length) return entity;
        entity.nodes = entity.nodes.map(function(id) {
            return this.fetch(id);
        }.bind(this));
        return entity;
    }
};
