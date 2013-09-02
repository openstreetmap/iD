iD.actions.AddMidpoint = function(midpoint, node) {
    return function(graph) {
        graph = graph.replace(node.move(midpoint.loc));

        var parents = _.intersection(
            graph.parentWays(graph.entity(midpoint.edge[0])),
            graph.parentWays(graph.entity(midpoint.edge[1])));

        parents.forEach(function(way) {
            for (var i = 0; i < way.nodes.length - 1; i++) {
                if ((way.nodes[i]     === midpoint.edge[0] &&
                     way.nodes[i + 1] === midpoint.edge[1]) ||
                    (way.nodes[i]     === midpoint.edge[1] &&
                     way.nodes[i + 1] === midpoint.edge[0])) {
                    graph = graph.replace(graph.entity(way.id).addNode(node.id, i + 1));

                    // Add only one midpoint on doubled-back segments,
                    // turning them into self-intersections.
                    return;
                }
            }
        });

        return graph;
    };
};
