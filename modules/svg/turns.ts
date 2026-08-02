import type { osmTurn } from '../osm';
import type { coreGraph } from '../core';
import { geoAngle, geoPathLength } from '../geo';
import type { Projection } from '../geo/raw_mercator';
import type { Vec2 } from '../geo/vector';

export function svgTurns(projection: Projection, context: iD.Context) {
    function icon(turn: osmTurn) {
        const u = turn.u ? '-u' : '';
        if (turn.no) return '#iD-turn-no' + u;
        if (turn.only) return '#iD-turn-only' + u;
        return '#iD-turn-yes' + u;
    }

    function drawTurns(this: unknown, selection: d3.Selection, graph: coreGraph, turns: osmTurn[]) {
        function turnTransform(d: osmTurn) {
            const pxRadius = 50;
            const toWay = graph.entity(d.to.way);
            const toPoints: Vec2[] = graph
                .childNodes(toWay)
                .map(function (n) {
                    return n.loc;
                })
                .map(projection);
            const toLength = geoPathLength(toPoints);
            const mid = toLength / 2; // midpoint of destination way

            const toNode = graph.entity(d.to.node);
            const toVertex = graph.entity(d.to.vertex);
            const a = geoAngle(toVertex, toNode, projection);
            const o = projection(toVertex.loc);
            const r = d.u
                ? 0 // u-turn: no radius
                : !toWay.__via
                  ? pxRadius // leaf way: put marker at pxRadius
                  : Math.min(mid, pxRadius); // via way: prefer pxRadius, fallback to mid for very short ways

            return (
                'translate(' +
                (r * Math.cos(a) + o[0]) +
                ',' +
                (r * Math.sin(a) + o[1]) +
                ') ' +
                'rotate(' +
                (a * 180) / Math.PI +
                ')'
            );
        }

        const drawLayer = selection.selectAll('.layer-osm.points .points-group.turns');
        const touchLayer = selection.selectAll('.layer-touch.turns');

        // Draw turns..
        let groups = drawLayer.selectAll<SVGGElement, osmTurn>('g.turn').data(turns, function (d) {
            return d.key;
        });

        // exit
        groups.exit().remove();

        // enter
        let groupsEnter = groups
            .enter()
            .append('g')
            .attr('class', function (d) {
                return 'turn ' + d.key;
            });

        let turnsEnter = groupsEnter.filter(function (d) {
            return !d.u;
        });

        turnsEnter
            .append('rect')
            .attr('transform', 'translate(-22, -12)')
            .attr('width', '44')
            .attr('height', '24');

        turnsEnter
            .append('use')
            .attr('transform', 'translate(-22, -12)')
            .attr('width', '44')
            .attr('height', '24');

        let uEnter = groupsEnter.filter(function (d) {
            return d.u;
        });

        uEnter.append('circle').attr('r', '16');

        uEnter
            .append('use')
            .attr('transform', 'translate(-16, -16)')
            .attr('width', '32')
            .attr('height', '32');

        // update
        groups = groups
            .merge(groupsEnter)
            .attr('opacity', function (d) {
                return d.direct === false ? '0.7' : null;
            })
            .attr('transform', turnTransform);

        groups.select('use').attr('xlink:href', icon);

        groups.select('rect'); // propagate bound data
        groups.select('circle'); // propagate bound data

        // Draw touch targets..
        const fillClass = context.getDebug('target') ? 'pink ' : 'nocolor ';
        groups = touchLayer.selectAll<SVGGElement, osmTurn>('g.turn').data(turns, function (d) {
            return d.key;
        });

        // exit
        groups.exit().remove();

        // enter
        groupsEnter = groups
            .enter()
            .append('g')
            .attr('class', function (d) {
                return 'turn ' + d.key;
            });

        turnsEnter = groupsEnter.filter(function (d) {
            return !d.u;
        });

        turnsEnter
            .append('rect')
            .attr('class', 'target ' + fillClass)
            .attr('transform', 'translate(-22, -12)')
            .attr('width', '44')
            .attr('height', '24');

        uEnter = groupsEnter.filter(function (d) {
            return d.u;
        });

        uEnter
            .append('circle')
            .attr('class', 'target ' + fillClass)
            .attr('r', '16');

        // update
        groups = groups.merge(groupsEnter).attr('transform', turnTransform);

        groups.select('rect'); // propagate bound data
        groups.select('circle'); // propagate bound data

        return this;
    }

    return drawTurns;
}
