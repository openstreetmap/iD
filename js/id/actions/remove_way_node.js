iD.actions.RemoveWayNode = function(wayId, nodeId) {
    return function(graph) {
        var way = graph.entity(wayId),
            nodes = _.without(way.nodes, nodeId);
        return graph.replace(way.update({nodes: nodes}), 'removed from a road');
    };
};
