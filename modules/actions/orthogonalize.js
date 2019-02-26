import _clone from 'lodash-es/clone';
import _uniq from 'lodash-es/uniq';

import { actionDeleteNode } from './delete_node';
import {
    geoVecAdd,
    geoVecInterp,
    geoVecLength,
    geoVecNormalize,
    geoVecNormalizedDot,
    geoVecScale,
    geoVecSubtract
} from '../geo';


/*
 * Based on https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/potlatch2/tools/Quadrilateralise.as
 */
export function actionOrthogonalize(wayID, projection) {
    var threshold = 12; // degrees within right or straight to alter
    var lowerThreshold = Math.cos((90 - threshold) * Math.PI / 180);
    var upperThreshold = Math.cos(threshold * Math.PI / 180);


    var action = function(graph, t) {
        if (t === null || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        var way = graph.entity(wayID);
        var nodes = graph.childNodes(way);
        var points = _uniq(nodes).map(function(n) { return projection(n.loc); });
        var corner = {i: 0, dotp: 1};
        var epsilon = 1e-4;
        var node, loc, score, motions, i, j;

        if (points.length === 3) {   // move only one vertex for right triangle
            for (i = 0; i < 1000; i++) {
                motions = points.map(calcMotion);
                points[corner.i] = geoVecAdd(points[corner.i], motions[corner.i]);
                score = corner.dotp;
                if (score < epsilon) {
                    break;
                }
            }

            node = graph.entity(nodes[corner.i].id);
            loc = projection.invert(points[corner.i]);
            graph = graph.replace(node.move(geoVecInterp(node.loc, loc, t)));

        } else {
            var best;
            var originalPoints = _clone(points);
            score = Infinity;

            for (i = 0; i < 1000; i++) {
                motions = points.map(calcMotion);
                for (j = 0; j < motions.length; j++) {
                    points[j] = geoVecAdd(points[j],motions[j]);
                }
                var newScore = squareness(points);
                if (newScore < score) {
                    best = _clone(points);
                    score = newScore;
                }
                if (score < epsilon) {
                    break;
                }
            }

            points = best;

            for (i = 0; i < points.length; i++) {
                // only move the points that actually moved
                if (originalPoints[i][0] !== points[i][0] || originalPoints[i][1] !== points[i][1]) {
                    loc = projection.invert(points[i]);
                    node = graph.entity(nodes[i].id);
                    graph = graph.replace(node.move(geoVecInterp(node.loc, loc, t)));
                }
            }

            // remove empty nodes on straight sections
            for (i = 0; t === 1 && i < points.length; i++) {
                node = graph.entity(nodes[i].id);

                if (graph.parentWays(node).length > 1 ||
                    graph.parentRelations(node).length ||
                    node.hasInterestingTags()) {
                    continue;
                }

                var dotp = normalizedDotProduct(i, points);
                if (dotp < -1 + epsilon) {
                    graph = actionDeleteNode(node.id)(graph);
                }
            }
        }

        return graph;


        function calcMotion(b, i, array) {
            var a = array[(i - 1 + array.length) % array.length];
            var c = array[(i + 1) % array.length];
            var p = geoVecSubtract(a, b);
            var q = geoVecSubtract(c, b);

            var scale = 2 * Math.min(geoVecLength(p), geoVecLength(q));
            p = geoVecNormalize(p);
            q = geoVecNormalize(q);

            var dotp = filterDotProduct(p[0] * q[0] + p[1] * q[1]);

            // nasty hack to deal with almost-straight segments (angle is closer to 180 than to 90/270).
            if (array.length > 3) {
                if (dotp < -0.707106781186547) {
                    dotp += 1.0;
                }
            } else if (dotp && Math.abs(dotp) < corner.dotp) {
                corner.i = i;
                corner.dotp = Math.abs(dotp);
            }

            var vec = geoVecNormalize(geoVecAdd(p, q));
            return geoVecScale(vec, 0.1 * dotp * scale);
        }
    };


    function squareness(points) {
        return points.reduce(function(sum, val, i, array) {
            var dotp = normalizedDotProduct(i, array);
            dotp = filterDotProduct(dotp);
            return sum + 2.0 * Math.min(Math.abs(dotp - 1.0), Math.min(Math.abs(dotp), Math.abs(dotp + 1)));
        }, 0);
    }


    function normalizedDotProduct(i, points) {
        var a = points[(i - 1 + points.length) % points.length];
        var origin = points[i];
        var b = points[(i + 1) % points.length];
        return geoVecNormalizedDot(a, b, origin);
    }


    function filterDotProduct(dotp) {
        if (lowerThreshold > Math.abs(dotp) || Math.abs(dotp) > upperThreshold) {
            return dotp;
        }
        return 0;
    }


    action.disabled = function(graph) {
        var way = graph.entity(wayID);
        var nodes = graph.childNodes(way);
        var points = _uniq(nodes).map(function(n) { return projection(n.loc); });

        if (squareness(points)) {
            return false;
        }

        return 'not_squarish';
    };


    action.transitionable = true;


    return action;
}
