import { median as d3_median } from 'd3-array';
import { geoLength } from 'd3-geo';
import {
    polygonArea as d3_polygonArea,
    polygonHull as d3_polygonHull,
    polygonCentroid as d3_polygonCentroid
} from 'd3-polygon';

import { geoVecInterp, geoVecLength } from '../geo';
import { osmNode } from '../osm/node';
import { utilArrayUniq } from '../util';
import { radiansToMeters } from '../ui/panels';
import type { Projection } from '../geo/raw_mercator';
import type { Action } from '../core/history';
import type { NodeId, WayId } from '../osm';
import type { coreGraph } from '../core';
import type { Vec2 } from '../geo/vector';


const MAX_SEGMENT_LENGTH = 4;
export const MIN_VERTICES = 12;
export const MAX_VERTICES = 32;

export function actionCircularize(wayId: WayId, projection: Projection) {

    const action: Action = function(graph, t) {
        if (t === null || t === undefined || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        const way = graph.entity(wayId);
        const origNodes: Record<string, osmNode> = {};

        for (const node of graph.childNodes(way)) {
            if (!origNodes[node.id]) {
                origNodes[node.id] = node;
            }
        }

        if (!way.isConvex(graph)) {
            graph = makeConvex(graph);
        }

        const nodes = utilArrayUniq(graph.childNodes(way));
        const keyNodes = nodes.filter(n => graph.parentWays(n).length > 1 || n.hasInterestingTags() );
        const points = nodes.map(n => projection(n.loc));
        const keyPoints = keyNodes.map(n => projection(n.loc));
        const centroid = (points.length === 2)
            ? geoVecInterp(points[0], points[1], 0.5)
            : d3_polygonCentroid(points);
        const radius = d3_median(points, p => geoVecLength(centroid, p))!;
        const maxAngle = getMaxAngle(centroid, radius);
        const sign = d3_polygonArea(points) > 0 ? 1 : -1;
        let ids, i, j, k;

        // we need at least two key nodes for the algorithm to work
        if (!keyNodes.length) {
            keyNodes.push(nodes[0]);
            keyPoints.push(points[0]);
        }

        if (keyNodes.length === 1) {
            var index = nodes.indexOf(keyNodes[0]);
            var oppositeIndex = Math.floor((index + nodes.length / 2) % nodes.length);

            keyNodes.push(nodes[oppositeIndex]);
            keyPoints.push(points[oppositeIndex]);
        }

        // key points and nodes are those connected to the ways,
        // they are projected onto the circle, in between nodes are moved
        // to constant intervals between key nodes, extra in between nodes are
        // added if necessary.
        for (i = 0; i < keyPoints.length; i++) {
            var nextKeyNodeIndex = (i + 1) % keyNodes.length;
            var startNode = keyNodes[i];
            var endNode = keyNodes[nextKeyNodeIndex];
            var startNodeIndex = nodes.indexOf(startNode);
            var endNodeIndex = nodes.indexOf(endNode);
            var numberNewPoints = -1;
            var indexRange = endNodeIndex - startNodeIndex;
            var nearNodes: Record<string, number> = {};
            var inBetweenNodes: NodeId[] = [];
            var startAngle, endAngle, totalAngle, eachAngle;
            var angle, loc, node, origNode;

            if (indexRange < 0) {
                indexRange += nodes.length;
            }

            // position this key node
            var distance = geoVecLength(centroid, keyPoints[i]) || 1e-4;
            keyPoints[i] = [
                centroid[0] + (keyPoints[i][0] - centroid[0]) / distance * radius,
                centroid[1] + (keyPoints[i][1] - centroid[1]) / distance * radius
            ];
            loc = projection.invert(keyPoints[i]);
            node = keyNodes[i];
            origNode = origNodes[node.id];
            node = node.move(geoVecInterp(origNode.loc, loc, t));
            graph = graph.replace(node);

            // figure out the between delta angle we want to match to
            startAngle = Math.atan2(keyPoints[i][1] - centroid[1], keyPoints[i][0] - centroid[0]);
            endAngle = Math.atan2(keyPoints[nextKeyNodeIndex][1] - centroid[1], keyPoints[nextKeyNodeIndex][0] - centroid[0]);
            totalAngle = endAngle - startAngle;

            // detects looping around -pi/pi
            if (totalAngle * sign > 0) {
                totalAngle = -sign * (2 * Math.PI - Math.abs(totalAngle));
            }

            do {
                numberNewPoints++;
                eachAngle = totalAngle / (indexRange + numberNewPoints);
            } while (Math.abs(eachAngle) > maxAngle);


            // move existing nodes
            for (j = 1; j < indexRange; j++) {
                angle = startAngle + j * eachAngle;
                loc = projection.invert([
                    centroid[0] + Math.cos(angle) * radius,
                    centroid[1] + Math.sin(angle) * radius
                ]);

                node = nodes[(j + startNodeIndex) % nodes.length];
                origNode = origNodes[node.id];
                nearNodes[node.id] = angle;

                node = node.move(geoVecInterp(origNode.loc, loc, t));
                graph = graph.replace(node);
            }

            // add new in between nodes if necessary
            for (j = 0; j < numberNewPoints; j++) {
                angle = startAngle + (indexRange + j) * eachAngle;
                loc = projection.invert([
                    centroid[0] + Math.cos(angle) * radius,
                    centroid[1] + Math.sin(angle) * radius
                ]);

                // choose a nearnode to use as the original
                var min = Infinity;
                for (var nodeId in nearNodes) {
                    var nearAngle = nearNodes[nodeId];
                    var dist = Math.abs(nearAngle - angle);
                    if (dist < min) {
                        min = dist;
                        origNode = origNodes[nodeId];
                    }
                }

                node = new osmNode({ loc: geoVecInterp(origNode.loc, loc, t) });
                graph = graph.replace(node);

                nodes.splice(endNodeIndex + j, 0, node);
                inBetweenNodes.push(node.id);
            }

            // Check for other ways that share these keyNodes..
            // If keyNodes are adjacent in both ways,
            // we can add inBetweenNodes to that shared way too..
            if (indexRange === 1 && inBetweenNodes.length) {
                var startIndex1 = way.nodes.lastIndexOf(startNode.id);
                var endIndex1 = way.nodes.lastIndexOf(endNode.id);
                var wayDirection1 = (endIndex1 - startIndex1);
                if (wayDirection1 < -1) { wayDirection1 = 1; }

                var parentWays = graph.parentWays(keyNodes[i]);
                for (j = 0; j < parentWays.length; j++) {
                    var sharedWay = parentWays[j];
                    if (sharedWay === way) continue;

                    if (sharedWay.areAdjacent(startNode.id, endNode.id)) {
                        var startIndex2 = sharedWay.nodes.lastIndexOf(startNode.id);
                        var endIndex2 = sharedWay.nodes.lastIndexOf(endNode.id);
                        var wayDirection2 = (endIndex2 - startIndex2);
                        var insertAt = endIndex2;
                        if (wayDirection2 < -1) { wayDirection2 = 1; }

                        if (wayDirection1 !== wayDirection2) {
                            inBetweenNodes.reverse();
                            insertAt = startIndex2;
                        }
                        for (k = 0; k < inBetweenNodes.length; k++) {
                            sharedWay = sharedWay.addNode(inBetweenNodes[k], insertAt + k);
                        }
                        graph = graph.replace(sharedWay);
                    }
                }
            }

        }

        // update the way to have all the new nodes
        ids = nodes.map(function(n) { return n.id; });
        ids.push(ids[0]);

        graph = graph.replace(
            way.update({nodes: ids})
        );

        return graph;
    };


    /**
     * Returns the maximum internal angle of a regular polygon with
     * the given centroid and radius such that the length of the segments
     * are just shorter than approximately MAX_SEGMENT_LENGTH. But
     * never returns fewer than MIN_VERTICES or more than MAX_VERTICES.
     * #12139
     */
    function getMaxAngle(centroid: Vec2, radius: number) {
        const radiusM = radiansToMeters(geoLength({ type: 'LineString', coordinates: [
            projection.invert(centroid),
            projection.invert([centroid[0] + radius, centroid[1]])
        ]}));
        const numberOfPoints = Math.min(MAX_VERTICES, Math.max(MIN_VERTICES,
            Math.round(radiusM * Math.PI / MAX_SEGMENT_LENGTH) * 2
        ));
        return Math.PI * 2 / (numberOfPoints - 1);
    }


    function makeConvex(graph: coreGraph) {
        var way = graph.entity(wayId);
        var nodes = utilArrayUniq(graph.childNodes(way));
        var points = nodes.map(function(n) { return projection(n.loc); });
        var sign = d3_polygonArea(points) > 0 ? 1 : -1;
        var hull = d3_polygonHull(points)!;
        var i, j;

        // D3 convex hulls go counterclockwise..
        if (sign === -1) {
            nodes.reverse();
            points.reverse();
        }

        for (i = 0; i < hull.length - 1; i++) {
            var startIndex = points.indexOf(hull[i]);
            var endIndex = points.indexOf(hull[i+1]);
            var indexRange = (endIndex - startIndex);

            if (indexRange < 0) {
                indexRange += nodes.length;
            }

            // move interior nodes to the surface of the convex hull..
            for (j = 1; j < indexRange; j++) {
                var point = geoVecInterp(hull[i], hull[i+1], j / indexRange);
                var node = nodes[(j + startIndex) % nodes.length].move(projection.invert(point));
                graph = graph.replace(node);
            }
        }
        return graph;
    };


    action.disabled = function(graph) {
        if (!graph.entity(wayId).isClosed()) {
            return 'not_closed';
        }

        //disable when already circular
        var way = graph.entity(wayId);
        var nodes = utilArrayUniq(graph.childNodes(way));
        var points = nodes.map(function(n) { return projection(n.loc); });
        var hull = d3_polygonHull(points)!;
        var epsilonAngle =  Math.PI / 180;
        if (hull.length !== points.length || hull.length < 3){
            return false;
        }
        const centroid = d3_polygonCentroid(points);
        const radius = d3_median(points, p => geoVecLength(centroid, p))!;
        const maxAngle = getMaxAngle(centroid, radius);

        var i, actualPoint;

        // compare distances between centroid and points
        for (i = 0; i < hull.length; i++){
            actualPoint = hull[i];
            var actualDist = geoVecLength(actualPoint, centroid);
            var diff = Math.abs(actualDist - radius);
            //compare distances with epsilon-error (5%)
            if (diff > 0.05 * radius) {
                return false;
            }
        }

        //check if central angles are smaller than maxAngle
        for (i = 0; i < hull.length; i++){
            actualPoint = hull[i];
            var nextPoint = hull[(i+1)%hull.length];
            var startAngle = Math.atan2(actualPoint[1] - centroid[1], actualPoint[0] - centroid[0]);
            var endAngle = Math.atan2(nextPoint[1] - centroid[1], nextPoint[0] - centroid[0]);
            var angle = endAngle - startAngle;
            if (angle < 0) {
                angle = -angle;
            }
            if (angle > Math.PI){
                angle = (2*Math.PI - angle);
            }

            if (angle > maxAngle + epsilonAngle) {
                return false;
            }
        }
        return 'already_circular';
    };


    action.getWayId = function() {
        return wayId;
    };


    action.id = 'circularize';


    action.transitionable = true;


    return action;
}
