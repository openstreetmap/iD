/*
    iD.Difference represents the difference between two graphs.
    It knows how to calculate the set of entities that were
    created, modified, or deleted, and also contains the logic
    for recursively extending a difference to the complete set
    of entities that will require a redraw, taking into account
    child and parent relationships.
 */
iD.Difference = function(base, head) {
    var changes = {}, length = 0;

    _.each(head.entities, function(h, id) {
        var b = base.entities[id];
        if (h !== b) {
            changes[id] = {base: b, head: h};
            length++;
        }
    });

    _.each(base.entities, function(b, id) {
        var h = head.entities[id];
        if (!changes[id] && h !== b) {
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

    var difference = {};

    difference.length = function() {
        return length;
    };

    difference.changes = function() {
        return changes;
    };

    difference.extantIDs = function() {
        var result = [];
        _.each(changes, function(change, id) {
            if (change.head) result.push(id);
        });
        return result;
    };

    difference.modified = function() {
        var result = [];
        _.each(changes, function(change) {
            if (change.base && change.head) result.push(change.head);
        });
        return result;
    };

    difference.created = function() {
        var result = [];
        _.each(changes, function(change) {
            if (!change.base && change.head) result.push(change.head);
        });
        return result;
    };

    difference.deleted = function() {
        var result = [];
        _.each(changes, function(change) {
            if (change.base && !change.head) result.push(change.base);
        });
        return result;
    };

    difference.addParents = function(entities) {

        for (var i in entities) {
            addParents(head.parentWays(entities[i]), entities);
            addParents(head.parentRelations(entities[i]), entities);
        }
        return entities;
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

                diff = _.difference(nh, nb);
                for (i = 0; i < diff.length; i++) {
                    result[diff[i]] = head.entity(diff[i]);
                }

                diff = _.difference(nb, nh);
                for (i = 0; i < diff.length; i++) {
                    result[diff[i]] = head.entity(diff[i]);
                }
            }

            addParents(head.parentWays(entity), result);
            addParents(head.parentRelations(entity), result);
        }

        return result;
    };

    return difference;
};
