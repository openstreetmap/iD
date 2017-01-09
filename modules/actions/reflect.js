import {
    polygonHull as d3polygonHull,
    polygonCentroid as d3polygonCentroid
} from 'd3';

import {
    geoEuclideanDistance,
    geoExtent,
    geoInterp,
    geoRotate
} from '../geo';

import { utilGetAllNodes } from '../util';


/* Reflect the given area around its axis of symmetry */
export function actionReflect(reflectIds, projection) {
    var useLongAxis = true;


    // http://gis.stackexchange.com/questions/22895/finding-minimum-area-rectangle-for-given-points
    // http://gis.stackexchange.com/questions/3739/generalisation-strategies-for-building-outlines/3756#3756
    function getSmallestSurroundingRectangle(graph, nodes) {
        var points = nodes.map(function(n) { return projection(n.loc); }),
            hull = d3polygonHull(points),
            centroid = d3polygonCentroid(hull),
            minArea = Infinity,
            ssrExtent = [],
            ssrAngle = 0,
            c1 = hull[0];

        for (var i = 0; i < hull.length - 1; i++) {
            var c2 = hull[i + 1],
                angle = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]),
                poly = geoRotate(hull, -angle, centroid),
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
            poly: geoRotate(ssrExtent.polygon(), ssrAngle, centroid),
            angle: ssrAngle
        };
    }


    var action = function(graph, t) {
        if (t === null || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        var nodes = utilGetAllNodes(reflectIds, graph),
            ssr = getSmallestSurroundingRectangle(graph, nodes);

        // Choose line pq = axis of symmetry.
        // The shape's surrounding rectangle has 2 axes of symmetry.
        // Reflect across the longer axis by default.
        var p1 = [(ssr.poly[0][0] + ssr.poly[1][0]) / 2, (ssr.poly[0][1] + ssr.poly[1][1]) / 2 ],
            q1 = [(ssr.poly[2][0] + ssr.poly[3][0]) / 2, (ssr.poly[2][1] + ssr.poly[3][1]) / 2 ],
            p2 = [(ssr.poly[3][0] + ssr.poly[4][0]) / 2, (ssr.poly[3][1] + ssr.poly[4][1]) / 2 ],
            q2 = [(ssr.poly[1][0] + ssr.poly[2][0]) / 2, (ssr.poly[1][1] + ssr.poly[2][1]) / 2 ],
            p, q;

        var isLong = (geoEuclideanDistance(p1, q1) > geoEuclideanDistance(p2, q2));
        if ((useLongAxis && isLong) || (!useLongAxis && !isLong)) {
            p = p1;
            q = q1;
        } else {
            p = p2;
            q = q2;
        }

        // reflect c across pq
        // http://math.stackexchange.com/questions/65503/point-reflection-over-a-line
        var dx = q[0] - p[0];
        var dy = q[1] - p[1];
        var a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
        var b = 2 * dx * dy / (dx * dx + dy * dy);
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var c = projection(node.loc);
            var c2 = [
                a * (c[0] - p[0]) + b * (c[1] - p[1]) + p[0],
                b * (c[0] - p[0]) - a * (c[1] - p[1]) + p[1]
            ];
            var loc2 = projection.invert(c2);
            node = node.move(geoInterp(node.loc, loc2, t));
            graph = graph.replace(node);
        }

        return graph;
    };


    action.useLongAxis = function(_) {
        if (!arguments.length) return useLongAxis;
        useLongAxis = _;
        return action;
    };


    action.transitionable = true;


    return action;
}
