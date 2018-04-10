import { actionDeleteNode } from './delete_node';


// Connect the ways at the given nodes.
//
// First choose a node to be the survivor, with preference given
// to an existing (not new) node.
//
// Tags and relation memberships of of non-surviving nodes are merged
// to the survivor.
//
// This is the inverse of `iD.actionDisconnect`.
//
// Reference:
//   https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MergeNodesAction.as
//   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/MergeNodesAction.java
//
export function actionConnect(nodeIds) {
    return function(graph) {
        var survivor;
        var node;
        var i;

        // Choose a survivor node, prefer an existing (not new) node - #4974
        for (i = 0; i < nodeIds.length; i++) {
            survivor = graph.entity(nodeIds[i]);
            if (survivor.version) break;  // found one
        }

        // Replace all non-surviving nodes with the survivor and merge tags.
        for (i = 0; i < nodeIds.length; i++) {
            node = graph.entity(nodeIds[i]);
            if (node.id === survivor.id) continue;

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
            graph = actionDeleteNode(node.id)(graph);
        }

        graph = graph.replace(survivor);

        return graph;
    };
}
