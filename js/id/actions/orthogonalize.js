/*
 * Based on https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/potlatch2/tools/Quadrilateralise.as
 */

iD.actions.Orthogonalize = function(wayId, projection) {
    var action = function(graph) {
        var way = graph.entity(wayId),
            nodes = graph.childNodes(way),
            points, best, i, j, score, corner;

        corner = {i: 0, dotp: 1}; //corner closest to 90

        if(nodes.length == 4) {
            points = _.uniq(nodes).map(function(n) { return projection(n.loc); });
        } else {
            points = nodes.map(function(n) { return projection(n.loc); });
            score = squareness();
        }

        for (i = 0; i < 1000; i++) {
            var motions = points.map(stepMap);
            if(nodes.length == 4) {
                points[corner.i] = addPoints(points[corner.i],motions[corner.i]);
                score = corner.dotp;
            } else {
                for (j = 0; j < motions.length; j++) {
                    points[j] = addPoints(points[j],motions[j]);
                }
                var newScore = squareness();
                if (newScore < score) {
                    best = _.clone(points);
                    score = newScore;
                }
            }
            if (score < 1.0e-8) {
                break;
            }
        }

        if(nodes.length == 4) {
                graph = graph.replace(graph.entity(nodes[corner.i].id)
                .move(projection.invert(points[corner.i])));
        } else {
            points = best;
            for (i = 0; i < points.length - 1; i++) {
                graph = graph.replace(graph.entity(nodes[i].id)
                .move(projection.invert(points[i])));
            }
        }

        return graph;

        function stepMap(b, i, array) {
            var a = array[(i - 1 + array.length) % array.length],
                c = array[(i + 1) % array.length],
                p = subtractPoints(a, b),
                q = subtractPoints(c, b);

            var scale = iD.geo.dist(p, [0, 0]) + iD.geo.dist(q, [0, 0]);
            p = normalizePoint(p, 1.0);
            q = normalizePoint(q, 1.0);

            var dotp = p[0] * q[0] + p[1] * q[1];

            if(nodes.length == 4) { 
                if( Math.abs(dotp) < corner.dotp){
                    corner.i = i;
                    corner.dotp = Math.abs(dotp);
                }
            } else {
                // nasty hack to deal with almost-straight segments (angle is closer to 180 than to 90/270).
                if (dotp < -0.707106781186547) {
                    dotp += 1.0;
                }
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

        function normalizePoint(point, thickness) {
            var vector = [0, 0];
            var length = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
            if (length !== 0) {
                vector[0] = point[0] / length;
                vector[1] = point[1] / length;
            }

            vector[0] *= thickness;
            vector[1] *= thickness;

            return vector;
        }
    };

    action.enabled = function(graph) {
        return graph.entity(wayId).isClosed();
    };

    return action;
};
