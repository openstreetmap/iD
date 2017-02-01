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

    return function drawLanes(selection, graph, entities, filter, extent, mapCenter) {
        var entity = getEntity();
        var metadata;
        var driveLeft;
        var layoutSeq = [];
        var iconWidth = 40;

        // TODO: on removing map features svgLanes stays there
        if (entity) {
            metadata = entity.lanes().metadata;
            driveLeft = isDriveLeft();
            layoutSeq = getLayoutSeq(metadata, driveLeft, 'turnLanes');
        }

        var wrapperData = findPosition();

        // wrapper DATA BIND
        // `wrapperData` is an array set up how we want the DOM to look.
        // Always think about data first when working with D3!
        // The `data` bind matches DOM nodes to wrapperData array elements
        // Each DOM node bound to data will have a special __data__ property
        // you can see it in Chrome developer tools
        var wrapper = selection.selectAll('.layer-hit')
            .selectAll('.lanes-wrapper')
            .data(wrapperData ? [wrapperData] : []);

        // wrapper EXIT
        // exit selection includes existing DOM nodes with no match in wrapperData
        // if you don't remove them, they just stay around forever.
        wrapper.exit()
            .remove();

        // wrapper ENTER
        // enter selection includes wrapperData with no match to DOM nodes
        // the normal thing to do here is create the missing DOM nodes
        var enter = wrapper.enter()
            .insert('g', ':first-child')
            .attr('class', 'lanes-wrapper');

        enter
            .append('rect')
            .attr('class', 'lanes-background');

        // enter.append('polygon')
        //     .attr('points', '-3,4 5,0 -3,-4')
        //     .attr('class', 'fill');


        // wrapper UPDATE
        // update selection runs every time for all the matched DOM elements.
        // `merge` brings in the nodes that were just entered
        // Assignment is important here because selections are immutable,
        //  so we need to replace wrapper with the new wrapper before using it.
        wrapper = wrapper
            .merge(enter);

        wrapper
            .attr('transform', function (d) {
                var p = projection(d.loc),
                    a = graph.entity(d.edge[0]),
                    b = graph.entity(d.edge[1]),
                    ang = Math.round(geoAngle(a, b, projection) * (180 / Math.PI)) + 90;

                p[0] -= metadata.count * iconWidth / 2;
                return 'translate(' + p[0] + ',' + p[1] + ') rotate(' + ang + ')';
            });

        wrapper.selectAll('.lanes-background')
            .attr('width', function () { return metadata.count * iconWidth; })
            .attr('height', function () { return iconWidth; });



        // lanes DATA BIND
        var lanes = wrapper.selectAll('.lanes-lane')
            .data(layoutSeq);

        // lanes EXIT
        lanes.exit()
            .remove();

        // lanes ENTER
        enter = lanes.enter()
            .append('g')
            .attr('class', 'lanes-lane');

        enter
            .append('circle')
            .attr('class', 'lanes-circle')
            .attr('r', 15);

        enter
            .append('use')
            .attr('transform', 'translate(-10,-13)')
            .attr('width', '20')
            .attr('height', '20')
            .attr('xlink:href', function (d) {
                // return '#lane-' + createSVGLink(d);
                return '#icon-up';
            });

        // lanes UPDATE
        lanes = lanes
            .merge(enter);

        lanes
            .attr('transform', function (d, i) {
                var transform = 'translate(' + [iconWidth / 2 + i * iconWidth, (iconWidth / 2)] + ')';
                if (d.dir === 'backward') { transform += ' rotate(180)'; }
                return transform;
            });

        // Watch out!  `select` here not only selects the first .lanes-circle node,
        // but it also propagates __data__ from lanes down to that circle.  In this
        // situation, it's the behavior we want, so we can style the circle based on `d.dir`.
        // `select` propagates __data__ to children, `selectAll` does not.
        lanes.select('.lanes-circle')
            .style('fill', function (d) {
                switch (d.dir) {
                    case 'forward':
                        return '#dfffdf';
                    case 'backward':
                        return '#ffd8d8';
                    default:
                        return '#d8d8d8';
                }
            });



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
            if (!entity) return;

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


        // function createSVGLink(d) {
        //     var directions;
        //     console.log(d.dir);
        //     directions = metadata.turnLanes[d.dir][d.index];

        //     // TODO: fix this vv
        //     if (!directions) return '';
        //     var dir = directions.sort(function (a, b) {
        //         return a.charCodeAt(0) - b.charCodeAt(0);
        //     });
        //     dir = dir.join('-');
        //     if (dir.indexOf('unknown') > -1 || dir.length === 0) return 'unknown';

        //     return dir;
        // }
    };

}
