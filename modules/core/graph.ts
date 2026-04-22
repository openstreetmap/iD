import { debug } from '../index';
import type { OsmNode as osmNode } from '../osm/node';
import type { OsmRelation as osmRelation } from '../osm/relation';
import type { OsmWay as osmWay } from '../osm/way';
import { utilArrayDifference } from '../util';

export class coreGraph {
    entities: { [id: string]: iD.OsmEntity | undefined };
    _parentWays: { [id: string]: Set<string> };
    _parentRels: { [id: string]: Set<string> };
    transients: { [id: string]: { [key: string]: unknown } };
    _childNodes: { [id: string]: osmNode[] };
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

    hasEntity<T extends iD.OsmEntity>(id: string) {
        return this.entities[id] as T | undefined;
    }

    entity<T extends iD.OsmEntity>(id: string) {
        var entity = this.entities[id];

        if (!entity) {
            throw new Error('entity ' + id + ' not found');
        }
        return entity as T;
    }

    geometry(id: string) {
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

    parentRelations(entity: iD.OsmEntity) {
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

        // @ts-expect-error -- temporary issue which will be solved after upgrading osmEntity
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
        let i: number;

        if (type === 'way') {   // Update parentWays

            // this is purely to help TypeScript understand
            entity = <osmWay | undefined>entity;
            oldentity = <osmWay | undefined>oldentity;

            let removed: string[] = [];
            let added: string[] = [];
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

            function memberIDCounts(members: osmRelation['members'] | undefined) {
                var counts = new Map<string, number>();
                if (!members) return counts;
                for (var j = 0; j < members.length; j++) {
                    var mid = members[j].id;
                    counts.set(mid, (counts.get(mid) || 0) + 1);
                }
                return counts;
            }

            // _parentRels stores each parent relation at most once per child id, but a relation
            // may list the same member id multiple times (different roles). Membership changes
            // must use multiset counts — utilArrayDifference(Set) breaks duplicate members.
            if (oldentity && entity) {
                var oldCounts = memberIDCounts(oldentity.members);
                var newCounts = memberIDCounts(entity.members);
                var relationId = oldentity.id;
                var memberIds = new Set([...oldCounts.keys(), ...newCounts.keys()]);
                memberIds.forEach(function(mid) {
                    var oc = oldCounts.get(mid) || 0;
                    var nc = newCounts.get(mid) || 0;
                    if (oc > 0 && nc === 0) {
                        parentRels[mid] = new Set(parentRels[mid]);
                        parentRels[mid].delete(relationId);
                    } else if (oc === 0 && nc > 0) {
                        parentRels[mid] = new Set(parentRels[mid]);
                        parentRels[mid].add(relationId);
                    }
                });
            } else if (oldentity) {
                var removedRel = oldentity;
                memberIDCounts(removedRel.members).forEach(function(_oc, mid) {
                    parentRels[mid] = new Set(parentRels[mid]);
                    parentRels[mid].delete(removedRel.id);
                });
            } else if (entity) {
                var addedRel = entity;
                memberIDCounts(addedRel.members).forEach(function(_nc, mid) {
                    parentRels[mid] = new Set(parentRels[mid]);
                    parentRels[mid].add(addedRel.id);
                });
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

    revert(id: string) {
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
    load(entities: { [key: string | number]: iD.OsmEntity }) {
        var base = this.base();
        this.entities = Object.create(base.entities);

        for (var i in entities) {
            this.entities[i] = entities[i];
            this._updateCalculated(base.entities[i], this.entities[i]);
        }

        return this;
    }
}
