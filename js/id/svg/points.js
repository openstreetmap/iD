iD.svg.Points = function(projection, context) {
    function markerPath(selection, klass) {
        selection
            .attr('class', klass)
            .attr('transform', 'translate(-8, -23)')
            .attr('d', 'M 17,8 C 17,13 11,21 8.5,23.5 C 6,21 0,13 0,8 C 0,4 4,-0.5 8.5,-0.5 C 13,-0.5 17,4 17,8 z');
    }

    function sortY(a, b) {
        return b.loc[1] - a.loc[1];
    }

    return function drawPoints(surface, graph, entities, filter) {
        var wireframe = surface.classed('fill-wireframe'),
            points = wireframe ? [] : _.filter(entities, function(e) {
                return e.geometry(graph) === 'point';
            });

        points.sort(sortY);

        var groups = surface.selectAll('.layer-hit').selectAll('g.point')
            .filter(filter)
            .data(points, iD.Entity.key);

        var group = groups.enter()
            .append('g')
            .attr('class', function(d) { return 'node point ' + d.id; })
            .order();

        group.append('path')
            .call(markerPath, 'shadow');

        group.append('path')
            .call(markerPath, 'stroke');

        group.append('use')
            .attr('transform', 'translate(-6, -20)')
            .attr('class', 'icon')
            .attr('width', '12px')
            .attr('height', '12px');

        groups.attr('transform', iD.svg.PointTransform(projection))
            .call(iD.svg.TagClasses());

        // Selecting the following implicitly
        // sets the data (point entity) on the element
        groups.select('.shadow');
        groups.select('.stroke');
        groups.select('.icon')
            .attr('xlink:href', function(entity) {
                var preset = context.presets().match(entity, graph);
                return preset.icon ? '#' + preset.icon + '-12' : '';
            });

        groups.exit()
            .remove();
    };
};
