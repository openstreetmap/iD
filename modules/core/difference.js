import deepEqual from 'fast-deep-equal';

import { geoVecEqual } from '../geo';
import { utilArrayDifference, utilArrayUnion, utilArrayUniq } from '../util/array';


/*
    iD.coreDifference represents the difference between two graphs.
    It knows how to calculate the set of entities that were
    created, modified, or deleted, and also contains the logic
    for recursively extending a difference to the complete set
    of entities that will require a redraw, taking into account
    child and parent relationships.
 */
export function coreDifference(base, head) {
    var _changes = {};
    var _didChange = {};  // 'addition', 'deletion', 'geometry', 'properties'
    var _diff = {};

    function checkEntityID(id) {
        var h = head.entities[id];
        var b = base.entities[id];

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
            if (h.members && b.members && !deepEqual(h.members, b.members)) {
                _changes[id] = { base: b, head: h };
                _didChange.geometry = true;
                _didChange.properties = true;
                return;
            }
            if (h.loc && b.loc && !geoVecEqual(h.loc, b.loc)) {
                _changes[id] = { base: b, head: h };
                _didChange.geometry = true;
            }
            if (h.nodes && b.nodes && !deepEqual(h.nodes, b.nodes)) {
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
        var ids = utilArrayUniq(Object.keys(head.entities).concat(Object.keys(base.entities)));
        for (var i = 0; i < ids.length; i++) {
            checkEntityID(ids[i]);
        }
    }
    load();


    _diff.length = function length() {
        return Object.keys(_changes).length;
    };


    _diff.changes = function changes() {
        return _changes;
    };

    _diff.didChange = _didChange;


    // pass true to include affected relation members
    _diff.extantIDs = function extantIDs(includeRelMembers) {
        var result = new Set();
        Object.keys(_changes).forEach(function(id) {
            if (_changes[id].head) {
                result.add(id);
            }

            var h = _changes[id].head;
            var b = _changes[id].base;
            var entity = h || b;

            if (includeRelMembers && entity.type === 'relation') {
                var mh = h ? h.members.map(function(m) { return m.id; }) : [];
                var mb = b ? b.members.map(function(m) { return m.id; }) : [];
                utilArrayUnion(mh, mb).forEach(function(memberID) {
                    if (head.hasEntity(memberID)) {
                        result.add(memberID);
                    }
                });
            }
        });

        return Array.from(result);
    };


    _diff.modified = function modified() {
        var result = [];
        Object.values(_changes).forEach(function(change) {
            if (change.base && change.head) {
                result.push(change.head);
            }
        });
        return result;
    };


    _diff.created = function created() {
        var result = [];
        Object.values(_changes).forEach(function(change) {
            if (!change.base && change.head) {
                result.push(change.head);
            }
        });
        return result;
    };


    _diff.deleted = function deleted() {
        var result = [];
        Object.values(_changes).forEach(function(change) {
            if (change.base && !change.head) {
                result.push(change.base);
            }
        });
        return result;
    };


    _diff.summary = function summary() {
        var relevant = {};

        var keys = Object.keys(_changes);
        for (var i = 0; i < keys.length; i++) {
            var change = _changes[keys[i]];

            if (change.head && change.head.geometry(head) !== 'vertex') {
                addEntity(change.head, head, change.base ? 'modified' : 'created');

            } else if (change.base && change.base.geometry(base) !== 'vertex') {
                addEntity(change.base, base, 'deleted');

            } else if (change.base && change.head) { // modified vertex
                var moved    = !deepEqual(change.base.loc,  change.head.loc);
                var retagged = !deepEqual(change.base.tags, change.head.tags);

                if (moved) {
                    addParents(change.head);
                }

                if (retagged || (moved && change.head.hasInterestingTags())) {
                    addEntity(change.head, head, 'modified');
                }

            } else if (change.head && change.head.hasInterestingTags()) { // created vertex
                addEntity(change.head, head, 'created');

            } else if (change.base && change.base.hasInterestingTags()) { // deleted vertex
                addEntity(change.base, base, 'deleted');
            }
        }

        return Object.values(relevant);


        function addEntity(entity, graph, changeType) {
            relevant[entity.id] = {
                entity: entity,
                graph: graph,
                changeType: changeType
            };
        }

        function addParents(entity) {
            var parents = head.parentWays(entity);
            for (var j = parents.length - 1; j >= 0; j--) {
                var parent = parents[j];
                if (!(parent.id in relevant)) {
                    addEntity(parent, head, 'modified');
                }
            }
        }
    };


    // returns complete set of entities that require a redraw
    //  (optionally within given `extent`)
    _diff.complete = function complete(extent) {
        var result = {};
        var id, change;

        for (id in _changes) {
            change = _changes[id];

            var h = change.head;
            var b = change.base;
            var entity = h || b;
            var i;

            if (extent &&
                (!h || !h.intersects(extent, head)) &&
                (!b || !b.intersects(extent, base)))
                continue;

            result[id] = h;

            if (entity.type === 'way') {
                var nh = h ? h.nodes : [];
                var nb = b ? b.nodes : [];
                var diff;

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
                var mh = h ? h.members.map(function(m) { return m.id; }) : [];
                var mb = b ? b.members.map(function(m) { return m.id; }) : [];
                var ids = utilArrayUnion(mh, mb);
                for (i = 0; i < ids.length; i++) {
                    var member = head.hasEntity(ids[i]);
                    if (!member) continue;   // not downloaded
                    if (extent && !member.intersects(extent, head)) continue;   // not visible
                    result[ids[i]] = member;
                }
            }

            addParents(head.parentWays(entity), result);
            addParents(head.parentRelations(entity), result);
        }

        return result;


        function addParents(parents, result) {
            for (var i = 0; i < parents.length; i++) {
                var parent = parents[i];
                if (parent.id in result) continue;

                result[parent.id] = parent;
                addParents(head.parentRelations(parent), result);
            }
        }
    };


    return _diff;
}
