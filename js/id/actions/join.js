// Join ways at the end node they share.
//
// This is the inverse of `iD.actions.Split`.
//
// Reference:
//   https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MergeWaysAction.as
//   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/CombineWayAction.java
//
iD.actions.Join = function(idA, idB) {
    var action = function(graph) {
        var a = graph.entity(idA),
            b = graph.entity(idB),
            nodes, tags;

        if (a.first() === b.first()) {
            // a <-- b ==> c
            // Expected result:
            // a <-- b <-- c
            nodes = b.nodes.slice().reverse().concat(a.nodes.slice(1));

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
            nodes = a.nodes.concat(b.nodes.slice().reverse().slice(1));
        }

        graph.parentRelations(b)
            .forEach(function (parent) {
                var memberA = parent.memberById(idA),
                    memberB = parent.memberById(idB);
                if (!memberA) {
                    graph = graph.replace(parent.addMember({id: idA, role: memberB.role, type: 'way'}));
                }
            });

        graph = graph.replace(a.mergeTags(b.tags).update({nodes: nodes}));
        graph = iD.actions.DeleteWay(idB)(graph);

        return graph;
    };

    action.enabled = function(graph) {
        var a = graph.entity(idA),
            b = graph.entity(idB);
        return a.first() === b.first() ||
               a.first() === b.last()  ||
               a.last()  === b.first() ||
               a.last()  === b.last();
    };

    return action;
};
