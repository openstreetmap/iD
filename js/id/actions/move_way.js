iD.actions.MoveWay = function(wayId, delta, projection) {
    return function(graph) {
        return graph.update(function(graph) {
            var way = graph.entity(wayId);

            _.uniq(way.nodes).forEach(function(id) {
                var node = graph.entity(id),
                    start = projection(node.loc),
                    end = projection.invert([start[0] + delta[0], start[1] + delta[1]]);
                graph = graph.replace(node.move(end));
            });
        });
    };
};
