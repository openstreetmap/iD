iD.svg.Points = function(projection, context) {
    return function drawPoints(surface, graph, entities, filter) {
        function imageHref(entity) {
            var preset = context.presets()
                .match(entity, context.graph());
            return '#maki-' + preset.icon + '-12';
        }

        var points = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity.geometry(graph) === 'point') {
                points.push(entity);
            }
        }

        if (points.length > 100) {
            return surface.select('.layer-hit').selectAll('g.point').remove();
        }

        var groups = surface.select('.layer-hit').selectAll('g.point')
            .filter(filter)
            .data(points, iD.Entity.key);

        var group = groups.enter()
            .append('g')
            .attr('class', 'node point');

        group.append('circle')
            .attr('r', 12)
            .attr('class', 'shadow');

        group.append('circle')
            .attr('class', 'stroke')
            .attr('r', 8);

        group.append('use')
            .attr('transform', 'translate(-6, -6)')
            .attr('clip-path', 'url(#clip-square-12)');

        groups.attr('transform', iD.svg.PointTransform(projection))
            .call(iD.svg.TagClasses())
            .call(iD.svg.MemberClasses(graph));

        // Selecting the following implicitly
        // sets the data (point entity) on the element
        groups.select('use')
            .attr('xlink:href', imageHref);
        groups.select('.shadow');
        groups.select('.stroke');

        groups.exit()
            .remove();
    };
};
