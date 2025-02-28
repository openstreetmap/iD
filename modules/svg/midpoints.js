import { svgPointTransform } from './helpers';
import { svgTagClasses } from './tag_classes';
import { geoAngle, geoLineIntersection, geoVecInterp, geoVecLength } from '../geo';


export function svgMidpoints(projection, context) {
    const targetRadius = 8;

    function drawTargets(selection, graph, entities, filter) {
        const fillClass = context.getDebug('target') ? 'pink ' : 'nocolor ';
        const getTransform = svgPointTransform(projection).geojson;

        const data = entities.map(function(midpoint) {
            return {
                type: 'Feature',
                id: midpoint.id,
                properties: {
                    target: true,
                    entity: midpoint
                },
                geometry: {
                    type: 'Point',
                    coordinates: midpoint.loc
                }
            };
        });

        const targets = selection.selectAll('.midpoint.target')
            .filter(function(d) { return filter(d.properties.entity); })
            .data(data, function key(d) { return d.id; });

        // exit
        targets.exit()
            .remove();

        // enter/update
        targets.enter()
            .append('circle')
            .attr('r', targetRadius)
            .merge(targets)
            .attr('class', function(d) { return 'node midpoint target ' + fillClass + d.id; })
            .attr('transform', getTransform);
    }


    function drawMidpoints(selection, graph, entities, filter, extent) {
        const drawLayer = selection.selectAll('.layer-osm.points .points-group.midpoints');
        const touchLayer = selection.selectAll('.layer-touch.points');

        const mode = context.mode();
        if ((mode && mode.id !== 'select') || !context.map().withinEditableZoom()) {
            drawLayer.selectAll('.midpoint').remove();
            touchLayer.selectAll('.midpoint.target').remove();
            return;
        }

        const poly = extent.polygon();
        const midpoints = {};

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];

            if (entity.type !== 'way') continue;
            if (!filter(entity)) continue;
            if (context.selectedIDs().indexOf(entity.id) < 0) continue;

            const nodes = graph.childNodes(entity);
            for (let j = 0; j < nodes.length - 1; j++) {
                const a = nodes[j];
                const b = nodes[j + 1];
                const id = [a.id, b.id].sort().join('-');

                if (midpoints[id]) {
                    midpoints[id].parents.push(entity);
                } else if (geoVecLength(projection(a.loc), projection(b.loc)) > 40) {
                    let point = geoVecInterp(a.loc, b.loc, 0.5);
                    let loc = null;

                    if (extent.intersects(point)) {
                        loc = point;
                    } else {
                        for (let k = 0; k < 4; k++) {
                            point = geoLineIntersection([a.loc, b.loc], [poly[k], poly[k + 1]]);
                            if (point &&
                                geoVecLength(projection(a.loc), projection(point)) > 20 &&
                                geoVecLength(projection(b.loc), projection(point)) > 20) {
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


        function midpointFilter(d) {
            if (midpoints[d.id]) return true;

            for (let i = 0; i < d.parents.length; i++) {
                if (filter(d.parents[i])) {
                    return true;
                }
            }

            return false;
        }


        let groups = drawLayer.selectAll('.midpoint')
            .filter(midpointFilter)
            .data(Object.values(midpoints), function(d) { return d.id; });

        groups.exit()
            .remove();

        const enter = groups.enter()
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
                const translate = svgPointTransform(projection);
                const a = graph.entity(d.edge[0]);
                const b = graph.entity(d.edge[1]);
                const angle = geoAngle(a, b, projection) * (180 / Math.PI);
                return translate(d) + ' rotate(' + angle + ')';
            })
            .call(svgTagClasses().tags(
                function(d) { return d.parents[0].tags; }
            ));

        // Propagate data bindings.
        groups.select('polygon.shadow');
        groups.select('polygon.fill');


        // Draw touch targets..
        touchLayer
            .call(drawTargets, graph, Object.values(midpoints), midpointFilter);
    }

    return drawMidpoints;
}
