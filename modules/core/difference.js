import _difference from 'lodash-es/difference';
import _each from 'lodash-es/each';
import _isEqual from 'lodash-es/isEqual';
import _values from 'lodash-es/values';


/*
    iD.Difference represents the difference between two graphs.
    It knows how to calculate the set of entities that were
    created, modified, or deleted, and also contains the logic
    for recursively extending a difference to the complete set
    of entities that will require a redraw, taking into account
    child and parent relationships.
 */
export function coreDifference(base, head) {
    var _changes = {};
    var _diff = {};
    var _length = 0;
    var i, k, h, b, keys;

    function changed(h, b) {
        if (h === b) return false;
        if (!h || !b) return true;

        if (h.loc || b.loc) {
            if (!h.loc && b.loc || h.loc && !b.loc ||
                h.loc[0] !== b.loc[0] || h.loc[1] !== b.loc[1]) return true;
        }
        if (h.nodes || b.nodes) {
            if (!_isEqual(h.nodes, b.nodes)) return true;
        }
        if (h.members || b.members) {
            if (!_isEqual(h.members, b.members)) return true;
        }
        return !_isEqual(h.tags, b.tags);
    }


    keys = Object.keys(head.entities);
    for (i = 0; i < keys.length; i++) {
        k = keys[i];
        h = head.entities[k];
        b = base.entities[k];
        if (changed(h, b)) {
            _changes[k] = {base: b, head: h};
            _length++;
        }
    }

    keys = Object.keys(base.entities);
    for (i = 0; i < keys.length; i++) {
        k = keys[i];
        h = head.entities[k];
        b = base.entities[k];
        if (!_changes[k] && changed(h, b)) {
            _changes[k] = {base: b, head: h};
            _length++;
        }
    }


    function addParents(parents, result) {
        for (var i = 0; i < parents.length; i++) {
            var parent = parents[i];

            if (parent.id in result)
                continue;

            result[parent.id] = parent;
            addParents(head.parentRelations(parent), result);
        }
    }


    _diff.length = function length() {
        return _length;
    };


    _diff.changes = function changes() {
        return _changes;
    };


    _diff.extantIDs = function extantIDs() {
        var result = [];
        _each(_changes, function(change, id) {
            if (change.head) result.push(id);
        });
        return result;
    };


    _diff.modified = function modified() {
        var result = [];
        _each(_changes, function(change) {
            if (change.base && change.head) result.push(change.head);
        });
        return result;
    };


    _diff.created = function created() {
        var result = [];
        _each(_changes, function(change) {
            if (!change.base && change.head) result.push(change.head);
        });
        return result;
    };


    _diff.deleted = function deleted() {
        var result = [];
        _each(_changes, function(change) {
            if (change.base && !change.head) result.push(change.base);
        });
        return result;
    };


    _diff.summary = function summary() {
        var relevant = {};

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
                if (!(parent.id in relevant)) addEntity(parent, head, 'modified');
            }
        }

        var keys = Object.keys(_changes);
        for (var i = 0; i < keys.length; i++) {
            var change = _changes[keys[i]];

            if (change.head && change.head.geometry(head) !== 'vertex') {
                addEntity(change.head, head, change.base ? 'modified' : 'created');

            } else if (change.base && change.base.geometry(base) !== 'vertex') {
                addEntity(change.base, base, 'deleted');

            } else if (change.base && change.head) { // modified vertex
                var moved    = !_isEqual(change.base.loc,  change.head.loc);
                var retagged = !_isEqual(change.base.tags, change.head.tags);

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

        return _values(relevant);
    };


    _diff.complete = function complete(extent) {
        var result = {};
        var id, change;

        for (id in _changes) {
            change = _changes[id];

            var h = change.head;
            var b = change.base;
            var entity = h || b;

            if (extent &&
                (!h || !h.intersects(extent, head)) &&
                (!b || !b.intersects(extent, base)))
                continue;

            result[id] = h;

            if (entity.type === 'way') {
                var nh = h ? h.nodes : [];
                var nb = b ? b.nodes : [];
                var diff, i;

                diff = _difference(nh, nb);
                for (i = 0; i < diff.length; i++) {
                    result[diff[i]] = head.hasEntity(diff[i]);
                }

                diff = _difference(nb, nh);
                for (i = 0; i < diff.length; i++) {
                    result[diff[i]] = head.hasEntity(diff[i]);
                }
            }

            addParents(head.parentWays(entity), result);
            addParents(head.parentRelations(entity), result);
        }

        return result;
    };


    return _diff;
}
