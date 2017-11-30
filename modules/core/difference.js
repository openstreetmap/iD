import _difference from 'lodash-es/difference';
import _each from 'lodash-es/each';
import _omit from 'lodash-es/omit';
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
    var changes = {},
        difference = {},
        length = 0;


    function changed(h, b) {
        return h !== b && !_isEqual(_omit(h, 'v'), _omit(b, 'v'));
    }


    _each(head.entities, function(h, id) {
        var b = base.entities[id];
        if (changed(h, b)) {
            changes[id] = {base: b, head: h};
            length++;
        }
    });


    _each(base.entities, function(b, id) {
        var h = head.entities[id];
        if (!changes[id] && changed(h, b)) {
            changes[id] = {base: b, head: h};
            length++;
        }
    });


    function addParents(parents, result) {
        for (var i = 0; i < parents.length; i++) {
            var parent = parents[i];

            if (parent.id in result)
                continue;

            result[parent.id] = parent;
            addParents(head.parentRelations(parent), result);
        }
    }


    difference.length = function() {
        return length;
    };


    difference.changes = function() {
        return changes;
    };


    difference.extantIDs = function() {
        var result = [];
        _each(changes, function(change, id) {
            if (change.head) result.push(id);
        });
        return result;
    };


    difference.modified = function() {
        var result = [];
        _each(changes, function(change) {
            if (change.base && change.head) result.push(change.head);
        });
        return result;
    };


    difference.created = function() {
        var result = [];
        _each(changes, function(change) {
            if (!change.base && change.head) result.push(change.head);
        });
        return result;
    };


    difference.deleted = function() {
        var result = [];
        _each(changes, function(change) {
            if (change.base && !change.head) result.push(change.base);
        });
        return result;
    };


    difference.summary = function() {
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

        _each(changes, function(change) {
            if (change.head && change.head.geometry(head) !== 'vertex') {
                addEntity(change.head, head, change.base ? 'modified' : 'created');

            } else if (change.base && change.base.geometry(base) !== 'vertex') {
                addEntity(change.base, base, 'deleted');

            } else if (change.base && change.head) { // modified vertex
                var moved    = !_isEqual(change.base.loc,  change.head.loc),
                    retagged = !_isEqual(change.base.tags, change.head.tags);

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
        });

        return _values(relevant);
    };


    difference.complete = function(extent) {
        var result = {}, id, change;

        for (id in changes) {
            change = changes[id];

            var h = change.head,
                b = change.base,
                entity = h || b;

            if (extent &&
                (!h || !h.intersects(extent, head)) &&
                (!b || !b.intersects(extent, base)))
                continue;

            result[id] = h;

            if (entity.type === 'way') {
                var nh = h ? h.nodes : [],
                    nb = b ? b.nodes : [],
                    diff, i;

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


    return difference;
}
