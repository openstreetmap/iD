import { geoAngle, geoPathLength } from '../geo';


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
                var pxRadius = 50;
                var toWay = graph.entity(turn.to.way);
                var toPoints = graph.childNodes(toWay)
                    .map(function (n) { return n.loc; })
                    .map(projection);
                var toLength = geoPathLength(toPoints);
                var mid = toLength / 2;    // midpoint of destination way

                var toNode = graph.entity(turn.to.node);
                var toVertex = graph.entity(turn.to.vertex);
                var a = geoAngle(toVertex, toNode, projection);
                var o = projection(toVertex.loc);
                var r = turn.u ? 0               // u-turn: no radius
                    : !toWay.__via ? pxRadius    // leaf way: put marker at pxRadius
                    : Math.min(mid, pxRadius);   // via way: prefer pxRadius, fallback to mid for very short ways

                return 'translate(' + (r * Math.cos(a) + o[0]) + ',' + (r * Math.sin(a) + o[1]) + ') ' +
                    'rotate(' + a * 180 / Math.PI + ')';
            });

        groups.select('use')
            .attr('xlink:href', icon);

        groups.select('rect');
        groups.select('circle');

        return this;
    };
}
