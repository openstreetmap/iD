import * as d3 from 'd3';
import { euclideanDistance, interp } from '../geo/index';
import { Node } from '../core/index';
import _ from 'lodash';

export function Circularize(wayId
  , projection, maxAngle) {
    maxAngle = (maxAngle || 20) * Math.PI / 180;

    var action = function(graph) {
        var way = graph.entity(wayId);

        if (!way.isConvex(graph)) {
            graph = action.makeConvex(graph);
        }

        var nodes = _.uniq(graph.childNodes(way)),
            keyNodes = nodes.filter(function(n) { return graph.parentWays(n).length !== 1; }),
            points = nodes.map(function(n) { return projection(n.loc); }),
            keyPoints = keyNodes.map(function(n) { return projection(n.loc); }),
            centroid = (points.length === 2) ? interp(points[0], points[1], 0.5) : d3.geoCentroid({ type: 'Polygon', coordinates: points }),
            radius = d3.median(points, function(p) { return euclideanDistance(centroid, p); }),
            sign = d3.polygonArea(points) > 0 ? 1 : -1,
            ids;

        // we need atleast two key nodes for the algorithm to work
        if (!keyNodes.length) {
            keyNodes = [nodes[0]];
            keyPoints = [points[0]];
        }

        if (keyNodes.length === 1) {
            var index = nodes.indexOf(keyNodes[0]),
                oppositeIndex = Math.floor((index + nodes.length / 2) % nodes.length);

            keyNodes.push(nodes[oppositeIndex]);
            keyPoints.push(points[oppositeIndex]);
        }

        // key points and nodes are those connected to the ways,
        // they are projected onto the circle, inbetween nodes are moved
        // to constant intervals between key nodes, extra inbetween nodes are
        // added if necessary.
        for (var i = 0; i < keyPoints.length; i++) {
            var nextKeyNodeIndex = (i + 1) % keyNodes.length,
                startNode = keyNodes[i],
                endNode = keyNodes[nextKeyNodeIndex],
                startNodeIndex = nodes.indexOf(startNode),
                endNodeIndex = nodes.indexOf(endNode),
                numberNewPoints = -1,
                indexRange = endNodeIndex - startNodeIndex,
                distance, totalAngle, eachAngle, startAngle, endAngle,
                angle, loc, node, j,
                inBetweenNodes = [];

            if (indexRange < 0) {
                indexRange += nodes.length;
            }

            // position this key node
            distance = euclideanDistance(centroid, keyPoints[i]);
            if (distance === 0) { distance = 1e-4; }
            keyPoints[i] = [
                centroid[0] + (keyPoints[i][0] - centroid[0]) / distance * radius,
                centroid[1] + (keyPoints[i][1] - centroid[1]) / distance * radius];
            graph = graph.replace(keyNodes[i].move(projection.invert(keyPoints[i])));

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

            // move existing points
            for (j = 1; j < indexRange; j++) {
                angle = startAngle + j * eachAngle;
                loc = projection.invert([
                    centroid[0] + Math.cos(angle)*radius,
                    centroid[1] + Math.sin(angle)*radius]);

                node = nodes[(j + startNodeIndex) % nodes.length].move(loc);
                graph = graph.replace(node);
            }

            // add new inbetween nodes if necessary
            for (j = 0; j < numberNewPoints; j++) {
                angle = startAngle + (indexRange + j) * eachAngle;
                loc = projection.invert([
                    centroid[0] + Math.cos(angle) * radius,
                    centroid[1] + Math.sin(angle) * radius]);

                node = Node({loc: loc});
                graph = graph.replace(node);

                nodes.splice(endNodeIndex + j, 0, node);
                inBetweenNodes.push(node.id);
            }

            // Check for other ways that share these keyNodes..
            // If keyNodes are adjacent in both ways,
            // we can add inBetween nodes to that shared way too..
            if (indexRange === 1 && inBetweenNodes.length) {
                var startIndex1 = way.nodes.lastIndexOf(startNode.id),
                    endIndex1 = way.nodes.lastIndexOf(endNode.id),
                    wayDirection1 = (endIndex1 - startIndex1);
                if (wayDirection1 < -1) { wayDirection1 = 1; }

                /* eslint-disable no-loop-func */
                _.each(_.without(graph.parentWays(keyNodes[i]), way), function(sharedWay) {
                    if (sharedWay.areAdjacent(startNode.id, endNode.id)) {
                        var startIndex2 = sharedWay.nodes.lastIndexOf(startNode.id),
                            endIndex2 = sharedWay.nodes.lastIndexOf(endNode.id),
                            wayDirection2 = (endIndex2 - startIndex2),
                            insertAt = endIndex2;
                        if (wayDirection2 < -1) { wayDirection2 = 1; }

                        if (wayDirection1 !== wayDirection2) {
                            inBetweenNodes.reverse();
                            insertAt = startIndex2;
                        }
                        for (j = 0; j < inBetweenNodes.length; j++) {
                            sharedWay = sharedWay.addNode(inBetweenNodes[j], insertAt + j);
                        }
                        graph = graph.replace(sharedWay);
                    }
                });
                /* eslint-enable no-loop-func */
            }

        }

        // update the way to have all the new nodes
        ids = nodes.map(function(n) { return n.id; });
        ids.push(ids[0]);

        way = way.update({nodes: ids});
        graph = graph.replace(way);

        return graph;
    };

    action.makeConvex = function(graph) {
        var way = graph.entity(wayId),
            nodes = _.uniq(graph.childNodes(way)),
            points = nodes.map(function(n) { return projection(n.loc); }),
            sign = d3.polygonArea(points) > 0 ? 1 : -1,
            hull = d3.polygonHull(points);

        // D3 convex hulls go counterclockwise..
        if (sign === -1) {
            nodes.reverse();
            points.reverse();
        }

        for (var i = 0; i < hull.length - 1; i++) {
            var startIndex = points.indexOf(hull[i]),
                endIndex = points.indexOf(hull[i+1]),
                indexRange = (endIndex - startIndex);

            if (indexRange < 0) {
                indexRange += nodes.length;
            }

            // move interior nodes to the surface of the convex hull..
            for (var j = 1; j < indexRange; j++) {
                var point = interp(hull[i], hull[i+1], j / indexRange),
                    node = nodes[(j + startIndex) % nodes.length].move(projection.invert(point));
                graph = graph.replace(node);
            }
        }
        return graph;
    };

    action.disabled = function(graph) {
        if (!graph.entity(wayId).isClosed())
            return 'not_closed';
    };

    return action;
}
