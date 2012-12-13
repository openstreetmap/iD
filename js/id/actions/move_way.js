iD.actions.MoveWay = function(wayId, dxdy, projection) {
    return function(graph) {
        var way = graph.entity(wayId);

        _.uniq(way.nodes).forEach(function(id) {
            var node  = graph.entity(id),
                start = projection(node.loc),
                end   = projection.invert([start[0] + dxdy[0], start[1] + dxdy[1]]);
            graph = iD.actions.MoveNode(id, end)(graph);
        });

        return graph;
    };
};
