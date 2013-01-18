iD.svg.Vertices = function() {
    return function drawVertices(surface, graph, entities, filter, projection) {
        var vertices = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry() === 'vertex') {
                vertices.push(entity);
            }
        }

        if (vertices.length > 2000) {
            return surface.select('.layer-hit').selectAll('g.vertex').remove();
        }

        var groups = surface.select('.layer-hit').selectAll('g.vertex')
            .filter(filter)
            .data(vertices, iD.Entity.key);

        var group = groups.enter()
            .insert('g', ':first-child')
            .attr('class', 'node vertex');

        group.append('circle')
            .attr('class', 'stroke')
            .attr('r', 6);

        group.append('circle')
            .attr('class', 'fill')
            .attr('r', 4);

        groups.attr('transform', iD.svg.PointTransform(projection))
            .call(iD.svg.TagClasses())
            .classed('shared', function(entity) { return graph.parentWays(entity).length > 1; });

        // Selecting the following implicitly
        // sets the data (vertix entity) on the elements
        groups.select('circle.fill');
        groups.select('circle.stroke');

        groups.exit()
            .remove();
    };
};
