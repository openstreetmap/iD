import { geoAngle } from '../geo/index';


export function svgTurns(projection) {

    return function drawTurns(selection, graph, turns) {

        function key(turn) {
            return [turn.from.node + turn.via.node + turn.to.node].join('-');
        }

        function icon(turn) {
            var u = turn.u ? '-u' : '';
            if (!turn.restriction)
                return '#turn-yes' + u;
            var restriction = graph.entity(turn.restriction).tags.restriction;
            return '#turn-' +
                (!turn.indirect_restriction && /^only_/.test(restriction) ? 'only' : 'no') + u;
        }

        var groups = selection.selectAll('.layer-hit').selectAll('g.turn')
            .data(turns, key);

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
                var v = graph.entity(turn.via.node),
                    t = graph.entity(turn.to.node),
                    a = geoAngle(v, t, projection),
                    p = projection(v.loc),
                    r = turn.u ? 0 : 60;

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
