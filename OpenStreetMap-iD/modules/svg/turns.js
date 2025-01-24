import { geoAngle, geoPathLength } from '../geo';


export function svgTurns(projection, context) {

    function icon(turn) {
        var u = turn.u ? '-u' : '';
        if (turn.no) return '#iD-turn-no' + u;
        if (turn.only) return '#iD-turn-only' + u;
        return '#iD-turn-yes' + u;
    }

    function drawTurns(selection, graph, turns) {

        function turnTransform(d) {
            var pxRadius = 50;
            var toWay = graph.entity(d.to.way);
            var toPoints = graph.childNodes(toWay)
                .map(function (n) { return n.loc; })
                .map(projection);
            var toLength = geoPathLength(toPoints);
            var mid = toLength / 2;    // midpoint of destination way

            var toNode = graph.entity(d.to.node);
            var toVertex = graph.entity(d.to.vertex);
            var a = geoAngle(toVertex, toNode, projection);
            var o = projection(toVertex.loc);
            var r = d.u ? 0                  // u-turn: no radius
                : !toWay.__via ? pxRadius    // leaf way: put marker at pxRadius
                : Math.min(mid, pxRadius);   // via way: prefer pxRadius, fallback to mid for very short ways

            return 'translate(' + (r * Math.cos(a) + o[0]) + ',' + (r * Math.sin(a) + o[1]) + ') ' +
                'rotate(' + a * 180 / Math.PI + ')';
        }


        var drawLayer = selection.selectAll('.layer-osm.points .points-group.turns');
        var touchLayer = selection.selectAll('.layer-touch.turns');

        // Draw turns..
        var groups = drawLayer.selectAll('g.turn')
            .data(turns, function(d) { return d.key; });

        // exit
        groups.exit()
            .remove();

        // enter
        var groupsEnter = groups.enter()
            .append('g')
            .attr('class', function(d) { return 'turn ' + d.key; });

        var turnsEnter = groupsEnter
            .filter(function(d) { return !d.u; });

        turnsEnter.append('rect')
            .attr('transform', 'translate(-22, -12)')
            .attr('width', '44')
            .attr('height', '24');

        turnsEnter.append('use')
            .attr('transform', 'translate(-22, -12)')
            .attr('width', '44')
            .attr('height', '24');

        var uEnter = groupsEnter
            .filter(function(d) { return d.u; });

        uEnter.append('circle')
            .attr('r', '16');

        uEnter.append('use')
            .attr('transform', 'translate(-16, -16)')
            .attr('width', '32')
            .attr('height', '32');

        // update
        groups = groups
            .merge(groupsEnter)
            .attr('opacity', function(d) { return d.direct === false ? '0.7' : null; })
            .attr('transform', turnTransform);

        groups.select('use')
            .attr('xlink:href', icon);

        groups.select('rect');      // propagate bound data
        groups.select('circle');    // propagate bound data


        // Draw touch targets..
        var fillClass = context.getDebug('target') ? 'pink ' : 'nocolor ';
        groups = touchLayer.selectAll('g.turn')
            .data(turns, function(d) { return d.key; });

        // exit
        groups.exit()
            .remove();

        // enter
        groupsEnter = groups.enter()
            .append('g')
            .attr('class', function(d) { return 'turn ' + d.key; });

        turnsEnter = groupsEnter
            .filter(function(d) { return !d.u; });

        turnsEnter.append('rect')
            .attr('class', 'target ' + fillClass)
            .attr('transform', 'translate(-22, -12)')
            .attr('width', '44')
            .attr('height', '24');

        uEnter = groupsEnter
            .filter(function(d) { return d.u; });

        uEnter.append('circle')
            .attr('class', 'target ' + fillClass)
            .attr('r', '16');

        // update
        groups = groups
            .merge(groupsEnter)
            .attr('transform', turnTransform);

        groups.select('rect');      // propagate bound data
        groups.select('circle');    // propagate bound data


        return this;
    }

    return drawTurns;
}
