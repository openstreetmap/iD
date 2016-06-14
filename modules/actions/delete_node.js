import { DeleteWay } from './delete_way';
import { DeleteRelation } from './delete_relation';

// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteNodeAction.as
export function DeleteNode(nodeId) {
    var action = function(graph) {
        var node = graph.entity(nodeId);

        graph.parentWays(node)
            .forEach(function(parent) {
                parent = parent.removeNode(nodeId);
                graph = graph.replace(parent);

                if (parent.isDegenerate()) {
                    graph = DeleteWay(parent.id)(graph);
                }
            });

        graph.parentRelations(node)
            .forEach(function(parent) {
                parent = parent.removeMembersWithID(nodeId);
                graph = graph.replace(parent);

                if (parent.isDegenerate()) {
                    graph = DeleteRelation(parent.id)(graph);
                }
            });

        return graph.remove(node);
    };

    action.disabled = function() {
        return false;
    };

    return action;
}
