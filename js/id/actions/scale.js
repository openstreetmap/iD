//https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/ScaleCommand.java
iD.actions.Scale = function(wayId, pivot, scaleFactor, projection) {
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
                    pivot[0] + (scaleFactor * radial[0]),
                    pivot[1] + (scaleFactor * radial[1])
                ];

                graph = graph.replace(node.move(projection.invert(point)));

            });

        });
    };
};
