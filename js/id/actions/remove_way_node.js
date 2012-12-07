iD.actions.RemoveWayNode = function(wayId, nodeId) {
    return function(graph) {
        var way = graph.entity(wayId), nodes;
        // If this is the connecting node in a closed area
        if (way.nodes.length > 1 &&
            _.indexOf(way.nodes, nodeId) === 0 &&
            _.lastIndexOf(way.nodes, nodeId) === way.nodes.length - 1) {
            // Remove the node
            nodes = _.without(way.nodes, nodeId);
            // And reclose the way on the new first node.
            nodes.push(nodes[0]);
        } else {
            nodes = _.without(way.nodes, nodeId);
        }
        return graph.replace(way.update({nodes: nodes}));
    };
};
