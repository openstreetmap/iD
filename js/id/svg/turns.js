iD.svg.Turns = function(projection) {
    return function(surface, graph, turns) {
        var groups = surface.select('.layer-hit').selectAll('g.turn')
            .data(turns);

        // Enter

        var enter = groups.enter().append('g')
            .attr('class', 'turn');

        enter.append('rect')
            .attr('transform', 'translate(-12, -12)')
            .attr('width', '45')
            .attr('height', '25');

        enter.append('use')
            .attr('transform', 'translate(-12, -12)')
            .attr('clip-path', 'url(#clip-square-45)');

        // Update

        groups
            .classed('restricted', function(turn) {
                return turn.restriction;
            })
            .attr('transform', function(turn) {
                var v = graph.entity(turn.via.node),
                    t = graph.entity(turn.to.node),
                    a = iD.geo.angle(v, t, projection),
                    p = projection(v.loc),
                    r = 60;

                return 'translate(' + (r * Math.cos(a) + p[0]) + ',' + (r * Math.sin(a) + p[1]) + ')' +
                    'rotate(' + a * 180 / Math.PI + ')';
            });

        groups.select('use')
            .attr('xlink:href', function(turn) { return '#icon-restriction-' + (turn.restriction ? 'no' : 'yes'); });

        groups.select('rect');

        // Exit

        groups.exit()
            .remove();

        return this;
    };
};
