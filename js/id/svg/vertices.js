iD.svg.Vertices = function(projection) {
    return function drawVertices(surface, graph, entities, filter) {
        var vertices = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) === 'vertex') {
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
            .attr('r', 10)
            .attr('class', 'node vertex shadow');

        group.append('circle')
            .attr('r', 4)
            .attr('class', 'node vertex stroke');

        group.append('circle')
            .attr('r', 3)
            .attr('class', 'node vertex fill');

        groups.attr('transform', iD.svg.PointTransform(projection))
            .call(iD.svg.TagClasses())
            .call(iD.svg.MemberClasses(graph))
            .classed('shared', function(entity) { return graph.isShared(entity); });

        // Selecting the following implicitly
        // sets the data (vertix entity) on the elements
        groups.select('circle.fill, circle.stroke, circle.shadow');

        groups.exit()
            .remove();
    };
};
