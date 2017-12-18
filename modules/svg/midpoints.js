import _values from 'lodash-es/values';

import {
    svgPointTransform,
    svgTagClasses
} from './index';

import {
    geoAngle,
    geoEuclideanDistance,
    geoInterp,
    geoLineIntersection
} from '../geo';


export function svgMidpoints(projection, context) {


    function drawTargets(selection, graph, entities, filter) {
        var fillClass = context.getDebug('target') ? 'pink ' : 'nocolor ';
        var targets = selection.selectAll('.midpoint.target')
            .filter(filter)
            .data(entities, function key(d) { return d.id; });

        // exit
        targets.exit()
            .remove();

        // enter/update
        targets.enter()
            .append('circle')
            .attr('r', 12)
            .merge(targets)
            .attr('class', function(d) { return 'node midpoint target ' + fillClass + d.id; })
            .attr('transform', svgPointTransform(projection));
    }


    function drawMidpoints(selection, graph, entities, filter, extent) {
        var layer = selection.selectAll('.layer-points .layer-points-midpoints');

        var mode = context.mode();
        if (mode && mode.id !== 'select') {
            layer.selectAll('g.midpoint')
                .remove();

            selection.selectAll('.layer-points .layer-points-targets .midpoint.target')
                .remove();

            return;
        }

        var poly = extent.polygon();
        var midpoints = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (entity.type !== 'way')
                continue;
            if (!filter(entity))
                continue;
            if (context.selectedIDs().indexOf(entity.id) < 0)
                continue;

            var nodes = graph.childNodes(entity);
            for (var j = 0; j < nodes.length - 1; j++) {

                var a = nodes[j];
                var b = nodes[j + 1];
                var id = [a.id, b.id].sort().join('-');

                if (midpoints[id]) {
                    midpoints[id].parents.push(entity);
                } else {
                    if (geoEuclideanDistance(projection(a.loc), projection(b.loc)) > 40) {
                        var point = geoInterp(a.loc, b.loc, 0.5);
                        var loc = null;

                        if (extent.intersects(point)) {
                            loc = point;
                        } else {
                            for (var k = 0; k < 4; k++) {
                                point = geoLineIntersection([a.loc, b.loc], [poly[k], poly[k + 1]]);
                                if (point &&
                                    geoEuclideanDistance(projection(a.loc), projection(point)) > 20 &&
                                    geoEuclideanDistance(projection(b.loc), projection(point)) > 20)
                                {
                                    loc = point;
                                    break;
                                }
                            }
                        }

                        if (loc) {
                            midpoints[id] = {
                                type: 'midpoint',
                                id: id,
                                loc: loc,
                                edge: [a.id, b.id],
                                parents: [entity]
                            };
                        }
                    }
                }
            }
        }


        function midpointFilter(d) {
            if (midpoints[d.id])
                return true;

            for (var i = 0; i < d.parents.length; i++) {
                if (filter(d.parents[i])) {
                    return true;
                }
            }

            return false;
        }


        var groups = layer
            .selectAll('g.midpoint')
            .filter(midpointFilter)
            .data(_values(midpoints), function(d) { return d.id; });

        groups.exit()
            .remove();

        var enter = groups.enter()
            .insert('g', ':first-child')
            .attr('class', 'midpoint');

        enter
            .append('polygon')
            .attr('points', '-6,8 10,0 -6,-8')
            .attr('class', 'shadow');

        enter
            .append('polygon')
            .attr('points', '-3,4 5,0 -3,-4')
            .attr('class', 'fill');

        groups = groups
            .merge(enter)
            .attr('transform', function(d) {
                var translate = svgPointTransform(projection);
                var a = graph.entity(d.edge[0]);
                var b = graph.entity(d.edge[1]);
                var angle = geoAngle(a, b, projection) * (180 / Math.PI);
                return translate(d) + ' rotate(' + angle + ')';
            })
            .call(svgTagClasses().tags(
                function(d) { return d.parents[0].tags; }
            ));

        // Propagate data bindings.
        groups.select('polygon.shadow');
        groups.select('polygon.fill');


        // Draw touch targets..
        selection.selectAll('.layer-points .layer-points-targets')
            .call(drawTargets, graph, _values(midpoints), midpointFilter);
    }

    return drawMidpoints;
}
