iD.svg.Turns = function(projection) {
    return function(surface, graph, turns) {
        var groups = surface.select('.layer-hit').selectAll('g.turn')
            .data(turns);

        var enter = groups.enter().append('g')
            .attr('class', 'turn');

        enter.append('path')
            .attr('class', 'turn')
            .attr('d', function() {
                return 'M20 0 L50 0 M40 10 L50 0 M40 -10 L50 0';
            });

        groups
            .classed('restricted', function(turn) {
                return turn.restriction;
            })
            .attr('transform', function(turn) {
                var v = graph.entity(turn.via.node),
                    t = graph.entity(turn.to.node);
                return iD.svg.PointTransform(projection)(v) +
                    'rotate(' + iD.geo.angle(v, t, projection) + ')';
            });

        groups.select('path'); // Propagate updated data.

        groups.exit()
            .remove();

        return this;
    };
};
