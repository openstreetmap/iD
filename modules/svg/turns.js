import { geoAngle, geoVecLength } from '../geo';


export function svgTurns(projection) {

    return function drawTurns(selection, graph, turns) {

        function icon(turn) {
            var u = turn.u ? '-u' : '';
            if (turn.direct || turn.indirect) return '#turn-no' + u;
            if (turn.only) return '#turn-only' + u;
            return '#turn-yes' + u;
        }

        var layer = selection.selectAll('.data-layer-osm').selectAll('.layer-turns')
            .data([0]);

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-osm layer-turns')
            .merge(layer);


        var groups = layer.selectAll('g.turn')
            .data(turns, function(d) { return d.key; });

        groups.exit()
            .remove();


        var enter = groups.enter()
            .append('g')
            .attr('class', 'turn');

        var nEnter = enter
            .filter(function (turn) { return !turn.u; });

        nEnter.append('rect')
            .attr('transform', 'translate(-22, -12)')
            .attr('width', '44')
            .attr('height', '24');

        nEnter.append('use')
            .attr('transform', 'translate(-22, -12)')
            .attr('width', '44')
            .attr('height', '24');


        var uEnter = enter
            .filter(function (turn) { return turn.u; });

        uEnter.append('circle')
            .attr('r', '16');

        uEnter.append('use')
            .attr('transform', 'translate(-16, -16)')
            .attr('width', '32')
            .attr('height', '32');


        groups = groups
            .merge(enter);

        groups
            .attr('transform', function (turn) {
                var t = graph.entity(turn.to.node);
                var v = graph.entity(turn.to.vertex);
                var a = geoAngle(v, t, projection);
                var p = projection(v.loc);
                var q = projection(t.loc);
                var mid = geoVecLength(p, q) / 2;
                var r = turn.u ? 0 : Math.min(mid, 50);

                return 'translate(' + (r * Math.cos(a) + p[0]) + ',' + (r * Math.sin(a) + p[1]) + ') ' +
                    'rotate(' + a * 180 / Math.PI + ')';
            });

        groups.select('use')
            .attr('xlink:href', icon);

        groups.select('rect');
        groups.select('circle');

        return this;
    };
}
