import _every from 'lodash-es/every';
import _some from 'lodash-es/some';


// constants
var TAU = 2 * Math.PI;
var EQUATORIAL_RADIUS = 6356752.314245179;
var POLAR_RADIUS = 6378137.0;


// vector addition
export function geoVecEquals(a, b) {
    return (a[0] === b[0]) && (a[1] === b[1]);
}

// vector addition
export function geoVecAdd(a, b) {
    return [ a[0] + b[0], a[1] + b[1] ];
}

// vector subtraction
export function geoVecSubtract(a, b) {
    return [ a[0] - b[0], a[1] - b[1] ];
}

// vector multiplication
export function geoVecScale(a, b) {
    return [ a[0] * b, a[1] * b ];
}

// vector rounding (was: geoRoundCoordinates)
export function geoVecFloor(a) {
    return [ Math.floor(a[0]), Math.floor(a[1]) ];
}

// linear interpolation
export function geoInterp(p1, p2, t) {
    return [
        p1[0] + (p2[0] - p1[0]) * t,
        p1[1] + (p2[1] - p1[1]) * t
    ];
}


// dot product
export function geoDot(a, b, origin) {
    origin = origin || [0, 0];
    return (a[0] - origin[0]) * (b[0] - origin[0]) +
        (a[1] - origin[1]) * (b[1] - origin[1]);
}


// 2D cross product of OA and OB vectors, returns magnitude of Z vector
// Returns a positive value, if OAB makes a counter-clockwise turn,
// negative for clockwise turn, and zero if the points are collinear.
export function geoCross(a, b, origin) {
    origin = origin || [0, 0];
    return (a[0] - origin[0]) * (b[1] - origin[1]) -
        (a[1] - origin[1]) * (b[0] - origin[0]);
}


// http://jsperf.com/id-dist-optimization
export function geoEuclideanDistance(a, b) {
    var x = a[0] - b[0];
    var y = a[1] - b[1];
    return Math.sqrt((x * x) + (y * y));
}


export function geoLatToMeters(dLat) {
    return dLat * (TAU * POLAR_RADIUS / 360);
}


export function geoLonToMeters(dLon, atLat) {
    return Math.abs(atLat) >= 90 ? 0 :
        dLon * (TAU * EQUATORIAL_RADIUS / 360) * Math.abs(Math.cos(atLat * (Math.PI / 180)));
}


export function geoMetersToLat(m) {
    return m / (TAU * POLAR_RADIUS / 360);
}


export function geoMetersToLon(m, atLat) {
    return Math.abs(atLat) >= 90 ? 0 :
        m / (TAU * EQUATORIAL_RADIUS / 360) / Math.abs(Math.cos(atLat * (Math.PI / 180)));
}


export function geoOffsetToMeters(offset, tileSize) {
    tileSize = tileSize || 256;
    return [
        offset[0] * TAU * EQUATORIAL_RADIUS / tileSize,
        -offset[1] * TAU * POLAR_RADIUS / tileSize
    ];
}


export function geoMetersToOffset(meters, tileSize) {
    tileSize = tileSize || 256;
    return [
        meters[0] * tileSize / (TAU * EQUATORIAL_RADIUS),
        -meters[1] * tileSize / (TAU * POLAR_RADIUS)
    ];
}


// Equirectangular approximation of spherical distances on Earth
export function geoSphericalDistance(a, b) {
    var x = geoLonToMeters(a[0] - b[0], (a[1] + b[1]) / 2);
    var y = geoLatToMeters(a[1] - b[1]);
    return Math.sqrt((x * x) + (y * y));
}


// zoom to scale
export function geoZoomToScale(z, tileSize) {
    tileSize = tileSize || 256;
    return tileSize * Math.pow(2, z) / TAU;
}


// scale to zoom
export function geoScaleToZoom(k, tileSize) {
    tileSize = tileSize || 256;
    var log2ts = Math.log(tileSize) * Math.LOG2E;
    return Math.log(k * TAU) / Math.LN2 - log2ts;
}


export function geoEdgeEqual(a, b) {
    return (a[0] === b[0] && a[1] === b[1]) ||
        (a[0] === b[1] && a[1] === b[0]);
}


// Return the counterclockwise angle in the range (-pi, pi)
// between the positive X axis and the line intersecting a and b.
export function geoAngle(a, b, projection) {
    a = projection(a.loc);
    b = projection(b.loc);
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
}


// Rotate all points counterclockwise around a pivot point by given angle
export function geoRotate(points, angle, around) {
    return points.map(function(point) {
        var radial = [point[0] - around[0], point[1] - around[1]];
        return [
            radial[0] * Math.cos(angle) - radial[1] * Math.sin(angle) + around[0],
            radial[0] * Math.sin(angle) + radial[1] * Math.cos(angle) + around[1]
        ];
    });
}


// Choose the edge with the minimal distance from `point` to its orthogonal
// projection onto that edge, if such a projection exists, or the distance to
// the closest vertex on that edge. Returns an object with the `index` of the
// chosen edge, the chosen `loc` on that edge, and the `distance` to to it.
export function geoChooseEdge(nodes, point, projection, skipID) {
    var dist = geoEuclideanDistance;
    var points = nodes.map(function(n) { return projection(n.loc); });
    var ids = nodes.map(function(n) { return n.id; });
    var min = Infinity;
    var idx;
    var loc;

    for (var i = 0; i < points.length - 1; i++) {
        if (ids[i] === skipID || ids[i + 1] === skipID) continue;

        var o = points[i];
        var s = geoVecSubtract(points[i + 1], o);
        var v = geoVecSubtract(point, o);
        var proj = geoDot(v, s) / geoDot(s, s);
        var p;

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

    if (idx !== undefined) {
        return { index: idx, distance: min, loc: loc };
    } else {
        return null;
    }
}


// Return the intersection point of 2 line segments.
// From https://github.com/pgkelley4/line-segments-intersect
// This uses the vector cross product approach described below:
//  http://stackoverflow.com/a/565282/786339
export function geoLineIntersection(a, b) {
    var p = [a[0][0], a[0][1]];
    var p2 = [a[1][0], a[1][1]];
    var q = [b[0][0], b[0][1]];
    var q2 = [b[1][0], b[1][1]];
    var r = geoVecSubtract(p2, p);
    var s = geoVecSubtract(q2, q);
    var uNumerator = geoCross(geoVecSubtract(q, p), r);
    var denominator = geoCross(r, s);

    if (uNumerator && denominator) {
        var u = uNumerator / denominator;
        var t = geoCross(geoVecSubtract(q, p), s) / denominator;

        if ((t >= 0) && (t <= 1) && (u >= 0) && (u <= 1)) {
            return geoInterp(p, p2, t);
        }
    }

    return null;
}


export function geoPathIntersections(path1, path2) {
    var intersections = [];
    for (var i = 0; i < path1.length - 1; i++) {
        for (var j = 0; j < path2.length - 1; j++) {
            var a = [ path1[i], path1[i+1] ];
            var b = [ path2[j], path2[j+1] ];
            var hit = geoLineIntersection(a, b);
            if (hit) {
                intersections.push(hit);
            }
        }
    }
    return intersections;
}


// Return whether point is contained in polygon.
//
// `point` should be a 2-item array of coordinates.
// `polygon` should be an array of 2-item arrays of coordinates.
//
// From https://github.com/substack/point-in-polygon.
// ray-casting algorithm based on
// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
//
export function geoPointInPolygon(point, polygon) {
    var x = point[0];
    var y = point[1];
    var inside = false;

    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];

        var intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}


export function geoPolygonContainsPolygon(outer, inner) {
    return _every(inner, function(point) {
        return geoPointInPolygon(point, outer);
    });
}


export function geoPolygonIntersectsPolygon(outer, inner, checkSegments) {
    function testSegments(outer, inner) {
        for (var i = 0; i < outer.length - 1; i++) {
            for (var j = 0; j < inner.length - 1; j++) {
                var a = [ outer[i], outer[i +1 ] ];
                var b = [ inner[j], inner[j + 1] ];
                if (geoLineIntersection(a, b)) return true;
            }
        }
        return false;
    }

    function testPoints(outer, inner) {
        return _some(inner, function(point) {
            return geoPointInPolygon(point, outer);
        });
    }

   return testPoints(outer, inner) || (!!checkSegments && testSegments(outer, inner));
}


export function geoPathLength(path) {
    var length = 0;
    for (var i = 0; i < path.length - 1; i++) {
        length += geoEuclideanDistance(path[i], path[i + 1]);
    }
    return length;
}


// If the given point is at the edge of the padded viewport,
// return a vector that will nudge the viewport in that direction
export function geoViewportEdge(point, dimensions) {
    var pad = [80, 20, 50, 20];   // top, right, bottom, left
    var x = 0;
    var y = 0;

    if (point[0] > dimensions[0] - pad[1])
        x = -10;
    if (point[0] < pad[3])
        x = 10;
    if (point[1] > dimensions[1] - pad[2])
        y = -10;
    if (point[1] < pad[0])
        y = 10;

    if (x || y) {
        return [x, y];
    } else {
        return null;
    }
}
