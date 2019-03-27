import { actionDeleteRelation } from './delete_relation';


// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteWayAction.as
export function actionDeleteWay(wayID) {

    function canDeleteNode(node, graph) {
        return !graph.parentWays(node).length &&
            !graph.parentRelations(node).length &&
            !node.hasInterestingTags();
    }


    var action = function(graph) {
        var way = graph.entity(wayID);

        graph.parentRelations(way).forEach(function(parent) {
            parent = parent.removeMembersWithID(wayID);
            graph = graph.replace(parent);

            if (parent.isDegenerate()) {
                graph = actionDeleteRelation(parent.id)(graph);
            }
        });

        (new Set(way.nodes)).forEach(function(nodeID) {
            graph = graph.replace(way.removeNode(nodeID));

            var node = graph.entity(nodeID);
            if (canDeleteNode(node, graph)) {
                graph = graph.remove(node);
            }
        });

        return graph.remove(way);
    };


    return action;
}
