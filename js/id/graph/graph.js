iD.Graph = function(other, mutable) {
    if (!(this instanceof iD.Graph)) return new iD.Graph(other, mutable);

    if (other instanceof iD.Graph) {
        var base = other.base();
        this.entities = _.assign(Object.create(base.entities), other.entities);
        this._parentWays = _.assign(Object.create(base.parentWays), other._parentWays);
        this._parentRels = _.assign(Object.create(base.parentRels), other._parentRels);
        this.inherited = true;

    } else {
        if (_.isArray(other)) {
            var entities = {};
            for (var i = 0; i < other.length; i++) {
                entities[other[i].id] = other[i];
            }
            other = entities;
        }
        this.entities = Object.create({});
        this._parentWays = Object.create({});
        this._parentRels = Object.create({});
        this.rebase(other || {});
    }

    this.transients = {};
    this._childNodes = {};
    this.getEntity = _.bind(this.entity, this);

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
        return _.map(this._parentWays[entity.id], this.getEntity);
    },

    isPoi: function(entity) {
        var parentWays = this._parentWays[entity.id];
        return !parentWays || parentWays.length === 0;
    },

    isShared: function(entity) {
        var parentWays = this._parentWays[entity.id];
        return parentWays && parentWays.length > 1;
    },

    parentRelations: function(entity) {
        return _.map(this._parentRels[entity.id], this.getEntity);
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

    base: function() {
        return {
            'entities': iD.util.getPrototypeOf(this.entities),
            'parentWays': iD.util.getPrototypeOf(this._parentWays),
            'parentRels': iD.util.getPrototypeOf(this._parentRels)
        };
    },

    // Unlike other graph methods, rebase mutates in place. This is because it
    // is used only during the history operation that merges newly downloaded
    // data into each state. To external consumers, it should appear as if the
    // graph always contained the newly downloaded data.
    rebase: function(entities) {
        var base = this.base(),
            i, k, child, id, keys;
        // Merging of data only needed if graph is the base graph
        if (!this.inherited) {
            for (i in entities) {
                if (!base.entities[i]) {
                    base.entities[i] = entities[i];
                    this._updateCalculated(undefined, entities[i],
                            base.parentWays, base.parentRels);
                }
            }
        }

        keys = Object.keys(this._parentWays);
        for (i = 0; i < keys.length; i++) {
            child = keys[i];
            if (base.parentWays[child]) {
                for (k = 0; k < base.parentWays[child].length; k++) {
                    id = base.parentWays[child][k];
                    if (this.entity(id) && !_.contains(this._parentWays[child], id)) {
                        this._parentWays[child].push(id);
                    }
                }
            }
        }

        keys = Object.keys(this._parentRels);
        for (i = 0; i < keys.length; i++) {
            child = keys[i];
            if (base.parentRels[child]) {
                for (k = 0; k < base.parentRels[child].length; k++) {
                    id = base.parentRels[child][k];
                    if (this.entity(id) && !_.contains(this._parentRels[child], id)) {
                        this._parentRels[child].push(id);
                    }
                }
            }
        }
    },

    // Updates calculated properties (parentWays, parentRels) for the specified change
    _updateCalculated: function(oldentity, entity, parentWays, parentRels) {

        parentWays = parentWays || this._parentWays;
        parentRels = parentRels || this._parentRels;

        var type = entity && entity.type || oldentity && oldentity.type,
            removed, added, ways, rels, i;


        if (type === 'way') {

            // Update parentWays
            if (oldentity && entity) {
                removed = _.difference(oldentity.nodes, entity.nodes);
                added = _.difference(entity.nodes, oldentity.nodes);
            } else if (oldentity) {
                removed = oldentity.nodes;
                added = [];
            } else if (entity) {
                removed = [];
                added = entity.nodes;
            }
            for (i = 0; i < removed.length; i++) {
                parentWays[removed[i]] = _.without(parentWays[removed[i]], oldentity.id);
            }
            for (i = 0; i < added.length; i++) {
                ways = _.without(parentWays[added[i]], entity.id);
                ways.push(entity.id);
                parentWays[added[i]] = ways;
            }
        } else if (type === 'node') {

        } else if (type === 'relation') {

            // Update parentRels
            if (oldentity && entity) {
                removed = _.difference(oldentity.members, entity.members);
                added = _.difference(entity.members, oldentity);
            } else if (oldentity) {
                removed = oldentity.members;
                added = [];
            } else if (entity) {
                removed = [];
                added = entity.members;
            }
            for (i = 0; i < removed.length; i++) {
                parentRels[removed[i].id] = _.without(parentRels[removed[i].id], oldentity.id);
            }
            for (i = 0; i < added.length; i++) {
                rels = _.without(parentRels[added[i].id], entity.id);
                rels.push(entity.id);
                parentRels[added[i].id] = rels;
            }
        }
    },

    replace: function(entity) {
        return this.update(function () {
            this._updateCalculated(this.entities[entity.id], entity);
            this.entities[entity.id] = entity;
        });
    },

    remove: function(entity) {
        return this.update(function () {
            this._updateCalculated(entity, undefined);
            this.entities[entity.id] = undefined;
        });
    },

    update: function() {
        var graph = this.frozen ? iD.Graph(this, true) : this;

        for (var i = 0; i < arguments.length; i++) {
            arguments[i].call(graph, graph);
        }

        return this.frozen ? graph.freeze() : this;
    },

    freeze: function() {
        this.frozen = true;

        if (iD.debug) {
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
        var result = [],
            keys = Object.keys(this.entities),
            entity, oldentity, id, i;

        for (i = 0; i < keys.length; i++) {
            id = keys[i];
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

        keys = Object.keys(graph.entities);
        for (i = 0; i < keys.length; i++) {
            id = keys[i];
            entity = graph.entities[id];
            if (entity && !this.entities.hasOwnProperty(id)) {
                result.push(id);
                if (entity.type === 'way') result = result.concat(entity.nodes);
            }
        }

        return result.sort();
    },

    modified: function() {
        var result = [], base = this.base().entities;
        _.each(this.entities, function(entity, id) {
            if (entity && base[id]) result.push(id);
        });
        return result;
    },

    created: function() {
        var result = [], base = this.base().entities;
        _.each(this.entities, function(entity, id) {
            if (entity && !base[id]) result.push(id);
        });
        return result;
    },

    deleted: function() {
        var result = [], base = this.base().entities;
        _.each(this.entities, function(entity, id) {
            if (!entity && base[id]) result.push(id);
        });
        return result;
    }
};
