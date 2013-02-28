iD.actions.RotateWay = function(wayId, pivot, angle, projection) {
    return function(graph) {
        return graph.update(function(graph) {
            var way = graph.entity(wayId);

            _.unique(way.nodes).forEach(function(id) {

                var node = graph.entity(id),
                    point = projection(node.loc),
                    radial = [0,0];

                radial[0] = point[0] - pivot[0];
                radial[1] = point[1] - pivot[1];

                point = [
                    radial[0] * Math.cos(angle) - radial[1] * Math.sin(angle) + pivot[0],
                    radial[0] * Math.sin(angle) + radial[1] * Math.cos(angle) + pivot[1]
                ];

                graph = graph.replace(node.move(projection.invert(point)));

            });

        });
    };
};
