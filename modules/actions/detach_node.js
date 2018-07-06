import { osmNode } from '../osm';

export function actionDetachNode(nodeId) {
    return function (graph) {
        // Get the point in question
        var node = graph.entity(nodeId);
        // Get all of the ways it's currently attached to
        var parentWays = graph.parentWays(node);
        // Create a new node to replace the one we will detach
        var replacementNode = osmNode({ loc: node.loc });
        // We need to process each way in turn, updating the graph as we go
        return parentWays
            .reduce(function (accGraph, parentWay) {
                // Make a note of where in the way our target node is inside this way
                var originalIndex = parentWay.nodes.indexOf(nodeId);
                // Swap out the target node for the replacement
                var updatedWay = parentWay
                    .removeNode(nodeId) // Remove our target node from the parent way
                    .addNode(replacementNode.id, originalIndex); // Add in the replacement node in its place
                // Update the graph with the updated way
                return accGraph.replace(updatedWay);
            },
                // Seed the reduction with the input graph, updated to include the replacementNode so
                // that is accessible to the ways when we add it in to them
                graph.replace(replacementNode));
    };
}
