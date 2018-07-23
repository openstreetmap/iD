import { osmNode } from '../osm';


export function actionDetachNode(nodeID) {

    var action = function(graph) {
        var node = graph.entity(nodeID);

        // Create a new node to replace the one we will detach
        var replacement = osmNode({ loc: node.loc });
        graph = graph.replace(replacement);

        // Process each way in turn, updating the graph as we go
        graph = graph.parentWays(node)
            .reduce(function(accGraph, parentWay) {
                return accGraph.replace(parentWay.replaceNode(nodeID, replacement.id));
            }, graph);

        // Process any relations too
        return graph.parentRelations(node)
            .reduce(function(accGraph, parentRel) {
                return accGraph.replace(parentRel.replaceMember(node, replacement));
            }, graph);
    };


    action.disabled = function(graph) {
        var node = graph.entity(nodeID);
        var parentRels = graph.parentRelations(node);

        for (var i = 0; i < parentRels.length; i++) {
            var relation = parentRels[i];
            if (!relation.isValidRestriction()) continue;

            for (var j = 0; j < relation.members.length; j++) {
                var m = relation.members[j];
                if (m.id === nodeID && (m.role === 'via' || m.role === 'location_hint')) {
                    return 'restriction';
                }
            }
        }

        return false;
    };


    return action;
}
