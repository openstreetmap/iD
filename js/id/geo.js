iD.geo = {};

iD.geo.roundCoords = function(c) {
    return [Math.floor(c[0]), Math.floor(c[1])];
};

iD.geo.interp = function(p1, p2, t) {
    return [p1[0] + (p2[0] - p1[0]) * t,
            p1[1] + (p2[1] - p1[1]) * t];
};

iD.geo.dist = function(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) +
        Math.pow(a[1] - b[1], 2));
};

iD.geo.chooseIndex = function(way, point, map) {
    var dist = iD.geo.dist,
        projNodes = way.nodes.map(function(n) {
        return map.projection(n.loc);
    });

    for (var i = 0, changes = []; i < projNodes.length - 1; i++) {
        changes[i] =
            (dist(projNodes[i], point) + dist(point, projNodes[i + 1])) /
            dist(projNodes[i], projNodes[i + 1]);
    }

    var idx = _.indexOf(changes, _.min(changes)),
        ratio = dist(projNodes[idx], point) / dist(projNodes[idx], projNodes[idx + 1]),
        loc = iD.geo.interp(way.nodes[idx].loc, way.nodes[idx + 1].loc, ratio);

    return {
        index: idx + 1,
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
    return _.every(inner, function (point) {
        return iD.geo.pointInPolygon(point, outer);
    });
};

iD.geo.polygonIntersectsPolygon = function(outer, inner) {
    return _.some(inner, function (point) {
        return iD.geo.pointInPolygon(point, outer);
    });
};

// May have issues with self interesecting polygons
iD.geo.polygonCentroid = function(polygon) {
    var x = 0,
        y = 0,
        area = iD.geo.area(polygon);
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];
        x += (xi + xj) * (xj * yi - xi * yj);
        y += (yi + yj) * (xj * yi - xi * yj);
    }
    return [x / 6 / area, y / 6 / area];
};

iD.geo.area = function(polygon) {
    var area = 0;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];
        area += xj * yi - xi * yj;
    }
    return area/2;
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
