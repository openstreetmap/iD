import _assign from 'lodash-es/assign';
import _difference from 'lodash-es/difference';
import _includes from 'lodash-es/includes';
import _without from 'lodash-es/without';

import { debug } from '../index';
import { utilGetPrototypeOf } from '../util';


export function coreGraph(other, mutable) {
    if (!(this instanceof coreGraph)) return new coreGraph(other, mutable);

    if (other instanceof coreGraph) {
        var base = other.base();
        this.entities = _assign(Object.create(base.entities), other.entities);
        this._parentWays = _assign(Object.create(base.parentWays), other._parentWays);
        this._parentRels = _assign(Object.create(base.parentRels), other._parentRels);

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
        var parents = this._parentRels[entity.id];
        var result = [];

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

        if (debug) Object.freeze(nodes);

        this._childNodes[entity.id] = nodes;
        return this._childNodes[entity.id];
    },


    base: function() {
        return {
            'entities': utilGetPrototypeOf(this.entities),
            'parentWays': utilGetPrototypeOf(this._parentWays),
            'parentRels': utilGetPrototypeOf(this._parentRels)
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
        var i, k, child, id, keys;

        keys = Object.keys(this._parentWays);
        for (i = 0; i < keys.length; i++) {
            child = keys[i];
            if (base.parentWays[child]) {
                for (k = 0; k < base.parentWays[child].length; k++) {
                    id = base.parentWays[child][k];
                    if (!this.entities.hasOwnProperty(id) && !_includes(this._parentWays[child], id)) {
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
                    if (!this.entities.hasOwnProperty(id) && !_includes(this._parentRels[child], id)) {
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

        var type = entity && entity.type || oldentity && oldentity.type;
        var removed, added, ways, rels, i;

        if (type === 'way') {   // Update parentWays
            if (oldentity && entity) {
                removed = _difference(oldentity.nodes, entity.nodes);
                added = _difference(entity.nodes, oldentity.nodes);
            } else if (oldentity) {
                removed = oldentity.nodes;
                added = [];
            } else if (entity) {
                removed = [];
                added = entity.nodes;
            }
            for (i = 0; i < removed.length; i++) {
                parentWays[removed[i]] = _without(parentWays[removed[i]], oldentity.id);
            }
            for (i = 0; i < added.length; i++) {
                ways = _without(parentWays[added[i]], entity.id);
                ways.push(entity.id);
                parentWays[added[i]] = ways;
            }

        } else if (type === 'relation') {   // Update parentRels
            if (oldentity && entity) {
                removed = _difference(oldentity.members, entity.members);
                added = _difference(entity.members, oldentity);
            } else if (oldentity) {
                removed = oldentity.members;
                added = [];
            } else if (entity) {
                removed = [];
                added = entity.members;
            }
            for (i = 0; i < removed.length; i++) {
                parentRels[removed[i].id] = _without(parentRels[removed[i].id], oldentity.id);
            }
            for (i = 0; i < added.length; i++) {
                rels = _without(parentRels[added[i].id], entity.id);
                rels.push(entity.id);
                parentRels[added[i].id] = rels;
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
