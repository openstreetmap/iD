iD.svg.Midpoints = function(projection) {
    return function drawMidpoints(surface, graph, entities, filter) {
        var midpoints = {};

        if (!surface.select('.layer-hit g.vertex').node()) {
            return surface.selectAll('.layer-hit g.midpoint').remove();
        }

        for (var i = 0; i < entities.length; i++) {
            if (entities[i].type !== 'way') continue;

            var entity = entities[i],
                nodes = graph.childNodes(entity);

            // skip the last node because it is always repeated
            for (var j = 0; j < nodes.length - 1; j++) {

                var a = nodes[j],
                    b = nodes[j + 1],
                    id = [a.id, b.id].sort().join('-');

                if (midpoints[id]) {
                    midpoints[id].ways.push({id: entity.id, index: j + 1});

                } else if (iD.geo.dist(projection(a.loc), projection(b.loc)) > 40) {
                    midpoints[id] = {
                        type: 'midpoint',
                        id: id,
                        loc: iD.geo.interp(a.loc, b.loc, 0.5),
                        ways: [{id: entity.id, index: j + 1}]
                    };
                }
            }
        }

        var groups = surface.select('.layer-hit').selectAll('g.midpoint')
            .filter(filter)
            .data(_.values(midpoints), function (d) { return d.id; });

        var group = groups.enter()
            .insert('g', ':first-child')
            .attr('class', 'midpoint');

        group.append('circle')
            .attr('r', 8)
            .attr('class', 'shadow');

        group.append('circle')
            .attr('r', 3)
            .attr('class', 'fill');

        groups.attr('transform', iD.svg.PointTransform(projection));

        groups.select('circle');

        groups.exit()
            .remove();
    };
};
