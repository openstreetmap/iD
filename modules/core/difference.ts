import { deepEqual } from 'fast-equals';

import { geoVecEqual, type geoExtent } from '../geo';
import { utilArrayDifference, utilArrayUnion, utilArrayUniq } from '../util/array';
import type { coreGraph } from './graph';
import type { OsmEntity } from '../osm/abstract-entity';
import type { EntityId, osmNode, osmRelation, osmWay } from '../osm';

interface Change {
    base: OsmEntity | undefined;
    head: OsmEntity | undefined;
}

type ChangeType = 'created' | 'modified' | 'deleted';

/**
    iD.coreDifference represents the difference between two graphs.
    It knows how to calculate the set of entities that were
    created, modified, or deleted, and also contains the logic
    for recursively extending a difference to the complete set
    of entities that will require a redraw, taking into account
    child and parent relationships.
 */
export function coreDifference(base: coreGraph, head: coreGraph) {
    const _changes: { [id: EntityId]: Change } = {};
    const _didChange: {
        addition?: boolean;
        deletion?: boolean;
        geometry?: boolean;
        properties?: boolean;
    } = {};

    function checkEntityID(id: EntityId) {
        const h = head.entities[id];
        const b = base.entities[id];

        if (h === b) return;
        if (_changes[id]) return;

        if (!h && b) {
            _changes[id] = { base: b, head: h };
            _didChange.deletion = true;
            return;
        }
        if (h && !b) {
            _changes[id] = { base: b, head: h };
            _didChange.addition = true;
            return;
        }

        if (h && b) {
            if (
                h.type === 'relation' &&
                b.type === 'relation' &&
                h.members &&
                b.members &&
                !deepEqual(h.members, b.members)
            ) {
                _changes[id] = { base: b, head: h };
                _didChange.geometry = true;
                _didChange.properties = true;
                return;
            }
            if (
                h.type === 'node' &&
                b.type === 'node' &&
                h.loc &&
                b.loc &&
                !geoVecEqual(h.loc, b.loc)
            ) {
                _changes[id] = { base: b, head: h };
                _didChange.geometry = true;
            }
            if (
                h.type === 'way' &&
                b.type === 'way' &&
                h.nodes &&
                b.nodes &&
                !deepEqual(h.nodes, b.nodes)
            ) {
                _changes[id] = { base: b, head: h };
                _didChange.geometry = true;
            }
            if (h.tags && b.tags && !deepEqual(h.tags, b.tags)) {
                _changes[id] = { base: b, head: h };
                _didChange.properties = true;
            }
        }
    }

    function load() {
        // HOT CODE: there can be many thousands of downloaded entities, so looping
        // through them all can become a performance bottleneck. Optimize by
        // resolving duplicates and using a basic `for` loop
        const ids = utilArrayUniq(Object.keys(head.entities).concat(Object.keys(base.entities)));
        for (let i = 0; i < ids.length; i++) {
            checkEntityID(ids[i]);
        }
    }
    load();

    function length() {
        return Object.keys(_changes).length;
    }

    function changes() {
        return _changes;
    }

    // pass true to include affected relation members
    function extantIDs(includeRelMembers?: boolean) {
        const result = new Set<EntityId>();
        Object.keys(_changes).forEach(function (id) {
            if (_changes[id].head) {
                result.add(id);
            }

            const h = _changes[id].head;
            const b = _changes[id].base;
            const entity = (h || b)!;

            if (includeRelMembers && entity.type === 'relation') {
                const mh = h
                    ? (h as osmRelation).members.map(function (m) {
                          return m.id;
                      })
                    : [];
                const mb = b
                    ? (b as osmRelation).members.map(function (m) {
                          return m.id;
                      })
                    : [];
                utilArrayUnion(mh, mb).forEach(function (memberID) {
                    if (head.hasEntity(memberID)) {
                        result.add(memberID);
                    }
                });
            }
        });

        return Array.from(result);
    }

    function modified() {
        const result: OsmEntity[] = [];
        Object.values(_changes).forEach(function (change) {
            if (change.base && change.head) {
                result.push(change.head);
            }
        });
        return result;
    }

    function created() {
        const result: OsmEntity[] = [];
        Object.values(_changes).forEach(function (change) {
            if (!change.base && change.head) {
                result.push(change.head);
            }
        });
        return result;
    }

    function deleted() {
        const result: OsmEntity[] = [];
        Object.values(_changes).forEach(function (change) {
            if (change.base && !change.head) {
                result.push(change.base);
            }
        });
        return result;
    }

    function summary() {
        const relevant: {
            [id: EntityId]: {
                entity: OsmEntity;
                graph: coreGraph;
                changeType: ChangeType;
            };
        } = {};

        const keys = Object.keys(_changes);
        for (let i = 0; i < keys.length; i++) {
            const change = _changes[keys[i]];

            if (change.head && change.head.geometry(head) !== 'vertex') {
                addEntity(change.head, head, change.base ? 'modified' : 'created');
            } else if (change.base && change.base.geometry(base) !== 'vertex') {
                addEntity(change.base, base, 'deleted');
            } else if (change.base && change.head) {
                // modified vertex
                const moved = !deepEqual(
                    (change.base as osmNode).loc,
                    (change.head as osmNode).loc,
                );
                const retagged = !deepEqual(change.base.tags, change.head.tags);

                if (moved) {
                    addParents(change.head);
                }

                if (retagged || (moved && change.head.hasInterestingTags())) {
                    addEntity(change.head, head, 'modified');
                }
            } else if (change.head && change.head.hasInterestingTags()) {
                // created vertex
                addEntity(change.head, head, 'created');
            } else if (change.base && change.base.hasInterestingTags()) {
                // deleted vertex
                addEntity(change.base, base, 'deleted');
            }
        }

        return Object.values(relevant);

        function addEntity(entity: OsmEntity, graph: coreGraph, changeType: ChangeType) {
            relevant[entity.id] = {
                entity: entity,
                graph: graph,
                changeType: changeType,
            };
        }

        function addParents(entity: OsmEntity) {
            const parents = head.parentWays(entity);
            for (let j = parents.length - 1; j >= 0; j--) {
                const parent = parents[j];
                if (!(parent.id in relevant)) {
                    addEntity(parent, head, 'modified');
                }
            }
        }
    }

    // returns complete set of entities that require a redraw
    //  (optionally within given `extent`)
    function complete(extent?: geoExtent) {
        const result: { [id: EntityId]: OsmEntity | undefined } = {};

        for (const _id in _changes) {
            const id = <EntityId>_id;
            const change = _changes[id];

            const h = change.head;
            const b = change.base;
            const entity = (h || b)!;
            let i;

            if (
                extent &&
                (!h || !h.intersects(extent, head)) &&
                (!b || !b.intersects(extent, base))
            ) {
                continue;
            }

            result[id] = h;

            if (entity.type === 'way') {
                const nh = h ? (h as osmWay).nodes : [];
                const nb = b ? (b as osmWay).nodes : [];
                let diff;

                diff = utilArrayDifference(nh, nb);
                for (i = 0; i < diff.length; i++) {
                    result[diff[i]] = head.hasEntity(diff[i]);
                }

                diff = utilArrayDifference(nb, nh);
                for (i = 0; i < diff.length; i++) {
                    result[diff[i]] = head.hasEntity(diff[i]);
                }
            }

            if (entity.type === 'relation' && entity.isMultipolygon()) {
                const mh = h
                    ? (h as osmRelation).members.map(function (m) {
                          return m.id;
                      })
                    : [];
                const mb = b
                    ? (b as osmRelation).members.map(function (m) {
                          return m.id;
                      })
                    : [];
                const ids = utilArrayUnion(mh, mb);
                for (i = 0; i < ids.length; i++) {
                    const member = head.hasEntity(ids[i]);
                    if (!member) continue; // not downloaded
                    if (extent && !member.intersects(extent, head)) continue; // not visible
                    result[ids[i]] = member;
                }
            }

            addParents(head.parentWays(entity), result);
            addParents(head.parentRelations(entity), result);
        }

        return result;

        function addParents(
            parents: OsmEntity[],
            result: { [id: EntityId]: OsmEntity | undefined },
        ) {
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.id in result) continue;

                result[parent.id] = parent;
                addParents(head.parentRelations(parent), result);
            }
        }
    }

    const _diff = {
        length,
        changes,
        didChange: _didChange,
        extantIDs,
        modified,
        created,
        deleted,
        summary,
        complete,
    };

    return _diff;
}

export type coreDifference = ReturnType<typeof coreDifference>;
