iD.svg.Midpoints = function(projection) {
    return function drawMidpoints(surface, graph, entities, filter) {
        var midpoints = [], edges = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (entity.type !== 'way')
                continue;

            var nodes = graph.childNodes(entity);
            for (var j = 0; j < nodes.length - 1; j++) {
                var a = nodes[j],
                    b = nodes[j + 1];
                var apx = projection(a.loc);
                var bpx = projection(b.loc);
                var edgeId = [a.id, b.id].sort().join('-');
                if (iD.geo.dist(apx, bpx) > 40 && !edges[edgeId]) {
                    edges[edgeId] = true;
                    var parents = _.intersection(
                        graph.parentWays(a),
                        graph.parentWays(b));
                    var indices = parents.map(function(p) {
                        var bi = _.lastIndexOf(p.nodes, b.id),
                            ai = _.lastIndexOf(p.nodes, a.id);
                        if (ai > bi) bi++; // reversed direction
                        return bi;
                    });
                    midpoints.push({
                        loc: iD.geo.interp(nodes[j].loc, nodes[j + 1].loc, 0.5),
                        ways: _.pluck(parents, 'id'),
                        indices: indices,
                        midpoint: true
                    });
                }
            }
        }

        var groups = surface.select('.layer-hit').selectAll('g.midpoint')
            .filter(filter)
            .data(midpoints, function (d) { return [d.ways, d.indices].join(","); });

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
