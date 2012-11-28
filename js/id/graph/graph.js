iD.Graph = function(entities, annotation) {
    if (!(this instanceof iD.Graph)) return new iD.Graph(entities, annotation);

    this.entities = entities || {};
    this.annotation = annotation;

    if (iD.debug) {
        Object.freeze(this);
        Object.freeze(this.entities);
    }
};

iD.Graph.prototype = {
    entity: function(id) {
        return this.entities[id];
    },

    parents: function(id) {
        // This is slow and a bad hack.
        return _.filter(this.entities, function(e) {
            if (e.type !== 'way') return false;
            return e.nodes.indexOf(id) !== -1;
        });
    },

    merge: function(graph) {
        var entities = _.clone(this.entities);
        _.defaults(entities, graph.entities);
        return iD.Graph(entities, this.annotation);
    },

    replace: function(entity, annotation) {
        var entities = _.clone(this.entities);
        entities[entity.id] = entity;
        var g = iD.Graph(entities, annotation);
        return g;
    },

    remove: function(entity, annotation) {
        var entities = _.clone(this.entities);
        delete entities[entity.id];
        return iD.Graph(entities, annotation);
    },

    nodeIntersect: function(entity, extent) {
        return entity.lon > extent[0][0] &&
            entity.lon < extent[1][0] &&
            entity.lat < extent[0][1] &&
            entity.lat > extent[1][1];
    },

    wayIntersect: function(entity, extent) {
        return entity._extent[0][0] > extent[0][0] &&
            entity._extent[1][0] < extent[1][0] &&
            entity._extent[0][1] < extent[0][1] &&
            entity._extent[1][1] > extent[1][1];
    },

    indexWay: function(way) {
        if (way.type === 'way' && !way._extent) {
            // top left, bottom right
            var extent = [[-Infinity, Infinity], [Infinity, -Infinity]];
            var w = way;
            for (var j = 0, l = w.nodes.length; j < l; j++) {
                if (w.nodes[j].lon > extent[0][0]) extent[0][0] = w.nodes[j].lon;
                if (w.nodes[j].lon < extent[1][0]) extent[1][0] = w.nodes[j].lon;
                if (w.nodes[j].lat < extent[0][1]) extent[0][1] = w.nodes[j].lat;
                if (w.nodes[j].lat > extent[1][1]) extent[1][1] = w.nodes[j].lat;
            }
            way._extent = extent;
        }
        return true;
    },

    // get all objects that intersect an extent.
    intersects: function(extent) {
        var items = [];
        for (var i in this.entities) {
            var entity = this.entities[i];
            if (entity.type === 'node' && this.nodeIntersect(entity, extent)) {
                items.push(entity);
            } else if (entity.type === 'way') {
                var w = this.fetch(entity.id);
                if (this.indexWay(w) && this.wayIntersect(w, extent)) items.push(w);
            }
        }
        return items;
    },

    // Resolve the id references in a way, replacing them with actual objects.
    fetch: function(id) {
        var entity = iD.Entity(this.entities[id]), nodes = [];
        if (!entity.nodes || !entity.nodes.length) return entity;
        for (var i = 0, l = entity.nodes.length; i < l; i++) {
            nodes[i] = this.fetch(entity.nodes[i]);
        }
        entity.nodes = nodes;
        return entity;
    },

    modifications: function() {
        return _.filter(this.entities, function(entity) {
            return entity.modified();
        }).map(function(e) {
            return this.fetch(e.id);
        }.bind(this));
    },

    creations: function() {
        return _.filter(this.entities, function(entity) {
            return entity.created();
        }).map(function(e) {
            return this.fetch(e.id);
        }.bind(this));
    }
};
