/*
 * Based on https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/potlatch2/tools/Quadrilateralise.as
 */

iD.actions.Orthogonalize = function(wayId, projection) {
    var action = function(graph) {
        var way = graph.entity(wayId),
            nodes = graph.childNodes(way),
            corner = {i: 0, dotp: 1},
            epsilon = 1e-8,
            points, i, j, score, motions;

        if (nodes.length === 4) {
            points = _.uniq(nodes).map(function(n) { return projection(n.loc); });

            for (i = 0; i < 1000; i++) {
                motions = points.map(calcMotion);
                points[corner.i] = addPoints(points[corner.i],motions[corner.i]);
                score = corner.dotp;
                if (score < 1.0e-8) {
                    break;
                }
            }

            graph = graph.replace(graph.entity(nodes[corner.i].id)
                .move(projection.invert(points[corner.i])));
        } else {
            var best;
            points = _.uniq(nodes).map(function(n) { return projection(n.loc); });
            score = Infinity;

            for (i = 0; i < 1000; i++) {
                motions = points.map(calcMotion);
                for (j = 0; j < motions.length; j++) {
                    points[j] = addPoints(points[j],motions[j]);
                }
                var newScore = squareness();
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
                graph = graph.replace(graph.entity(nodes[i].id)
                    .move(projection.invert(points[i])));
            }

            // remove empty nodes on straight sections
            for (i = 0; i < points.length; i++) {
                var node = nodes[i],
                    a, b, c, p, q, dotp;

                if (graph.parentWays(node).length > 1 || 
                    graph.parentRelations(node).length || 
                    node.hasInterestingTags()) {

                    continue;
                }

                a = points[(i - 1 + points.length) % points.length];
                b = points[i];
                c = points[(i + 1) % points.length];
                p = normalizePoint(subtractPoints(a, b), 1.0);
                q = normalizePoint(subtractPoints(c, b), 1.0);
                dotp = p[0] * q[0] + p[1] * q[1];

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
                q = subtractPoints(c, b);

            var scale = 2*Math.min(iD.geo.dist(p, [0, 0]), iD.geo.dist(q, [0, 0]));
            p = normalizePoint(p, 1.0);
            q = normalizePoint(q, 1.0);

            var dotp = p[0] * q[0] + p[1] * q[1];

            // nasty hack to deal with almost-straight segments (angle is closer to 180 than to 90/270).
            if (array.length > 3) {
                if (dotp < -0.707106781186547) {
                    dotp += 1.0;
                }
            } else if (Math.abs(dotp) < corner.dotp) {
                corner.i = i;
                corner.dotp = Math.abs(dotp);
            }

            return normalizePoint(addPoints(p, q), 0.1 * dotp * scale);
        }

        function squareness() {
            var g = 0.0;
            for (var i = 1; i < points.length - 1; i++) {
                var score = scoreOfPoints(points[i - 1], points[i], points[i + 1]);
                g += score;
            }
            var startScore = scoreOfPoints(points[points.length - 1], points[0], points[1]);
            var endScore = scoreOfPoints(points[points.length - 2], points[points.length - 1], points[0]);
            g += startScore;
            g += endScore;
            return g;
        }

        function scoreOfPoints(a, b, c) {
            var p = subtractPoints(a, b),
                q = subtractPoints(c, b);

            p = normalizePoint(p, 1.0);
            q = normalizePoint(q, 1.0);

            var dotp = p[0] * q[0] + p[1] * q[1];
            // score is constructed so that +1, -1 and 0 are all scored 0, any other angle
            // is scored higher.
            return 2.0 * Math.min(Math.abs(dotp - 1.0), Math.min(Math.abs(dotp), Math.abs(dotp + 1)));
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
    };

    action.disabled = function(graph) {
        return false;
    };

    return action;
};
