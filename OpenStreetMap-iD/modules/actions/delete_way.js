import { osmNodeGeometriesForTags } from '../osm/tags';
import { actionDeleteRelation } from './delete_relation';


// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteWayAction.as
export function actionDeleteWay(wayID) {

    function canDeleteNode(node, graph) {
        // don't delete nodes still attached to ways or relations
        if (graph.parentWays(node).length ||
            graph.parentRelations(node).length) return false;

        var geometries = osmNodeGeometriesForTags(node.tags);
        // don't delete if this node can be a standalone point
        if (geometries.point) return false;
        // delete if this node only be a vertex
        if (geometries.vertex) return true;

        // iD doesn't know if this should be a point or vertex,
        // so only delete if there are no interesting tags
        return !node.hasInterestingTags();
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
