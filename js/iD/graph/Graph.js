iD.Graph = function(entities, annotation) {
    if (!(this instanceof iD.Graph)) return new iD.Graph(entities, annotation);
    this.entities = entities || {};
    for (var id in this.entities) {
        if (this.entities[id].type === 'way') {
            // top left, bottom right
            var extent = [
                [-Infinity, Infinity],
                [Infinity, -Infinity]];
            var w = this.fetch(id);
            for (var j = 0, l = w.nodes.length; j < l; j++) {
                if (w.nodes[j].lon > extent[0][0]) extent[0][0] = w.nodes[j].lon;
                if (w.nodes[j].lon < extent[1][0]) extent[1][0] = w.nodes[j].lon;

                if (w.nodes[j].lat < extent[0][1]) extent[0][1] = w.nodes[j].lat;
                if (w.nodes[j].lat > extent[1][1]) extent[1][1] = w.nodes[j].lat;
            }
            this.entities[id]._extent = extent;
        }
    }
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
        function wayIntersect(entity) {
            return entity._extent[0][0] > extent[0][0] &&
                entity._extent[1][0] < extent[1][0] &&
                entity._extent[0][1] < extent[0][1] &&
                entity._extent[1][1] > extent[1][1];
        }
        for (var i in this.entities) {
            var entity = this.entities[i];
            if (entity.type === 'node' && nodeIntersect(entity)) {
                items.push(entity);
            } else if (entity.type === 'way') {
                var w = this.fetch(entity.id);
                if (wayIntersect(w)) items.push(w);
            }
        }
        return items;
    },

    // Resolve the id references in a way, replacing them with actual objects.
    fetch: function(id) {
        var entity = iD.Entity(this.entities[id]);
        if (!entity.nodes || !entity.nodes.length) return entity;
        var nodes = [];
        for (var i = 0, l = entity.nodes.length; i < l; i++) {
            nodes[i] = this.fetch(entity.nodes[i]);
        }
        entity.nodes = nodes;
        return entity;
    }
};
