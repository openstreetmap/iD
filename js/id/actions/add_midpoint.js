iD.actions.AddMidpoint = function(midpoint, node) {
    return function(graph) {
        graph = graph.replace(node.move(midpoint.loc));

        midpoint.ways.forEach(function(way) {
            graph = graph.replace(graph.entity(way.id).addNode(node.id, way.index));
        });

        return graph;
    };
};
