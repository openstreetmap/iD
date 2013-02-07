// Join ways at the end node they share.
//
// This is the inverse of `iD.actions.Split`.
//
// Reference:
//   https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MergeWaysAction.as
//   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/CombineWayAction.java
//
iD.actions.Join = function(ids) {
    var idA = ids[0],
        idB = ids[1];

    function groupEntitiesByGeometry(graph) {
        var entities = ids.map(function(id) { return graph.entity(id); });
        return _.extend({line: []}, _.groupBy(entities, function(entity) { return entity.geometry(graph); }));
    }

    var action = function(graph) {
        var a = graph.entity(idA),
            b = graph.entity(idB),
            nodes;

        if (a.first() === b.first()) {
            // a <-- b ==> c
            // Expected result:
            // a <-- b <-- c
            b = iD.actions.Reverse(idB)(graph).entity(idB);
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
            b = iD.actions.Reverse(idB)(graph).entity(idB);
            nodes = a.nodes.concat(b.nodes.slice().slice(1));
        }

        graph.parentRelations(b).forEach(function (parent) {
            graph = graph.replace(parent.replaceMember(b, a));
        });

        graph = graph.replace(a.mergeTags(b.tags).update({nodes: nodes}));
        graph = iD.actions.DeleteWay(idB)(graph);

        return graph;
    };

    action.enabled = function(graph) {
        var geometries = groupEntitiesByGeometry(graph);

        if (ids.length !== 2 || ids.length !== geometries['line'].length)
            return false;

        var a = graph.entity(idA),
            b = graph.entity(idB);

        return a.first() === b.first() ||
               a.first() === b.last()  ||
               a.last()  === b.first() ||
               a.last()  === b.last();
    };

    return action;
};
