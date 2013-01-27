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
                    area: entity.isDegenerate() ? 0 : Math.abs(d3.geom.polygon(points).area())
                });
            }
        }

        areas.sort(function(a, b) { return b.area - a.area; });

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

        areas = _.pluck(areas, 'entity');

        var fill = surface.select('.layer-fill'),
            stroke = surface.select('.layer-stroke'),
            fills = drawPaths(fill, areas, filter, 'way area fill'),
            strokes = drawPaths(stroke, areas, filter, 'way area stroke');
    };
};
