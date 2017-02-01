import _ from 'lodash';
import {
    svgPointTransform,
    svgTagClasses
} from './index';

import {
    geoAngle,
    geoEuclideanDistance,
    geoInterp,
    geoLineIntersection
} from '../geo/index';
import { getLayoutSeq } from '../osm/lanes';
import { dataDriveLeft } from '../../data';
import { geoPointInPolygon } from '../geo';


export function svgLanes(projection, context) {

    return function drawMidpoints(selection, graph, entities, filter, extent, mapCenter) {
        // return ;
        var entity = getEntity();
        var showLanes = [];
        var metadata;
        var iconPosition;
        var driveLeft;
        var layoutSeq;
    
        if (entity) {
            metadata = entity.lanes().metadata;
            iconPosition = findPosition();
            driveLeft = isDriveLeft();
            layoutSeq = getLayoutSeq(metadata, driveLeft, 'turnLanes');
            layer = selection.selectAll('.layer-hit');
            showLanes = [0];
        }
        var layer = selection.selectAll('.layer-hit');

        var groups = layer
            .selectAll('g.midpoint')
            .data(showLanes);

        groups.exit()
            .remove();

        var enter = groups.enter()
            .insert('g', ':first-child')
            .attr('class', 'midpoint');

        enter.append('polygon')
            .attr('points', '-6,8 10,0 -6,-8')
            .attr('class', 'shadow');

        enter.append('polygon')
            .attr('points', '-3,4 5,0 -3,-4')
            .attr('class', 'fill');

        groups = groups
            .merge(enter)
            .attr('transform', function (d) {
                var translate = svgPointTransform(projection),
                    a = graph.entity(iconPosition.edge[0]),
                    b = graph.entity(iconPosition.edge[1]);
                var angleVal = Math.round(geoAngle(a, b, projection) * (180 / Math.PI));
                return  translate(iconPosition)+ ' rotate(' + angleVal + ')';
            })
            .call(svgTagClasses().tags(
                // TODO: what if entity is null
                function () { return entity && entity.tags; }
            ));

        // Propagate data bindings.
        groups.select('polygon.shadow');
        groups.select('polygon.fill');

        function isDriveLeft() {
            return _.some(dataDriveLeft.features, function (f) {
                return _.some(f.geometry.coordinates, function (d) {
                    return geoPointInPolygon(mapCenter, d);
                });
            });
        }

        function getEntity() {
            if (context.selectedIDs().length !== 1) return null;
            var entity = graph.entity(context.selectedIDs()[0]);

            if (entity.type !== 'way') return null;
            if (!filter(entity)) return null;
            if (!entity.tags.highway) return null;
            return entity;
        }

        function findPosition() {
            var loc;
            if (!entity) {
                return {
                    loc: undefined,
                    edge: []
                };
            }
            var nodes = graph.childNodes(entity);
            var poly = extent.polygon();
            
            for (var j = nodes.length - 1; j > 0; j--) {
                var a = nodes[j - 1];
                var b = nodes[j];
                if (geoEuclideanDistance(projection(a.loc), projection(b.loc)) > 40) {
                    var point = geoInterp(a.loc, b.loc, 0.75);
                    if (extent.intersects(point)) {
                        loc = point;
                    } else {
                        for (var k = 0; k < 4; k++) {
                            point = geoLineIntersection([a.loc, b.loc], [poly[k], poly[k + 1]]);
                            if (point &&
                                geoEuclideanDistance(projection(a.loc), projection(point)) > 20 &&
                                geoEuclideanDistance(projection(b.loc), projection(point)) > 20) {
                                loc = point;
                                break;
                            }
                        }
                    }
                    if (loc) {
                        return {
                            loc: loc,
                            edge: [a.id, b.id],
                        };
                    }
                }
            }
        }
    };

}
