import { actionDeleteNode } from './delete_node';
import {
    geoVecAdd, geoVecEqual, geoVecInterp, geoVecLength, geoVecNormalize,
    geoVecProject, geoVecScale, geoVecSubtract,
    geoOrthoNormalizedDotProduct, geoOrthoCalcScore, geoOrthoCanOrthogonalize
} from '../geo';


export function actionOrthogonalize(wayID, projection, vertexID, degThresh, ep) {
    var epsilon = ep || 1e-4;
    var threshold = degThresh || 13;  // degrees within right or straight to alter

    // We test normalized dot products so we can compare as cos(angle)
    var lowerThreshold = Math.cos((90 - threshold) * Math.PI / 180);
    var upperThreshold = Math.cos(threshold * Math.PI / 180);


    var action = function(graph, t) {
        if (t === null || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        var way = graph.entity(wayID);
        way = way.removeNode('');   // sanity check - remove any consecutive duplicates

        if (way.tags.nonsquare) {
            var tags = Object.assign({}, way.tags);
            // since we're squaring, remove indication that this is physically unsquare
            delete tags.nonsquare;
            way = way.update({tags: tags});
        }

        graph = graph.replace(way);

        var isClosed = way.isClosed();
        var nodes = graph.childNodes(way).slice();  // shallow copy
        if (isClosed) nodes.pop();

        if (vertexID !== undefined) {
            nodes = nodeSubset(nodes, vertexID, isClosed);
            if (nodes.length !== 3) return graph;
        }

        // note: all geometry functions here use the unclosed node/point/coord list

        var nodeCount = {};
        var points = [];
        var corner = { i: 0, dotp: 1 };
        var node, point, loc, score, motions, i, j;

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            nodeCount[node.id] = (nodeCount[node.id] || 0) + 1;
            points.push({ id: node.id, coord: projection(node.loc) });
        }


        if (points.length === 3) {   // move only one vertex for right triangle
            for (i = 0; i < 1000; i++) {
                motions = points.map(calcMotion);

                points[corner.i].coord = geoVecAdd(points[corner.i].coord, motions[corner.i]);
                score = corner.dotp;
                if (score < epsilon) {
                    break;
                }
            }

            node = graph.entity(nodes[corner.i].id);
            loc = projection.invert(points[corner.i].coord);
            graph = graph.replace(node.move(geoVecInterp(node.loc, loc, t)));

        } else {
            var straights = [];
            var simplified = [];

            // Remove points from nearly straight sections..
            // This produces a simplified shape to orthogonalize
            for (i = 0; i < points.length; i++) {
                point = points[i];
                var dotp = 0;
                if (isClosed || (i > 0 && i < points.length - 1)) {
                    var a = points[(i - 1 + points.length) % points.length];
                    var b = points[(i + 1) % points.length];
                    dotp = Math.abs(geoOrthoNormalizedDotProduct(a.coord, b.coord, point.coord));
                }

                if (dotp > upperThreshold) {
                    straights.push(point);
                } else {
                    simplified.push(point);
                }
            }

            // Orthogonalize the simplified shape
            var bestPoints = clonePoints(simplified);
            var originalPoints = clonePoints(simplified);

            score = Infinity;
            for (i = 0; i < 1000; i++) {
                motions = simplified.map(calcMotion);

                for (j = 0; j < motions.length; j++) {
                    simplified[j].coord = geoVecAdd(simplified[j].coord, motions[j]);
                }
                var newScore = geoOrthoCalcScore(simplified, isClosed, epsilon, threshold);
                if (newScore < score) {
                    bestPoints = clonePoints(simplified);
                    score = newScore;
                }
                if (score < epsilon) {
                    break;
                }
            }

            var bestCoords = bestPoints.map(function(p) { return p.coord; });
            if (isClosed) bestCoords.push(bestCoords[0]);

            // move the nodes that should move
            for (i = 0; i < bestPoints.length; i++) {
                point = bestPoints[i];
                if (!geoVecEqual(originalPoints[i].coord, point.coord)) {
                    node = graph.entity(point.id);
                    loc = projection.invert(point.coord);
                    graph = graph.replace(node.move(geoVecInterp(node.loc, loc, t)));
                }
            }

            // move the nodes along straight segments
            for (i = 0; i < straights.length; i++) {
                point = straights[i];
                if (nodeCount[point.id] > 1) continue;   // skip self-intersections

                node = graph.entity(point.id);

                if (t === 1 &&
                    graph.parentWays(node).length === 1 &&
                    graph.parentRelations(node).length === 0 &&
                    !node.hasInterestingTags()
                ) {
                    // remove uninteresting points..
                    graph = actionDeleteNode(node.id)(graph);

                } else {
                    // move interesting points to the nearest edge..
                    var choice = geoVecProject(point.coord, bestCoords);
                    if (choice) {
                        loc = projection.invert(choice.target);
                        graph = graph.replace(node.move(geoVecInterp(node.loc, loc, t)));
                    }
                }
            }
        }

        return graph;


        function clonePoints(array) {
            return array.map(function(p) {
                return { id: p.id, coord: [p.coord[0], p.coord[1]] };
            });
        }


        function calcMotion(point, i, array) {
            // don't try to move the endpoints of a non-closed way.
            if (!isClosed && (i === 0 || i === array.length - 1)) return [0, 0];
            // don't try to move a node that appears more than once (self intersection)
            if (nodeCount[array[i].id] > 1) return [0, 0];

            var a = array[(i - 1 + array.length) % array.length].coord;
            var origin = point.coord;
            var b = array[(i + 1) % array.length].coord;
            var p = geoVecSubtract(a, origin);
            var q = geoVecSubtract(b, origin);

            var scale = 2 * Math.min(geoVecLength(p), geoVecLength(q));
            p = geoVecNormalize(p);
            q = geoVecNormalize(q);

            var dotp = (p[0] * q[0] + p[1] * q[1]);
            var val = Math.abs(dotp);

            if (val < lowerThreshold) {  // nearly orthogonal
                corner.i = i;
                corner.dotp = val;
                var vec = geoVecNormalize(geoVecAdd(p, q));
                return geoVecScale(vec, 0.1 * dotp * scale);
            }

            return [0, 0];   // do nothing
        }
    };


    // if we are only orthogonalizing one vertex,
    // get that vertex and the previous and next
    function nodeSubset(nodes, vertexID, isClosed) {
        var first = isClosed ? 0 : 1;
        var last = isClosed ? nodes.length : nodes.length - 1;

        for (var i = first; i < last; i++) {
            if (nodes[i].id === vertexID) {
                return [
                    nodes[(i - 1 + nodes.length) % nodes.length],
                    nodes[i],
                    nodes[(i + 1) % nodes.length]
                ];
            }
        }

        return [];
    }


    action.disabled = function(graph) {
        var way = graph.entity(wayID);
        way = way.removeNode('');  // sanity check - remove any consecutive duplicates
        graph = graph.replace(way);

        var isClosed = way.isClosed();
        var nodes = graph.childNodes(way).slice();  // shallow copy
        if (isClosed) nodes.pop();

        var allowStraightAngles = false;
        if (vertexID !== undefined) {
            allowStraightAngles = true;
            nodes = nodeSubset(nodes, vertexID, isClosed);
            if (nodes.length !== 3) return 'end_vertex';
        }

        var coords = nodes.map(function(n) { return projection(n.loc); });
        var score = geoOrthoCanOrthogonalize(coords, isClosed, epsilon, threshold, allowStraightAngles);

        if (score === null) {
            return 'not_squarish';
        } else if (score === 0) {
            return 'square_enough';
        } else {
            return false;
        }
    };


    action.transitionable = true;

    return action;
}
