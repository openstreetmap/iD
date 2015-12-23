iD.Graph = function(other, mutable) {
    if (!(this instanceof iD.Graph)) return new iD.Graph(other, mutable);

    if (other instanceof iD.Graph) {
        var base = other.base();
        this.entities = _.assign(Object.create(base.entities), other.entities);
        this._parentWays = _.assign(Object.create(base.parentWays), other._parentWays);
        this._parentRels = _.assign(Object.create(base.parentRels), other._parentRels);

    } else {
        this.entities = Object.create({});
        this._parentWays = Object.create({});
        this._parentRels = Object.create({});
        this.rebase(other || [], [this]);
    }

    this.transients = {};
    this._childNodes = {};
    this.frozen = !mutable;
};

iD.Graph.prototype = {
    hasEntity: function(id) {
        return this.entities[id];
    },

    entity: function(id) {
        var entity = this.entities[id];
        if (!entity) {
            throw new Error('entity ' + id + ' not found');
        }
        return entity;
    },

    transient: function(entity, key, fn) {
        var id = entity.id,
            transients = this.transients[id] ||
            (this.transients[id] = {});

        if (transients[key] !== undefined) {
            return transients[key];
        }

        transients[key] = fn.call(entity);

        return transients[key];
    },

    parentWays: function(entity) {
        var parents = this._parentWays[entity.id],
            result = [];

        if (parents) {
            for (var i = 0; i < parents.length; i++) {
                result.push(this.entity(parents[i]));
            }
        }
        return result;
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
        var parents = this._parentRels[entity.id],
            result = [];

        if (parents) {
            for (var i = 0; i < parents.length; i++) {
                result.push(this.entity(parents[i]));
            }
        }
        return result;
    },

    childNodes: function(entity) {
        if (this._childNodes[entity.id]) return this._childNodes[entity.id];
        if (!entity.nodes) return [];

        var nodes = [];
        for (var i = 0; i < entity.nodes.length; i++) {
            nodes[i] = this.entity(entity.nodes[i]);
        }

        if (iD.debug) Object.freeze(nodes);

        this._childNodes[entity.id] = nodes;
        return this._childNodes[entity.id];
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
    rebase: function(entities, stack, force) {
        var base = this.base(),
            i, j, k, id;

        for (i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (!entity.visible || (!force && base.entities[entity.id]))
                continue;

            // Merging data into the base graph
            base.entities[entity.id] = entity;
            this._updateCalculated(undefined, entity, base.parentWays, base.parentRels);

            // Restore provisionally-deleted nodes that are discovered to have an extant parent
            if (entity.type === 'way') {
                for (j = 0; j < entity.nodes.length; j++) {
                    id = entity.nodes[j];
                    for (k = 1; k < stack.length; k++) {
                        var ents = stack[k].entities;
                        if (ents.hasOwnProperty(id) && ents[id] === undefined) {
                            delete ents[id];
                        }
                    }
                }
            }
        }

        for (i = 0; i < stack.length; i++) {
            stack[i]._updateRebased();
        }
    },

    _updateRebased: function() {
        var base = this.base(),
            i, k, child, id, keys;

        keys = Object.keys(this._parentWays);
        for (i = 0; i < keys.length; i++) {
            child = keys[i];
            if (base.parentWays[child]) {
                for (k = 0; k < base.parentWays[child].length; k++) {
                    id = base.parentWays[child][k];
                    if (!this.entities.hasOwnProperty(id) && !_.contains(this._parentWays[child], id)) {
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
                    if (!this.entities.hasOwnProperty(id) && !_.contains(this._parentRels[child], id)) {
                        this._parentRels[child].push(id);
                    }
                }
            }
        }

        this.transients = {};

        // this._childNodes is not updated, under the assumption that
        // ways are always downloaded with their child nodes.
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
        if (this.entities[entity.id] === entity)
            return this;

        return this.update(function() {
            this._updateCalculated(this.entities[entity.id], entity);
            this.entities[entity.id] = entity;
        });
    },

    remove: function(entity) {
        return this.update(function() {
            this._updateCalculated(entity, undefined);
            this.entities[entity.id] = undefined;
        });
    },

    revert: function(id) {
        var baseEntity = this.base().entities[id],
            headEntity = this.entities[id];

        if (headEntity === baseEntity)
            return this;

        return this.update(function() {
            this._updateCalculated(headEntity, baseEntity);
            delete this.entities[id];
        });
    },

    update: function() {
        var graph = this.frozen ? iD.Graph(this, true) : this;

        for (var i = 0; i < arguments.length; i++) {
            arguments[i].call(graph, graph);
        }

        if (this.frozen) graph.frozen = true;

        return graph;
    },

    // Obliterates any existing entities
    load: function(entities) {
        var base = this.base();
        this.entities = Object.create(base.entities);

        for (var i in entities) {
            this.entities[i] = entities[i];
            this._updateCalculated(base.entities[i], this.entities[i]);
        }

        return this;
    }
};
