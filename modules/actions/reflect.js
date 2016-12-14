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


// lol hacky debug
        var ssr = getSmallestSurroundingRectangle(graph, targetWay);
        var nodes = targetWay.nodes;
        for (var d = 0; d < nodes.length - 1; d++) {
            var node = graph.entity(nodes[d]);
            if (d < 4) {
                node = node.move(projection.invert(ssr.poly[d]));
                graph = graph.replace(node);
            } else {
                graph = graph.remove(node);
            }
        }
        graph = graph.replace(targetWay.update(
            { nodes: [nodes[0], nodes[1], nodes[2], nodes[3], nodes[0]] })
        );

        return graph;
// end debug

        // Get the bounding rectangle of the area
        var boundingRect = targetWay.extent(graph).rectangle();
        // rectangle returned as [ lon (x) top left, lat (y) top left, lon (x) bottom right, lat (y) bottom right]
        // Obtain the left and right lonlat's
        var left = boundingRect[0];
        var right = boundingRect[2];
        // Determine the mid-point that we will flip on
        var midPoint = left + ((right - left) / 2);

        // Obtain all of the nodes on the way, iterate over them to translate then aggreate up
        return _(targetWay.nodes)
            .map(function (nodeId) {
                return graph.entity(nodeId);
            })
            // Only process each node once, as the first node will be listed twice in the way
            .uniqBy(function (node) { return node.id; })
            // Get distance from midPoint and produce a translated node
            .map(function (node) {
                var delta = node.loc[0] - midPoint;
                return node.move([node.loc[0]-(2*delta), node.loc[1]]);
            })
            // Chain together consecutive updates to the graph for each updated node and return
            .reduce(function (accGraph, value) {
                return accGraph.replace(value);
            }, graph);

    };
}
