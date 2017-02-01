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
        // return;
        var entity = getEntity();
        var showLanes = [];
        var metadata;
        var iconPosition;
        var driveLeft;
        var layoutSeq = [];
        const iconWidth = 40;
        // TODO: on removing map features svgLanes stays there
        if (entity) {
            metadata = entity.lanes().metadata;
            iconPosition = findPosition();
            driveLeft = isDriveLeft();
            layoutSeq = getLayoutSeq(metadata, driveLeft, 'turnLanes');
            layer = selection.selectAll('.layer-hit');
            if (iconPosition) {
                showLanes = [0];
            }
        }
        var layer = selection.selectAll('.layer-hit');

        var groups = layer
            .selectAll('g.lanes-visual')
            .data(showLanes);

        groups.exit()
            .remove();

        var enter = groups.enter()
            .insert('g', ':first-child')
            .attr('class', 'lanes-visual');

        var wrapper = enter
            .append('g')
            .attr('class', 'lanes-visual-wrapper');

        wrapper.append('rect')
            .attr('class', 'lane-visual-background');

        wrapper.append('g')
            .attr('class', 'lane-visual-items');

        layer
            .selectAll('.lanes-visual-wrapper')
            .attr('transform', function () {
                return 'translate(' + metadata.count * iconWidth / (-2) + ', 0)';
            });

        selection.selectAll('rect')
            .attr('width', function () {
                return metadata.count * iconWidth;
            })
            .attr('height', function () {
                return iconWidth;
            });

        var button = groups.selectAll('lane-visual-items')
            .data(layoutSeq)
            .enter()
            .append('g')
            .attr('class', 'lane-visual-items radial-menu-item radial-menu-item-move')
            .attr('transform', function (d, i) {
                var reverse = 0;
                if (d.dir === 'backward') {
                    reverse = 180;
                }
                return 'translate(' + [iconWidth / 2 + i * iconWidth, (iconWidth / 2)] + ') rotate(' + reverse + ')';
            });

        button
            .append('circle')
            .style('fill', function (d) {
                switch (d.dir) {
                    case 'forward':
                        return '#dfffdf';
                    case 'backward':
                        return '#ffd8d8';
                    default:
                        return '';
                }
            })
            .attr('r', 15);

        button
            .append('use')
            .attr('transform', 'translate(-15,-12)')
            .attr('width', '20')
            .attr('height', '20')
            .attr('xlink:href', function (d) {
                console.log(d);
                return '#lane-' + createSVGLink(d);
            });

        enter.append('polygon')
            .attr('points', '-3,4 5,0 -3,-4')
            .attr('class', 'fill');

        groups = groups
            .merge(enter)
            .attr('transform', function (d) {
                var translate = svgPointTransform(projection),
                    a = graph.entity(iconPosition.edge[0]),
                    b = graph.entity(iconPosition.edge[1]);
                var angleVal = Math.round(geoAngle(a, b, projection) * (180 / Math.PI)) + 90;
                return translate(iconPosition) + ' rotate(' + angleVal + ')';
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
        function createSVGLink(d) {
            var directions;
            console.log(d.dir);
            directions = metadata.turnLanes[d.dir][d.index];

            // TODO: fix this vv
            if (!directions) return '';
            var dir = directions.sort(function (a, b) {
                return a.charCodeAt(0) - b.charCodeAt(0);
            });
            dir = dir.join('-');
            if (dir.indexOf('unknown') > -1 || dir.length === 0) return 'unknown';

            return dir;
        }
    };

}
