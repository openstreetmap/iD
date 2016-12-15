import _ from 'lodash';
import {
    polygonHull as d3polygonHull,
    polygonCentroid as d3polygonCentroid
} from 'd3';

import { geoExtent } from '../geo/extent';


/* Flip the provided way horizontally. Only operates on "area" ways */
export function actionReflect(wayId, projection) {

    function rotatePolygon(polygon, angle, centroid) {
        return polygon.map(function(point) {
            var radial = [point[0] - centroid[0], point[1] - centroid[1]];
            return [
                radial[0] * Math.cos(angle) - radial[1] * Math.sin(angle) + centroid[0],
                radial[0] * Math.sin(angle) + radial[1] * Math.cos(angle) + centroid[1]
            ];
        });
    }

    // http://gis.stackexchange.com/questions/22895/finding-minimum-area-rectangle-for-given-points
    // http://gis.stackexchange.com/questions/3739/generalisation-strategies-for-building-outlines/3756#3756
    function getSmallestSurroundingRectangle(graph, way) {
        var nodes = _.uniq(graph.childNodes(way)),
            points = nodes.map(function(n) { return projection(n.loc); }),
            hull = d3polygonHull(points),
            centroid = d3polygonCentroid(hull),
            minArea = Infinity,
            ssrExtent = [],
            ssrAngle = 0,
            c1 = hull[0];

        for (var i = 0; i < hull.length - 1; i++) {
            var c2 = hull[i + 1],
                angle = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]),
                poly = rotatePolygon(hull, -angle, centroid),
                extent = poly.reduce(function(extent, point) {
                        return extent.extend(geoExtent(point));
                    }, geoExtent()),
                area = extent.area();

            if (area < minArea) {
                minArea = area;
                ssrExtent = extent;
                ssrAngle = angle;
            }
            c1 = c2;
        }

        return {
            poly: rotatePolygon(ssrExtent.polygon(), ssrAngle, centroid),
            angle: ssrAngle
        };
    }


    return function (graph) {
        var targetWay = graph.entity(wayId);
        if (!targetWay.isArea()) {
            return graph;
        }


        var ssr = getSmallestSurroundingRectangle(graph, targetWay);
        var nodes = targetWay.nodes,
            p, q;

        // choose line pq = axis of symmetry
        var angle = ssr.angle * (180 / Math.PI);
        if (angle < 0) angle += 180;
        var isVertical = (angle > 60 && angle < 120);

console.log('angle=' + angle + ', isVertical = ' + isVertical);
        if (isVertical) {
            p = [
                (ssr.poly[0][0] + ssr.poly[1][0]) / 2,
                (ssr.poly[0][1] + ssr.poly[1][1]) / 2
            ];
            q = [
                (ssr.poly[2][0] + ssr.poly[3][0]) / 2,
                (ssr.poly[2][1] + ssr.poly[3][1]) / 2
            ];
        } else {
            p = [
                (ssr.poly[3][0] + ssr.poly[4][0]) / 2,
                (ssr.poly[3][1] + ssr.poly[4][1]) / 2
            ];
            q = [
                (ssr.poly[1][0] + ssr.poly[2][0]) / 2,
                (ssr.poly[1][1] + ssr.poly[2][1]) / 2
            ];
        }

        // reflect c across pq
        // http://math.stackexchange.com/questions/65503/point-reflection-over-a-line
        var dx = q[0] - p[0];
        var dy = q[1] - p[1];
        var a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
        var b = 2 * dx * dy / (dx * dx + dy * dy);
        for (var i = 0; i < nodes.length - 1; i++) {
            var node = graph.entity(nodes[i]);
            var c = projection(node.loc);
            var c2 = [
                a * (c[0] - p[0]) + b * (c[1] - p[1]) + p[0],
                b * (c[0] - p[0]) - a * (c[1] - p[1]) + p[1]
            ];
            node = node.move(projection.invert(c2));
            graph = graph.replace(node);
        }

        return graph;

    };
}
