// Join ways at the end node they share.
//
// This is the inverse of `iD.actions.Split`.
//
// Reference:
//   https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MergeWaysAction.as
//   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/CombineWayAction.java
//
iD.actions.Join = function(ids) {

    function groupEntitiesByGeometry(graph) {
        var entities = ids.map(function(id) { return graph.entity(id); });
        return _.extend({line: []}, _.groupBy(entities, function(entity) { return entity.geometry(graph); }));
    }

    var action = function(graph) {
        var existing = 0,
            nodes,
            a, b,
            i, j;

        function replaceWithA(parent) {
            graph = graph.replace(parent.replaceMember(b, a));
        }

        // Prefer to keep an existing way.
        for (i = 0; i < ids.length; i++) {
            if (!graph.entity(ids[i]).isNew()) {
                existing = i;
                break;
            }
        }

        // Join ways to 'a' in the following order: a-1, a-2, ..., 0, a+1, a+2, ..., ids.length-1
        for (i = 0; i < ids.length; i++) {
            j = (i <= existing) ? (existing - i) : i;
            if (j === existing) {
                continue;
            }

            a = graph.entity(ids[existing]);
            b = graph.entity(ids[j]);

            if (a.first() === b.first()) {
                // a <-- b ==> c
                // Expected result:
                // a <-- b <-- c
                b = iD.actions.Reverse(ids[j])(graph).entity(ids[j]);
                nodes = b.nodes.slice().concat(a.nodes.slice(1));

            } else if (a.first() === b.last()) {
                // a <-- b <== c
                // Expected result:
                // a <-- b <-- c
                nodes = b.nodes.concat(a.nodes.slice(1));

            } else if (a.last()  === b.first()) {
                // a --> b ==> c
                // Expected result:
                // a --> b --> c
                nodes = a.nodes.concat(b.nodes.slice(1));

            } else if (a.last()  === b.last()) {
                // a --> b <== c
                // Expected result:
                // a --> b --> c
                b = iD.actions.Reverse(ids[j])(graph).entity(ids[j]);
                nodes = a.nodes.concat(b.nodes.slice().slice(1));
            }

            graph.parentRelations(b).forEach(replaceWithA);

            graph = graph.replace(a.mergeTags(b.tags).update({ nodes: nodes }));
            graph = iD.actions.DeleteWay(ids[j])(graph);
        }

        return graph;
    };

    action.disabled = function(graph) {
        var geometries = groupEntitiesByGeometry(graph),
            i;

        // direction of the previous way -- the next way can join only on the opposite side than the previous joint
        var prev_direction = 0;

        if (ids.length < 2 || ids.length !== geometries.line.length)
            return 'not_eligible';

        for (i = 0; i+1 < ids.length; i++) {
            var a = graph.entity(ids[i+0]),
                b = graph.entity(ids[i+1]);

            if (a.first() === b.first() && prev_direction <= 0) {
                prev_direction = 1;
                continue;
            } else if (a.first() === b.last() && prev_direction <= 0) {
                prev_direction = -1;
                continue;
            } else if (a.last() === b.first() && prev_direction >= 0) {
                prev_direction = 1;
                continue;
            } else if (a.last() === b.last() && prev_direction >= 0) {
                prev_direction = -1;
                continue;
            }

            return 'not_adjacent';
        }
    };

    return action;
};
