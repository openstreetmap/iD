// Connect the ways at the given nodes.
//
// The last node will survive. All other nodes will be replaced with
// the surviving node in parent ways, and then removed.
//
// Tags and relation memberships of of non-surviving nodes are merged
// to the survivor.
//
// This is the inverse of `iD.actions.Disconnect`.
//
// Reference:
//   https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MergeNodesAction.as
//   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/MergeNodesAction.java
//
iD.actions.Connect = function(nodeIds) {
    return function(graph) {
        var survivor = graph.entity(_.last(nodeIds));

        for (var i = 0; i < nodeIds.length - 1; i++) {
            var node = graph.entity(nodeIds[i]);

            /* eslint-disable no-loop-func */
            graph.parentWays(node).forEach(function(parent) {
                if (!parent.areAdjacent(node.id, survivor.id)) {
                    graph = graph.replace(parent.replaceNode(node.id, survivor.id));
                }
            });

            graph.parentRelations(node).forEach(function(parent) {
                graph = graph.replace(parent.replaceMember(node, survivor));
            });
            /* eslint-enable no-loop-func */

            survivor = survivor.mergeTags(node.tags);
            graph = iD.actions.DeleteNode(node.id)(graph);
        }

        graph = graph.replace(survivor);

        return graph;
    };
};
