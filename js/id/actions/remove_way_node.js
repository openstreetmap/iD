iD.actions.RemoveWayNode = function(way, node) {
    return function(graph) {
        var nodes = _.without(way.nodes, node.id);
        return graph.replace(way.update({nodes: nodes}), 'removed from a road');
    };
};
