iD.svg.Multipolygons = function(projection) {
    return function(surface, graph, entities, filter) {
        var multipolygons = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry() === 'relation' && entity.tags.type === 'multipolygon') {
                multipolygons.push(entity);
            }
        }

        var lineStrings = {};

        function lineString(entity) {
            if (lineStrings[entity.id] !== undefined) {
                return lineStrings[entity.id];
            }

            var multipolygon = entity.multipolygon(graph);
            if (entity.members.length == 0 || !multipolygon) {
                return (lineStrings[entity.id] = null);
            }

            multipolygon = _.flatten(multipolygon, true);
            return (lineStrings[entity.id] =
                multipolygon.map(function (ring) {
                    return 'M' + ring.map(function (node) { return projection(node.loc); }).join('L');
                }).join(""));
        }

        function drawPaths(group, multipolygons, filter, classes) {
            var paths = group.selectAll('path.multipolygon')
                .filter(filter)
                .data(multipolygons, iD.Entity.key);

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
            paths = drawPaths(fill, multipolygons, filter, 'relation multipolygon');
    };
};
