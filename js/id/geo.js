iD.geo = {};

iD.geo.roundCoords = function(c) {
    return [Math.floor(c[0]), Math.floor(c[1])];
};

iD.geo.interp = function(p1, p2, t) {
    return [p1[0] + (p2[0] - p1[0]) * t,
            p1[1] + (p2[1] - p1[1]) * t];
};

// http://jsperf.com/id-dist-optimization
iD.geo.euclideanDistance = function(a, b) {
    var x = a[0] - b[0], y = a[1] - b[1];
    return Math.sqrt((x * x) + (y * y));
};
// Equirectangular approximation of spherical distances on Earth
iD.geo.sphericalDistance = function(a, b) {
    var x = Math.cos(a[1]*Math.PI/180) * (a[0] - b[0]),
        y = a[1] - b[1];
    return 6.3710E6 * Math.sqrt((x * x) + (y * y)) * Math.PI/180;
};

// Choose the edge with the minimal distance from `point` to its orthogonal
// projection onto that edge, if such a projection exists, or the distance to
// the closest vertex on that edge. Returns an object with the `index` of the
// chosen edge, the chosen `loc` on that edge, and the `distance` to to it.
iD.geo.chooseEdge = function(nodes, point, projection) {
    var dist = iD.geo.euclideanDistance,
        points = nodes.map(function(n) { return projection(n.loc); }),
        min = Infinity,
        idx, loc;

    function dot(p, q) {
        return p[0] * q[0] + p[1] * q[1];
    }

    for (var i = 0; i < points.length - 1; i++) {
        var o = points[i],
            s = [points[i + 1][0] - o[0],
                 points[i + 1][1] - o[1]],
            v = [point[0] - o[0],
                 point[1] - o[1]],
            proj = dot(v, s) / dot(s, s),
            p;

        if (proj < 0) {
            p = o;
        } else if (proj > 1) {
            p = points[i + 1];
        } else {
            p = [o[0] + proj * s[0], o[1] + proj * s[1]];
        }

        var d = dist(p, point);
        if (d < min) {
            min = d;
            idx = i + 1;
            loc = projection.invert(p);
        }
    }

    return {
        index: idx,
        distance: min,
        loc: loc
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
