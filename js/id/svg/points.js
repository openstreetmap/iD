iD.svg.Points = function() {
    return function(surface, graph, entities, filter, projection) {
        var points = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry() === 'point') {
                points.push(entity);
            }
        }

        var groups = surface.select('.layer-hit').selectAll('g.point')
            .filter(filter)
            .data(points, iD.Entity.key);

        var group = groups.enter()
            .append('g')
            .attr('class', 'node point');

        group.append('circle')
            .attr('class', 'stroke')
            .attr({ r: 10 });

        group.append('circle')
            .attr('class', 'fill')
            .attr({ r: 10 });

        group.append('image')
            .attr({ width: 16, height: 16 })
            .attr('transform', 'translate(-8, -8)');

        groups.attr('transform', iD.svg.PointTransform(projection));

        // Selecting the following implicitly
        // sets the data (point entity) on the element
        groups.select('image')
            .attr('xlink:href', iD.Style.pointImage);

        groups.exit()
            .remove();
    };
};
