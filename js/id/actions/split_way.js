// https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/SplitWayAction.as
iD.actions.SplitWay = function(nodeId) {
    return function(graph) {
        var parents = graph.parentWays(nodeId);
        parents.forEach(function(way) {
            var idx = _.indexOf(way.nodes, nodeId);
            // Create a 'b' way that contains all of the tags in the second
            // half of this way
            var b = iD.Way({ tags: _.clone(way.tags), nodes: way.nodes.slice(idx) });
            graph = graph.replace(b);
            // Reduce the original way to only contain the first set of nodes
            graph = graph.replace(way.update({ nodes: way.nodes.slice(0, idx + 1) }), 'changed way direction');
        });
        return graph;
    };
};
