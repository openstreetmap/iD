iD.svg.Areas = function(projection) {
    return function drawAreas(surface, graph, entities, filter) {
        var areas = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) === 'area') {
                var points = graph.childNodes(entity).map(function(n) {
                    return projection(n.loc);
                });

                areas.push({
                    entity: entity,
                    area: entity.isDegenerate() ? 0 : d3.geom.polygon(points).area()
                });
            }
        }

        areas.sort(function(a, b) { return a.area - b.area; });

        var lineString = iD.svg.LineString(projection, graph);

        function drawPaths(group, areas, filter, classes) {
            var paths = group.selectAll('path.area')
                .filter(filter)
                .data(areas, iD.Entity.key);

            paths.enter()
                .append('path')
                .attr('class', classes);

            paths
                .order()
                .attr('d', lineString)
                .call(iD.svg.TagClasses())
                .call(iD.svg.MemberClasses(graph));

            paths.exit()
                .remove();

            return paths;
        }

        var fill = surface.select('.layer-fill'),
            paths = drawPaths(fill, _.pluck(areas, 'entity'), filter, 'way area');
    };
};
