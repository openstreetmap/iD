iD.svg.Midpoints = function(projection, context) {
    return function drawMidpoints(surface, graph, entities, filter, extent) {
        var midpoints = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (entity.type !== 'way') continue;
            if (context.selectedIDs().indexOf(entity.id) < 0) continue;

            var nodes = graph.childNodes(entity);

            // skip the last node because it is always repeated
            for (var j = 0; j < nodes.length - 1; j++) {

                var a = nodes[j],
                    b = nodes[j + 1],
                    id = [a.id, b.id].sort().join('-');

                // If neither of the nodes changed, no need to redraw midpoint
                if (!midpoints[id] && (filter(a) || filter(b))) {
                    var clipped = iD.geo.clip(a.loc, b.loc, extent);

                    if (clipped != null) {
                        var loc = iD.geo.interp(clipped[0], clipped[1], 0.5);

                        if (extent.intersects(loc) && iD.geo.dist(projection(a.loc), projection(b.loc)) > 40) {
                            midpoints[id] = {
                                type: 'midpoint',
                                id: id,
                                loc: loc,
                                edge: [a.id, b.id]
                            };
                        }
                    }
                }
            }
        }

        var groups = surface.select('.layer-hit').selectAll('g.midpoint')
            .filter(filter)
            .data(_.values(midpoints), function(d) { return d.id; });

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

        // Propagate data bindings.
        groups.select('circle.shadow');
        groups.select('circle.fill');

        groups.exit()
            .remove();
    };
};
