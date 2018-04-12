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
    var action = function(graph) {
        var survivor;
        var node;
        var parents;
        var i, j;

        // Choose a survivor node, prefer an existing (not new) node - #4974
        for (i = 0; i < nodeIds.length; i++) {
            survivor = graph.entity(nodeIds[i]);
            if (survivor.version) break;  // found one
        }

        // Replace all non-surviving nodes with the survivor and merge tags.
        for (i = 0; i < nodeIds.length; i++) {
            node = graph.entity(nodeIds[i]);
            if (node.id === survivor.id) continue;

            parents = graph.parentWays(node);
            for (j = 0; j < parents.length; j++) {
                if (!parents[j].areAdjacent(node.id, survivor.id)) {
                    graph = graph.replace(parents[j].replaceNode(node.id, survivor.id));
                }
            }

            parents = graph.parentRelations(node);
            for (j = 0; j < parents.length; j++) {
                graph = graph.replace(parents[j].replaceMember(node, survivor));
            }

            survivor = survivor.mergeTags(node.tags);
            graph = actionDeleteNode(node.id)(graph);
        }

        graph = graph.replace(survivor);

        return graph;
    };


    action.disabled = function(graph) {
        var seen = {};

        for (var i = 0; i < nodeIds.length; i++) {
            var node = graph.entity(nodeIds[i]);

            var toCheck = [node].concat(graph.parentWays(node));
            for (var j = 0; j < toCheck.length; j++) {
                var entity = toCheck[j];

                var relations = graph.parentRelations(entity);
                for (var k = 0; k < relations.length; k++) {
                    var relation = relations[k];
                    var role = relation.memberById(entity.id).role || '';

                    if (seen[relation.id] !== undefined && seen[relation.id] !== role) {
                        return 'relation';
                    } else {
                        seen[relation.id] = role;
                    }
                }
            }
        }
    };


    return action;
}
