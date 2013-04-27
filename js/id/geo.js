iD.geo = {};

iD.geo.roundCoords = function(c) {
    return [Math.floor(c[0]), Math.floor(c[1])];
};

iD.geo.interp = function(p1, p2, t) {
    return [p1[0] + (p2[0] - p1[0]) * t,
            p1[1] + (p2[1] - p1[1]) * t];
};

// http://jsperf.com/id-dist-optimization
iD.geo.dist = function(a, b) {
    var x = a[0] - b[0], y = a[1] - b[1];
    return Math.sqrt((x * x) + (y * y));
};

// Choose the edge with the minimal distance from `point` to its orthogonal
// projection onto that edge, if such a projection exists. Returns an object
// with the `index`of the chosen edge, `distance` to the orthogonal projection,
// and its `loc`.
iD.geo.chooseEdge = function(nodes, point, projection) {
    var dist = iD.geo.dist,
        points = nodes.map(function(n) { return projection(n.loc); }),
        min = Infinity,
        idx, loc;

    function dot(p, q) {
        return p[0] * q[0] + p[1] * q[1];
    }

    for (var i = 0; i < points.length - 1; i++) {
        var o = points[i],
            s = [points[i + 1][0] - o[0], points[i + 1][1] - o[1]],
            v = [point[0] - o[0], point[1] - o[1]],
            proj = dot(v, s) / dot(s, s);

        // Only consider projections that lie on the edge itself.
        if (proj >= 0 && proj <= 1) {
            var p = [o[0] + proj * s[0], o[1] + proj * s[1]],
                d = dist(p, point);

            if (d < min) {
                min = d;
                idx = i + 1;
                loc = projection.invert(p);
            }
        }
    }

    return {
        index: idx,
        distance: min,
        loc: loc
    };
};

iD.geo.chooseVertex = function(nodes, point, projection) {
    var idx, min = Infinity, dist;

    for (var i = 0; i < nodes.length; i++) {
        dist = iD.geo.dist(projection(nodes[i].loc), point);
        if (dist < min) {
            min = dist;
            idx = i;
        }
    }

    return {
        index: idx,
        distance: min
    };
};

// Return whether point is contained in polygon.
//
// `point` should be a 2-item array of coordinates.
// `polygon` should be an array of 2-item arrays of coordinates.
//
// From https://github.com/substack/point-in-polygon.
// ray-casting algorithm based on
// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
//
iD.geo.pointInPolygon = function(point, polygon) {
    var x = point[0],
        y = point[1],
        inside = false;

    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];

        var intersect = ((yi > y) != (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

iD.geo.polygonContainsPolygon = function(outer, inner) {
    return _.every(inner, function(point) {
        return iD.geo.pointInPolygon(point, outer);
    });
};

iD.geo.polygonIntersectsPolygon = function(outer, inner) {
    return _.some(inner, function(point) {
        return iD.geo.pointInPolygon(point, outer);
    });
};

iD.geo.pathLength = function(path) {
    var length = 0,
        dx, dy;
    for (var i = 0; i < path.length - 1; i++) {
        dx = path[i][0] - path[i + 1][0];
        dy = path[i][1] - path[i + 1][1];
        length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
};
