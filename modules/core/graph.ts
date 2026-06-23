import { debug, type EntityId, type NodeId, type RelationId, type WayId } from '../index';
import type { osmNode } from '../osm/node';
import type { osmRelation } from '../osm/relation';
import type { osmWay } from '../osm/way';
import { utilArrayDifference } from '../util';

export class coreGraph {
    entities: { [id: EntityId]: iD.OsmEntity | undefined };
    _parentWays: { [id: EntityId]: Set<EntityId> };
    _parentRels: { [id: EntityId]: Set<EntityId> };
    transients: { [id: EntityId]: { [key: string]: unknown } };
    _childNodes: { [id: EntityId]: osmNode[] };
    frozen: boolean;

  constructor(other?: coreGraph, mutable?: boolean) {
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

    hasEntity(id: NodeId): osmNode | undefined;
    hasEntity(id: WayId): osmWay | undefined;
    hasEntity(id: RelationId): osmRelation | undefined;
    hasEntity<T extends iD.OsmEntity>(id: EntityId): T | undefined;
    hasEntity<T extends iD.OsmEntity>(id: EntityId) {
        return this.entities[id] as T | undefined;
    }

    entity(id: NodeId): osmNode;
    entity(id: WayId): osmWay;
    entity(id: RelationId): osmRelation;
    entity<T extends iD.OsmEntity>(id: EntityId): T;
    entity<T extends iD.OsmEntity>(id: EntityId) {
        var entity = this.entities[id];

        if (!entity) {
            throw new Error('entity ' + id + ' not found');
        }
        return entity as T;
    }

    geometry(id: EntityId) {
        return this.entity(id).geometry(this);
    }

    transient<T>(entity: iD.OsmEntity, key: string, fn: () => T): T {
        var id = entity.id;
        var transients = this.transients[id] || (this.transients[id] = {});

        if (transients[key] !== undefined) {
            return transients[key] as T;
        }

        transients[key] = fn.call(entity);

        return transients[key] as T;
    }

    parentWays(entity: iD.OsmEntity) {
        var parents = this._parentWays[entity.id];
        var result: osmWay[] = [];
        if (parents) {
            parents.forEach((id) => {
                result.push(this.entity<osmWay>(id));
            });
        }
        return result;
    }

    isPoi(entity: iD.OsmEntity) {
        var parents = this._parentWays[entity.id];
        return !parents || parents.size === 0;
    }

    isShared(entity: iD.OsmEntity) {
        var parents = this._parentWays[entity.id];
        return parents && parents.size > 1;
    }

    parentRelations(entity: iD.OsmAbstractEntity) {
        var parents = this._parentRels[entity.id];
        var result: osmRelation[] = [];
        if (parents) {
            parents.forEach((id) => {
                result.push(this.entity<osmRelation>(id));
            });
        }
        return result;
    }

    parentMultipolygons(entity: iD.OsmEntity) {
        return this.parentRelations(entity).filter((relation) => {
            return relation.isMultipolygon();
        });
    }


    childNodes(entity: osmWay) {
        if (this._childNodes[entity.id]) return this._childNodes[entity.id];
        if (!entity.nodes) return [];

        var nodes: osmNode[] = [];
        for (var i = 0; i < entity.nodes.length; i++) {
            nodes[i] = this.entity<osmNode>(entity.nodes[i]);
        }

        if (debug) Object.freeze(nodes);

        this._childNodes[entity.id] = nodes;
        return this._childNodes[entity.id];
    }

    base(): {
        entities: coreGraph['entities'];
        parentWays: coreGraph['_parentWays'];
        parentRels: coreGraph['_parentRels'];
    } {
        return {
            'entities': Object.getPrototypeOf(this.entities),
            'parentWays': Object.getPrototypeOf(this._parentWays),
            'parentRels': Object.getPrototypeOf(this._parentRels)
        };
    }

    // Unlike other graph methods, rebase mutates in place. This is because it
    // is used only during the history operation that merges newly downloaded
    // data into each state. To external consumers, it should appear as if the
    // graph always contained the newly downloaded data.
    rebase(entities: iD.OsmEntity[], stack: coreGraph[], force?: boolean) {
        var base = this.base();
        var i, j, k, id;

        for (i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (!entity.visible || (!force && base.entities[entity.id])) continue;

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
    }

    _updateRebased() {
        var base = this.base();

        Object.keys(this._parentWays).forEach((child) => {
            if (base.parentWays[child]) {
                base.parentWays[child].forEach((id) => {
                    if (!this.entities.hasOwnProperty(id)) {
                        this._parentWays[child].add(id);
                    }
                });
            }
        });

        Object.keys(this._parentRels).forEach((child) => {
            if (base.parentRels[child]) {
                base.parentRels[child].forEach((id) => {
                    if (!this.entities.hasOwnProperty(id)) {
                        this._parentRels[child].add(id);
                    }
                });
            }
        });

        this.transients = {};

        // this._childNodes is not updated, under the assumption that
        // ways are always downloaded with their child nodes.
    }

    // Updates calculated properties (parentWays, parentRels) for the specified change
    _updateCalculated(
        oldentity: iD.OsmEntity | undefined,
        entity: iD.OsmEntity | undefined,
        parentWays?: coreGraph['_parentWays'],
        parentRels?: coreGraph['_parentRels'],
    ) {
        parentWays = parentWays || this._parentWays;
        parentRels = parentRels || this._parentRels;

        var type = entity && entity.type || oldentity && oldentity.type;
        let removed: EntityId[] = [];
        let added: EntityId[] = [];
        let i: number;

        if (type === 'way') {   // Update parentWays

            // this is purely to help TypeScript understand
            entity = <osmWay | undefined>entity;
            oldentity = <osmWay | undefined>oldentity;

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
                parentWays[removed[i]].delete(oldentity!.id);
            }
            for (i = 0; i < added.length; i++) {
                // make a copy of prototype property, store as own property, and update..
                parentWays[added[i]] = new Set(parentWays[added[i]]);
                parentWays[added[i]].add(entity!.id);
            }

        } else if (type === 'relation') {   // Update parentRels

            // this is purely to help TypeScript understand
            entity = <osmRelation | undefined>entity;
            oldentity = <osmRelation | undefined>oldentity;

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
                parentRels[removed[i]].delete(oldentity!.id);
            }
            for (i = 0; i < added.length; i++) {
                // make a copy of prototype property, store as own property, and update..
                parentRels[added[i]] = new Set(parentRels[added[i]]);
                parentRels[added[i]].add(entity!.id);
            }
        }
    }

    replace(entity: iD.OsmEntity) {
        if (this.entities[entity.id] === entity) return this;

        return this.update(function() {
            this._updateCalculated(this.entities[entity.id], entity);
            this.entities[entity.id] = entity;
        });
    }

    remove(entity: iD.OsmEntity) {
        return this.update(function() {
            this._updateCalculated(entity, undefined);
            this.entities[entity.id] = undefined;
        });
    }

    revert(id: EntityId) {
        var baseEntity = this.base().entities[id];
        var headEntity = this.entities[id];
        if (headEntity === baseEntity) return this;

        return this.update(function() {
            this._updateCalculated(headEntity, baseEntity);
            delete this.entities[id];
        });
    }

    update(...args: ((this: coreGraph, graph: coreGraph) => void)[]) {
        var graph = this.frozen ? new coreGraph(this, true) : this;
        for (var i = 0; i < args.length; i++) {
            args[i].call(graph, graph);
        }

        if (this.frozen) graph.frozen = true;

        return graph;
    }

    // Obliterates any existing entities
    load(entities: { [key: EntityId | number]: iD.OsmEntity }) {
        var base = this.base();
        this.entities = Object.create(base.entities);

        for (var _i in entities) {
            const i = <EntityId>_i;
            this.entities[i] = entities[i];
            this._updateCalculated(base.entities[i], this.entities[i]);
        }

        return this;
    }
}
