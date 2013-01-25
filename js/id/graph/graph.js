iD.Graph = function(entities, mutable) {
    if (!(this instanceof iD.Graph)) return new iD.Graph(entities, mutable);

    if (_.isArray(entities)) {
        this.entities = {};
        for (var i = 0; i < entities.length; i++) {
            this.entities[entities[i].id] = entities[i];
        }
    } else {
        this.entities = entities || {};
    }

    this.transients = {};
    this._parentWays = {};
    this._parentRels = {};
    this._childNodes = {};

    if (!mutable) {
        this.freeze();
    }
};

iD.Graph.prototype = {
    entity: function(id) {
        return this.entities[id];
    },

    transient: function(entity, key, fn) {
        var id = entity.id,
            transients = this.transients[id] ||
            (this.transients[id] = {});

        if (transients[key] !== undefined) {
            return transients[key];
        }

        return transients[key] = fn.call(entity);
    },

    parentWays: function(entity) {
        var ent, id, parents;

        if (!this._parentWays.calculated) {
            for (var i in this.entities) {
                ent = this.entities[i];
                if (ent && ent.type === 'way') {
                    for (var j = 0; j < ent.nodes.length; j++) {
                        id = ent.nodes[j];
                        parents = this._parentWays[id] = this._parentWays[id] || [];
                        if (parents.indexOf(ent) < 0) {
                            parents.push(ent);
                        }
                    }
                }
            }
            this._parentWays.calculated = true;
        }

        return this._parentWays[entity.id] || [];
    },

    isPoi: function(entity) {
        return this.parentWays(entity).length === 0;
    },

    parentRelations: function(entity) {
        var ent, id, parents;

        if (!this._parentRels.calculated) {
            for (var i in this.entities) {
                ent = this.entities[i];
                if (ent && ent.type === 'relation') {
                    for (var j = 0; j < ent.members.length; j++) {
                        id = ent.members[j].id;
                        parents = this._parentRels[id] = this._parentRels[id] || [];
                        if (parents.indexOf(ent) < 0) {
                            parents.push(ent);
                        }
                    }
                }
            }
            this._parentRels.calculated = true;
        }

        return this._parentRels[entity.id] || [];
    },

    childNodes: function(entity) {
        if (this._childNodes[entity.id])
            return this._childNodes[entity.id];

        var nodes = [];
        for (var i = 0, l = entity.nodes.length; i < l; i++) {
            nodes[i] = this.entity(entity.nodes[i]);
        }

        return (this._childNodes[entity.id] = nodes);
    },

    merge: function(graph) {
        return this.update(function () {
            _.defaults(this.entities, graph.entities);
        });
    },

    replace: function(entity) {
        return this.update(function () {
            this.entities[entity.id] = entity;
        });
    },

    remove: function(entity) {
        return this.update(function () {
            if (entity.created()) {
                delete this.entities[entity.id];
            } else {
                this.entities[entity.id] = undefined;
            }
        });
    },

    update: function() {
        var graph = this.frozen ? iD.Graph(_.clone(this.entities), true) : this;

        for (var i = 0; i < arguments.length; i++) {
            arguments[i].call(graph, graph);
        }

        return this.frozen ? graph.freeze() : this;
    },

    freeze: function() {
        this.frozen = true;

        if (iD.debug) {
            Object.freeze(this);
            Object.freeze(this.entities);
        }

        return this;
    },

    // get all objects that intersect an extent.
    intersects: function(extent) {
        var items = [];
        for (var i in this.entities) {
            var entity = this.entities[i];
            if (entity && entity.intersects(extent, this)) {
                items.push(entity);
            }
        }
        return items;
    },

    difference: function (graph) {
        var result = [], entity, oldentity, id;

        for (id in this.entities) {
            entity = this.entities[id];
            oldentity = graph.entities[id];
            if (entity !== oldentity) {

                if (entity && entity.type === 'way' &&
                    oldentity && oldentity.type === 'way') {
                    result = result
                            .concat(_.difference(entity.nodes, oldentity.nodes))
                            .concat(_.difference(oldentity.nodes, entity.nodes));

                } else if (entity && entity.type === 'way') {
                    result = result.concat(entity.nodes);

                } else if (oldentity && oldentity.type === 'way') {
                    result = result.concat(oldentity.nodes);
                }

                result.push(id);
            }
        }

        for (id in graph.entities) {
            entity = graph.entities[id];
            if (entity && !this.entities.hasOwnProperty(id)) {
                result.push(id);
                if (entity.type === 'way') result = result.concat(entity.nodes);
            }
        }

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
