import { debug } from '../index';
import { utilArrayDifference } from '../util';


export function coreGraph(other, mutable) {
    if (!(this instanceof coreGraph)) return new coreGraph(other, mutable);

    if (other instanceof coreGraph) {
        var base = other.base();
        this.entities = Object.assign(Object.create(base.entities), other.entities);
        this._parentWays = Object.assign(Object.create(base.parentWays), other._parentWays);
        this._parentRels = Object.assign(Object.create(base.parentRels), other._parentRels);

    } else {
        this.entities = Object.create({});
        this._parentWays = Object.create({});
        this._parentRels = Object.create({});
        this.rebase(other || [], [this]);
    }

    this.transients = {};
    this._childNodes = {};
    this.frozen = !mutable;
}


coreGraph.prototype = {

    hasEntity: function(id) {
        return this.entities[id];
    },


    entity: function(id) {
        var entity = this.entities[id];

        //https://github.com/openstreetmap/iD/issues/3973#issuecomment-307052376
        if (!entity) {
            entity = this.entities.__proto__[id];  // eslint-disable-line no-proto
        }

        if (!entity) {
            throw new Error('entity ' + id + ' not found');
        }
        return entity;
    },


    geometry: function(id) {
        return this.entity(id).geometry(this);
    },


    transient: function(entity, key, fn) {
        var id = entity.id;
        var transients = this.transients[id] || (this.transients[id] = {});

        if (transients[key] !== undefined) {
            return transients[key];
        }

        transients[key] = fn.call(entity);

        return transients[key];
    },


    parentWays: function(entity) {
        var parents = this._parentWays[entity.id];
        var result = [];
        if (parents) {
            parents.forEach(function(id) {
                result.push(this.entity(id));
            }, this);
        }
        return result;
    },


    isPoi: function(entity) {
        var parents = this._parentWays[entity.id];
        return !parents || parents.size === 0;
    },


    isShared: function(entity) {
        var parents = this._parentWays[entity.id];
        return parents && parents.size > 1;
    },


    parentRelations: function(entity) {
        var parents = this._parentRels[entity.id];
        var result = [];
        if (parents) {
            parents.forEach(function(id) {
                result.push(this.entity(id));
            }, this);
        }
        return result;
    },

    parentMultipolygons: function(entity) {
        return this.parentRelations(entity).filter(function(relation) {
            return relation.isMultipolygon();
        });
    },


    childNodes: function(entity) {
        if (this._childNodes[entity.id]) return this._childNodes[entity.id];
        if (!entity.nodes) return [];

        var nodes = [];
        for (var i = 0; i < entity.nodes.length; i++) {
            nodes[i] = this.entity(entity.nodes[i]);
        }

        if (debug) Object.freeze(nodes);

        this._childNodes[entity.id] = nodes;
        return this._childNodes[entity.id];
    },


    base: function() {
        return {
            'entities': Object.getPrototypeOf(this.entities),
            'parentWays': Object.getPrototypeOf(this._parentWays),
            'parentRels': Object.getPrototypeOf(this._parentRels)
        };
    },


    // Unlike other graph methods, rebase mutates in place. This is because it
    // is used only during the history operation that merges newly downloaded
    // data into each state. To external consumers, it should appear as if the
    // graph always contained the newly downloaded data.
    rebase: function(entities, stack, force) {
        var base = this.base();
        var i, j, k, id;

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
        var base = this.base();

        Object.keys(this._parentWays).forEach(function(child) {
            if (base.parentWays[child]) {
                base.parentWays[child].forEach(function(id) {
                    if (!this.entities.hasOwnProperty(id)) {
                        this._parentWays[child].add(id);
                    }
                }, this);
            }
        }, this);

        Object.keys(this._parentRels).forEach(function(child) {
            if (base.parentRels[child]) {
                base.parentRels[child].forEach(function(id) {
                    if (!this.entities.hasOwnProperty(id)) {
                        this._parentRels[child].add(id);
                    }
                }, this);
            }
        }, this);

        this.transients = {};

        // this._childNodes is not updated, under the assumption that
        // ways are always downloaded with their child nodes.
    },


    // Updates calculated properties (parentWays, parentRels) for the specified change
    _updateCalculated: function(oldentity, entity, parentWays, parentRels) {
        parentWays = parentWays || this._parentWays;
        parentRels = parentRels || this._parentRels;

        var type = entity && entity.type || oldentity && oldentity.type;
        var removed, added, i;

        if (type === 'way') {   // Update parentWays
            if (oldentity && entity) {
                removed = utilArrayDifference(oldentity.nodes, entity.nodes);
                added = utilArrayDifference(entity.nodes, oldentity.nodes);
            } else if (oldentity) {
                removed = oldentity.nodes;
                added = [];
            } else if (entity) {
                removed = [];
                added = entity.nodes;
            }
            for (i = 0; i < removed.length; i++) {
                // make a copy of prototype property, store as own property, and update..
                parentWays[removed[i]] = new Set(parentWays[removed[i]]);
                parentWays[removed[i]].delete(oldentity.id);
            }
            for (i = 0; i < added.length; i++) {
                // make a copy of prototype property, store as own property, and update..
                parentWays[added[i]] = new Set(parentWays[added[i]]);
                parentWays[added[i]].add(entity.id);
            }

        } else if (type === 'relation') {   // Update parentRels

            // diff only on the IDs since the same entity can be a member multiple times with different roles
            var oldentityMemberIDs = oldentity ? oldentity.members.map(function(m) { return m.id; }) : [];
            var entityMemberIDs = entity ? entity.members.map(function(m) { return m.id; }) : [];

            if (oldentity && entity) {
                removed = utilArrayDifference(oldentityMemberIDs, entityMemberIDs);
                added = utilArrayDifference(entityMemberIDs, oldentityMemberIDs);
            } else if (oldentity) {
                removed = oldentityMemberIDs;
                added = [];
            } else if (entity) {
                removed = [];
                added = entityMemberIDs;
            }
            for (i = 0; i < removed.length; i++) {
                // make a copy of prototype property, store as own property, and update..
                parentRels[removed[i]] = new Set(parentRels[removed[i]]);
                parentRels[removed[i]].delete(oldentity.id);
            }
            for (i = 0; i < added.length; i++) {
                // make a copy of prototype property, store as own property, and update..
                parentRels[added[i]] = new Set(parentRels[added[i]]);
                parentRels[added[i]].add(entity.id);
            }
        }
    },


    replace: function(entity) {
        if (this.entities[entity.id] === entity) return this;

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
        var baseEntity = this.base().entities[id];
        var headEntity = this.entities[id];
        if (headEntity === baseEntity) return this;

        return this.update(function() {
            this._updateCalculated(headEntity, baseEntity);
            delete this.entities[id];
        });
    },


    update: function() {
        var graph = this.frozen ? coreGraph(this, true) : this;
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
