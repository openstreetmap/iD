iD.Graph = function(entities, annotation) {
    if (!(this instanceof iD.Graph)) return new iD.Graph(entities, annotation);

    if (_.isArray(entities)) {
        this.entities = {};
        for (var i = 0; i < entities.length; i++) {
            this.entities[entities[i].id] = entities[i];
        }
    } else {
        this.entities = entities || {};
    }

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

    parentWays: function(id) {
        // This is slow and a bad hack.
        return _.filter(this.entities, function(e) {
            return e.type === 'way' && e.nodes.indexOf(id) !== -1;
        });
    },

    parentRelations: function(id) {
        // This is slow and a bad hack.
        return _.filter(this.entities, function(e) {
            return e.type === 'relation' && e.members.indexOf(id) !== -1;
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
            var entity = this.entities[i];
            if (entity.intersects(extent, this)) {
                items.push(this.fetch(entity.id));
            }
        }
        return items;
    },

    // Resolve the id references in a way, replacing them with actual objects.
    fetch: function(id) {
        var entity = this.entities[id], nodes = [];
        if (!entity.nodes || !entity.nodes.length) return iD.Entity(entity); // TODO: shouldn't be necessary
        for (var i = 0, l = entity.nodes.length; i < l; i++) {
            nodes[i] = this.fetch(entity.nodes[i]);
        }
        return iD.Entity(entity, {nodes: nodes});
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
