iD.svg.Midpoints = function(projection) {
    return function drawMidpoints(surface, graph, entities, filter) {
        var midpoints = {};

        for (var i = 0; i < entities.length; i++) {
            if (entities[i].type !== 'way') continue;

            var entity = entities[i],
                nodes = graph.childNodes(entity);

            // skip the last node because it is always repeated
            for (var j = 0; j < nodes.length - 1; j++) {

                var a = nodes[j],
                    b = nodes[j + 1],
                    id = [a.id, b.id].sort().join('-');

                if (!midpoints[id] &&
                    iD.geo.dist(projection(a.loc), projection(b.loc)) > 40) {

                    var midpoint_loc = iD.geo.interp(a.loc, b.loc, 0.5),
                        parents = _.intersection(graph.parentWays(a),
                            graph.parentWays(b));

                    midpoints[id] = {
                        loc: midpoint_loc,
                        ways: parents,
                        nodes: [a.id, b.id],
                        id: id,
                        midpoint: true
                    };
                }
            }
        }

        var groups = surface.select('.layer-hit').selectAll('g.midpoint')
            .filter(filter)
            .data(_.values(midpoints), function (d) { return [d.parents, d.id].join(","); });

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
