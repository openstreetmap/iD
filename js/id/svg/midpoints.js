iD.svg.Midpoints = function(projection) {
    return function drawMidpoints(surface, graph, entities, filter) {
        var midpoints = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (entity.type !== 'way')
                continue;

            var nodes = graph.childNodes(entity);
            for (var j = 0; j < nodes.length - 1; j++) {
                var a = projection(nodes[j].loc);
                var b = projection(nodes[j + 1].loc);
                if (iD.geo.dist(a, b) > 40) {
                    midpoints.push({
                        loc: iD.geo.interp(nodes[j].loc, nodes[j + 1].loc, 0.5),
                        way: entity.id,
                        index: j + 1,
                        midpoint: true
                    });
                }
            }
        }

        var groups = surface.select('.layer-hit').selectAll('g.midpoint')
            .filter(filter)
            .data(midpoints, function (d) { return [d.way, d.index].join(","); });

        var group = groups.enter()
            .insert('g', ':first-child')
            .attr('class', 'midpoint');

        group.append('circle')
            .attr('r', 7)
            .attr('class', 'shadow');

        group.append('circle')
            .attr('r', 3)
            .attr('class', 'fill');

        groups.attr('transform', iD.svg.PointTransform(projection));

        groups.exit()
            .remove();
    };
};
