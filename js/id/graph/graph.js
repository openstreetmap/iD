iD.Graph = function(other, mutable) {
    if (!(this instanceof iD.Graph)) return new iD.Graph(other, mutable);

    if (other instanceof iD.Graph) {
        var base = other.base();
        this.entities = _.assign(Object.create(base.entities), other.entities);
        this._parentWays = _.assign(Object.create(base.parentWays), other._parentWays);
        this.rebase(other.base(), other.entities);

    } else {
        this.entities = other || Object.create({});
        this._parentWays = Object.create({});

        for (var i in this.entities) {
            this._updateCalculated(undefined, this.entities[i]);
        }
    }

    this.transients = {};
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

    base: function() {
        return {
            'entities': iD.util.getPrototypeOf(this.entities),
            'parentWays': iD.util.getPrototypeOf(this._parentWays)
        };
    },

    // Unlike other graph methods, rebase mutates in place. This is because it
    // is used only during the history operation that merges newly downloaded
    // data into each state. To external consumers, it should appear as if the
    // graph always contained the newly downloaded data.
    rebase: function(base, entities) {
    },

    _updateCalculated: function(oldentity, entity) {

        var type = entity && entity.type || oldentity && oldentity.type,
            removed, added, parentWays, i;


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
                this._parentWays[removed[i]] = _.without(this._parentWays[removed[i]], oldentity.id);
            }
            for (i = 0; i < added.length; i++) {
                parentWays = _.without(this._parentWays[added[i]], entity.id);
                parentWays.push(entity.id);
                this._parentWays[added[i]] = parentWays;
            }
        } else if (type === 'node') {

        } else if (type === 'relation') {

            // TODO: iterate over members

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
