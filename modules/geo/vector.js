// vector equals
export function geoVecEqual(a, b, epsilon) {
    if (epsilon) {
        return (Math.abs(a[0] - b[0]) <= epsilon) && (Math.abs(a[1] - b[1]) <= epsilon);
    } else {
        return (a[0] === b[0]) && (a[1] === b[1]);
    }
}

// vector addition
export function geoVecAdd(a, b) {
    return [ a[0] + b[0], a[1] + b[1] ];
}

// vector subtraction
export function geoVecSubtract(a, b) {
    return [ a[0] - b[0], a[1] - b[1] ];
}

// vector scaling
export function geoVecScale(a, mag) {
    return [ a[0] * mag, a[1] * mag ];
}

// vector rounding (was: geoRoundCoordinates)
export function geoVecFloor(a) {
    return [ Math.floor(a[0]), Math.floor(a[1]) ];
}

// linear interpolation
export function geoVecInterp(a, b, t) {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t
    ];
}

// http://jsperf.com/id-dist-optimization
export function geoVecLength(a, b) {
    return Math.sqrt(geoVecLengthSquare(a,b));
}

// length of vector raised to the power two
export function geoVecLengthSquare(a, b) {
    b = b || [0, 0];
    var x = a[0] - b[0];
    var y = a[1] - b[1];
    return (x * x) + (y * y);
}

// get a unit vector
export function geoVecNormalize(a) {
    var length = Math.sqrt((a[0] * a[0]) + (a[1] * a[1]));
    if (length !== 0) {
        return geoVecScale(a, 1 / length);
    }
    return [0, 0];
}

// Return the counterclockwise angle in the range (-pi, pi)
// between the positive X axis and the line intersecting a and b.
export function geoVecAngle(a, b) {
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
}

// dot product
export function geoVecDot(a, b, origin) {
    origin = origin || [0, 0];
    var p = geoVecSubtract(a, origin);
    var q = geoVecSubtract(b, origin);
    return (p[0]) * (q[0]) + (p[1]) * (q[1]);
}

// normalized dot product
export function geoVecNormalizedDot(a, b, origin) {
    origin = origin || [0, 0];
    var p = geoVecNormalize(geoVecSubtract(a, origin));
    var q = geoVecNormalize(geoVecSubtract(b, origin));
    return geoVecDot(p, q);
}

// 2D cross product of OA and OB vectors, returns magnitude of Z vector
// Returns a positive value, if OAB makes a counter-clockwise turn,
// negative for clockwise turn, and zero if the points are collinear.
export function geoVecCross(a, b, origin) {
    origin = origin || [0, 0];
    var p = geoVecSubtract(a, origin);
    var q = geoVecSubtract(b, origin);
    return (p[0]) * (q[1]) - (p[1]) * (q[0]);
}


// find closest orthogonal projection of point onto points array
export function geoVecProject(a, points) {
    var min = Infinity;
    var idx;
    var target;

    for (var i = 0; i < points.length - 1; i++) {
        var o = points[i];
        var s = geoVecSubtract(points[i + 1], o);
        var v = geoVecSubtract(a, o);
        var proj = geoVecDot(v, s) / geoVecDot(s, s);
        var p;

        if (proj < 0) {
            p = o;
        } else if (proj > 1) {
            p = points[i + 1];
        } else {
            p = [o[0] + proj * s[0], o[1] + proj * s[1]];
        }

        var dist = geoVecLength(p, a);
        if (dist < min) {
            min = dist;
            idx = i + 1;
            target = p;
        }
    }

    if (idx !== undefined) {
        return { index: idx, distance: min, target: target };
    } else {
        return null;
    }
}

