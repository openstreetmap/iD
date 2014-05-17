iD.svg.Turns = function(projection) {
    return function(surface, graph, turns) {
        var layer = surface.select('.layer-hit'),
            nTurns = turns.filter(function (d) { return !d.u; }),
            uTurns = turns.filter(function (d) { return  d.u; });

        var nGroups = layer.selectAll('g.turn.turn-n')
            .data(nTurns);
        var uGroups = layer.selectAll('g.turn.turn-u')
            .data(uTurns);

        // Enter

        var nEnter = nGroups.enter().append('g')
            .attr('class', 'turn turn-n');
        var uEnter = uGroups.enter().append('g')
            .attr('class', 'turn turn-u');

        nEnter.append('rect')
            .attr('transform', 'translate(-12, -12)')
            .attr('width', '45')
            .attr('height', '25');
        uEnter.append('circle')
            .attr('r', '16');

        nEnter.append('use')
            .attr('transform', 'translate(-12, -12)')
            .attr('clip-path', 'url(#clip-square-45)');
        uEnter.append('use')
            .attr('transform', 'translate(-16, -16)')
            .attr('clip-path', 'url(#clip-square-32)');

        // Update

        layer.selectAll('g.turn')
            .classed('restricted', function(turn) {
                return turn.restriction;
            })
            .attr('transform', function(turn) {
                var v = graph.entity(turn.via.node),
                    t = graph.entity(turn.to.node),
                    a = iD.geo.angle(v, t, projection),
                    p = projection(v.loc),
                    r = turn.u ? 0 : 60;

                return 'translate(' + (r * Math.cos(a) + p[0]) + ',' + (r * Math.sin(a) + p[1]) + ')' +
                    'rotate(' + a * 180 / Math.PI + ')';
            });

        nGroups.select('use')
            .attr('xlink:href', function(turn) { return '#icon-restriction-' + (turn.restriction ? 'no' : 'yes'); });
        uGroups.select('use')
            .attr('xlink:href', function(turn) { return '#icon-restriction-' + (turn.restriction ? 'no' : 'yes') + '-u'; });

        nGroups.select('rect');
        uGroups.select('circle');

        // Exit

        nGroups.exit()
            .remove();
        uGroups.exit()
            .remove();

        return this;
    };
};
