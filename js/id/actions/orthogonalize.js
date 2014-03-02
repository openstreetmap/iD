/*
 * Based on https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/potlatch2/tools/Quadrilateralise.as
 */

iD.actions.Orthogonalize = function(wayId, projection) {
    var threshold = 12, // degrees within right or straight to alter
        lowerThreshold = Math.cos((90 - threshold) * Math.PI / 180),
        upperThreshold = Math.cos(threshold * Math.PI / 180);

    var action = function(graph) {
        var way = graph.entity(wayId),
            nodes = graph.childNodes(way),
            points = _.uniq(nodes).map(function(n) { return projection(n.loc); }),
            corner = {i: 0, dotp: 1},
            epsilon = 1e-4,
            i, j, score, motions;

        if (nodes.length === 4) {
            for (i = 0; i < 1000; i++) {
                motions = points.map(calcMotion);
                points[corner.i] = addPoints(points[corner.i],motions[corner.i]);
                score = corner.dotp;
                if (score < epsilon) {
                    break;
                }
            }

            graph = graph.replace(graph.entity(nodes[corner.i].id)
                .move(projection.invert(points[corner.i])));
        } else {
            var best,
                originalPoints = _.clone(points);
            score = Infinity;

            for (i = 0; i < 1000; i++) {
                motions = points.map(calcMotion);
                for (j = 0; j < motions.length; j++) {
                    points[j] = addPoints(points[j],motions[j]);
                }
                var newScore = squareness(points);
                if (newScore < score) {
                    best = _.clone(points);
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
                    graph = graph.replace(graph.entity(nodes[i].id)
                        .move(projection.invert(points[i])));
                }
            }

            // remove empty nodes on straight sections
            for (i = 0; i < points.length; i++) {
                var node = nodes[i];

                if (graph.parentWays(node).length > 1 ||
                    graph.parentRelations(node).length ||
                    node.hasInterestingTags()) {

                    continue;
                }

                var dotp = normalizedDotProduct(i, points);
                if (dotp < -1 + epsilon) {
                    graph = iD.actions.DeleteNode(nodes[i].id)(graph);
                }
            }
        }

        return graph;

        function calcMotion(b, i, array) {
            var a = array[(i - 1 + array.length) % array.length],
                c = array[(i + 1) % array.length],
                p = subtractPoints(a, b),
                q = subtractPoints(c, b),
                scale, dotp;

            scale = 2 * Math.min(iD.geo.euclideanDistance(p, [0, 0]), iD.geo.euclideanDistance(q, [0, 0]));
            p = normalizePoint(p, 1.0);
            q = normalizePoint(q, 1.0);

            dotp = filterDotProduct(p[0] * q[0] + p[1] * q[1]);

            // nasty hack to deal with almost-straight segments (angle is closer to 180 than to 90/270).
            if (array.length > 3) {
                if (dotp < -0.707106781186547) {
                    dotp += 1.0;
                }
            } else if (dotp && Math.abs(dotp) < corner.dotp) {
                corner.i = i;
                corner.dotp = Math.abs(dotp);
            }

            return normalizePoint(addPoints(p, q), 0.1 * dotp * scale);
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
        var a = points[(i - 1 + points.length) % points.length],
            b = points[i],
            c = points[(i + 1) % points.length],
            p = subtractPoints(a, b),
            q = subtractPoints(c, b);

        p = normalizePoint(p, 1.0);
        q = normalizePoint(q, 1.0);

        return p[0] * q[0] + p[1] * q[1];
    }

    function subtractPoints(a, b) {
        return [a[0] - b[0], a[1] - b[1]];
    }

    function addPoints(a, b) {
        return [a[0] + b[0], a[1] + b[1]];
    }

    function normalizePoint(point, scale) {
        var vector = [0, 0];
        var length = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
        if (length !== 0) {
            vector[0] = point[0] / length;
            vector[1] = point[1] / length;
        }

        vector[0] *= scale;
        vector[1] *= scale;

        return vector;
    }

    function filterDotProduct(dotp) {
        if (lowerThreshold > Math.abs(dotp) || Math.abs(dotp) > upperThreshold) {
            return dotp;
        }

        return 0;
    }

    action.disabled = function(graph) {
        var way = graph.entity(wayId),
            nodes = graph.childNodes(way),
            points = _.uniq(nodes).map(function(n) { return projection(n.loc); });

        if (squareness(points)) {
            return false;
        }

        return 'not_squarish';
    };

    return action;
};
