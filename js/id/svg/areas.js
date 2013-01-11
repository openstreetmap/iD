iD.svg.Areas = function() {
    return function(surface, graph, entities, filter, projection) {
        var areas = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry() === 'area') {
                areas.push(entity);
            }
        }

        var lineStrings = {};

        function lineString(entity) {
            return lineStrings[entity.id] || (lineStrings[entity.id] =
                'M' + _.pluck(entity.nodes, 'loc').map(iD.svg.RoundProjection(projection)).join('L'));
        }

        function drawPaths(group, areas, filter, classes) {
            var paths = group.selectAll('path')
                .filter(filter)
                .data(areas, iD.Entity.key);

            paths.enter()
                .append('path')
                .attr('class', classes);

            paths
                .order()
                .attr('d', lineString)
                .call(iD.svg.TagClasses());

            paths.exit()
                .remove();

            return paths;
        }

        var fill = surface.select('.layer-fill'),
            paths = drawPaths(fill, areas, filter, 'way area');
    };
};
