iD.svg.Turns = function(projection) {
    return function(surface, graph, wayID) {
        var turns = wayID ? iD.geo.turns(graph, wayID) : [];

        var groups = surface.select('.layer-hit').selectAll('g.turn')
            .data(turns, function(turn) { return turn.key(); });

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
                return iD.svg.PointTransform(projection)(turn.via) +
                    'rotate(' + turn.angle(projection) * 180 / Math.PI + ')';
            });

        groups.exit()
            .remove();

        return this;
    };
};
