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
        function nodeIntersect(entity) {
            return entity.lon > extent[0][0] &&
                entity.lon < extent[1][0] &&
                entity.lat < extent[0][1] &&
                entity.lat > extent[1][1];
        }
        for (var i in this.entities) {
            var entity = this.entities[i];
            if (entity.type === 'node' && nodeIntersect(entity)) {
                items.push(entity);
            } else if (entity.type === 'way') {
                var w = this.fetch(entity.id);
                for (var j = 0; j < w.nodes.length; j++) {
                    if (nodeIntersect(w.nodes[j])) {
                        items.push(w);
                        break;
                    }
                }
            }
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
