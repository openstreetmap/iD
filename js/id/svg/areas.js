iD.svg.Areas = function(projection) {
    return function drawAreas(surface, graph, entities, filter) {
        var path = d3.geo.path().projection(projection),
            areas = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) === 'area') {
                areas.push({
                    entity: entity,
                    area: Math.abs(path.area(entity.asGeoJSON(graph)))
                });
            }
        }

        areas.sort(function(a, b) { return b.area - a.area; });

        function drawPaths(group, areas, filter, klass) {
            var tagClasses = iD.svg.TagClasses();

            if (klass === 'stroke') {
                tagClasses.tags(iD.svg.MultipolygonMemberTags(graph));
            }

            var paths = group.selectAll('path.area')
                .filter(filter)
                .data(areas, iD.Entity.key);

            paths.enter()
                .append('path')
                .attr('class', function (d) { return d.type + ' area ' + klass; });

            paths
                .order()
                .attr('d', function (entity) { return path(entity.asGeoJSON(graph)); })
                .call(tagClasses)
                .call(iD.svg.MemberClasses(graph));

            paths.exit()
                .remove();

            return paths;
        }

        areas = _.pluck(areas, 'entity');

        var strokes = areas.filter(function (area) {
            return area.type === 'way';
        });

        var fill = surface.select('.layer-fill'),
            stroke = surface.select('.layer-stroke');

        drawPaths(fill, areas, filter, 'fill');
        drawPaths(stroke, strokes, filter, 'stroke');
    };
};
