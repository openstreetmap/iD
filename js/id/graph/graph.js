iD.Graph = function(entities) {
    if (!(this instanceof iD.Graph)) return new iD.Graph(entities);

    if (_.isArray(entities)) {
        this.entities = {};
        for (var i = 0; i < entities.length; i++) {
            this.entities[entities[i].id] = entities[i];
        }
    } else {
        this.entities = entities || {};
    }

    if (iD.debug) {
        Object.freeze(this);
        Object.freeze(this.entities);
    }
};

iD.Graph.prototype = {
    entity: function(id) {
        return this.entities[id];
    },

    parentWays: function(id) {
        // This is slow and a bad hack.
        return _.filter(this.entities, function(e) {
            return e && e.type === 'way' && e.nodes.indexOf(id) !== -1;
        });
    },

    parentRelations: function(id) {
        // This is slow and a bad hack.
        return _.filter(this.entities, function(e) {
            return e && e.type === 'relation' && e.members.indexOf(id) !== -1;
        });
    },

    merge: function(graph) {
        var entities = _.clone(this.entities);
        _.defaults(entities, graph.entities);
        return iD.Graph(entities);
    },

    replace: function(entity) {
        var entities = _.clone(this.entities);
        entities[entity.id] = entity;
        return iD.Graph(entities);
    },

    remove: function(entity) {
        var entities = _.clone(this.entities);

        if (entity.created()) {
            delete entities[entity.id];
        } else {
            entities[entity.id] = undefined;
        }

        return iD.Graph(entities);
    },

    // get all objects that intersect an extent.
    intersects: function(extent) {
        var items = [];
        for (var i in this.entities) {
            var entity = this.entities[i];
            if (entity && entity.intersects(extent, this)) {
                items.push(this.fetch(entity.id));
            }
        }
        return items;
    },

    // Resolve the id references in a way, replacing them with actual objects.
    fetch: function(id) {
        var entity = this.entities[id], nodes = [];
        if (!entity || !entity.nodes || !entity.nodes.length) return entity;
        for (var i = 0, l = entity.nodes.length; i < l; i++) {
            nodes[i] = this.fetch(entity.nodes[i]);
        }
        return iD.Entity(entity, {nodes: nodes});
    },

    difference: function (graph) {
        var result = [];

        _.each(this.entities, function(entity, id) {
            if (entity !== graph.entities[id]) {
                result.push(id);
            }
        });

        _.each(graph.entities, function(entity, id) {
            if (entity && !this.entities.hasOwnProperty(id)) {
                result.push(id);
            }
        }, this);

        return result.sort();
    },

    modified: function() {
        var result = [];
        _.each(this.entities, function(entity, id) {
            if (entity && entity.modified()) result.push(id);
        });
        return result;
    },

    created: function() {
        var result = [];
        _.each(this.entities, function(entity, id) {
            if (entity && entity.created()) result.push(id);
        });
        return result;
    },

    deleted: function() {
        var result = [];
        _.each(this.entities, function(entity, id) {
            if (!entity) result.push(id);
        });
        return result;
    }
};
