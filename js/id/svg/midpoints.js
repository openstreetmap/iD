iD.svg.Midpoints = function() {
    return function(surface, graph, entities, filter, projection) {
        var midpoints = [];

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (entity.type !== 'way')
                continue;

            for (var j = 0; j < entity.nodes.length - 1; j++) {
                var a = projection(entity.nodes[j].loc);
                var b = projection(entity.nodes[j + 1].loc);
                if (iD.util.geo.dist(a, b) > 40) {
                    midpoints.push({
                        loc: iD.util.geo.interp(entity.nodes[j].loc, entity.nodes[j + 1].loc, 0.5),
                        way: entity.id,
                        index: j + 1,
                        midpoint: true
                    });
                }
            }
        }

        var handles = surface.select('.layer-hit').selectAll('circle.midpoint')
            .filter(filter)
            .data(midpoints, function (d) { return [d.way, d.index].join(","); });

        handles.enter()
            .append('circle')
            .attr({ r: 3, 'class': 'midpoint' });

        handles.attr('transform', iD.svg.PointTransform(projection));

        handles.exit()
            .remove();
    };
};
