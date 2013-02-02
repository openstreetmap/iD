iD.actions.Orthogonalize = function(wayId, map) {

    var action = function(graph) {
        var way = graph.entity(wayId),
        nodes = graph.childNodes(way),
        tags = {},key,role;

        var points = nodes.map(function(n) {
            return map.projection(n.loc);
        }),
        quad_nodes = [];

        var score = squareness();
        for (var i = 0; i < 1000; ++i) {
            var motions = points.map(stepMap);
            //return false;
            for (var j = 0; j < motions.length; ++j) {
                points[j] = addPoints(points[j],motions[j]);
            }
            var newScore = squareness();
            if (newScore > score) {
                return graph;
            }
            score = newScore;
            if (score < 1.0e-8) {
                break;
            }
        }
        for (var i = 0; i < points.length; i++) {
                quad_nodes.push(iD.Node({ loc: map.projection.invert(points[i]) }));
        }
        quad_nodes.push(quad_nodes[0]);

        for (i = 0; i < nodes.length; i++) {
            if (graph.parentWays(nodes[i]).length > 1) {
                var closest, closest_dist = Infinity, dist;
                for (var j = 0; j < quad_nodes.length; j++) {
                    dist = iD.geo.dist(quad_nodes[j].loc, nodes[i].loc);
                    if (dist < closest_dist) {
                        closest_dist = dist;
                        closest = j;
                    }
                }
                quad_nodes.splice(closest, 1, nodes[i]);
                if (closest === 0) quad_nodes.splice(quad_nodes.length - 1, 1, nodes[i]);
                else if (closest === quad_nodes.length - 1) quad_nodes.splice(0, 1, nodes[i]);
            } else {
                graph = graph.remove(nodes[i]);
            }
        }

        for (var i = 0; i < quad_nodes.length; i++) {
                graph = graph.replace(quad_nodes[i]);
        }

        return graph.replace(way.update({
            nodes: _.pluck(quad_nodes, 'id')
        }));


        function stepMap(b,i,array){
            var a,c,p,q = [];
            a = array[(i-1+array.length) % array.length];
            c = array[(i+1) % array.length];
            p = subtractPoints(a,b);
            q = subtractPoints(c,b);


            var scale = p.length + q.length;
            p = normalizePoint(p,1.0);
            q = normalizePoint(q,1.0);
            var dotp = p[0]*q[0] + p[1]*q[1];
            // nasty hack to deal with almost-straight segments (angle is closer to 180 than to 90/270).
            if (dotp < -0.707106781186547) {
                dotp += 1.0;
            }
            var v = [];
            v = addPoints(p,q);
            v = normalizePoint(v,0.1 * dotp * scale);
            return v;
        }

        function squareness(){

            var g = 0.0;
            for (var i = 1; i < points.length - 1; i++) {
                var score = scoreOfPoints(points[i-1], points[i], points[i+1]);
                g += score;
            }
            var startScore = scoreOfPoints(points[points.length-1], points[0], points[1]);
            var endScore = scoreOfPoints(points[points.length-2], points[points.length-1], points[0]);
            g += startScore;
            g += endScore;
            return g;
        }

        function scoreOfPoints(a, b, c) {
            var p,q = [];
            p = subtractPoints(a,b);
            q = subtractPoints(c,b);

            p = normalizePoint(p,1.0);
            q = normalizePoint(q,1.0);

            var dotp = p[0]*q[0] + p[1]*q[1];
            // score is constructed so that +1, -1 and 0 are all scored 0, any other angle
            // is scored higher.
            var score = 2.0 * Math.min(Math.abs(dotp-1.0), Math.min(Math.abs(dotp), Math.abs(dotp+1)));
            return score;
        }

        function subtractPoints(a,b){
            var vector = [0,0];
            vector[0] = a[0]-b[0];
            vector[1] = a[1]-b[1];
            return vector;
        }

        function addPoints(a,b){
            var vector = [0,0];
            vector[0] = a[0]+b[0];
            vector[1] = a[1]+b[1];
            return vector;
        }

        function normalizePoint(point,thickness){
            var vector = [0,0];
            var length = Math.sqrt( point[0] * point[0] + point[1] * point[1]); 
            if(length != 0){
                vector[0] = point[0]/length;
                vector[1] = point[1]/length;
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
