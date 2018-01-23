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
    var x = a[0] - b[0];
    var y = a[1] - b[1];
    return Math.sqrt((x * x) + (y * y));
}

// Return the counterclockwise angle in the range (-pi, pi)
// between the positive X axis and the line intersecting a and b.
export function geoVecAngle(a, b) {
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
}

// dot product
export function geoVecDot(a, b, origin) {
    origin = origin || [0, 0];
    return (a[0] - origin[0]) * (b[0] - origin[0]) +
        (a[1] - origin[1]) * (b[1] - origin[1]);
}

// 2D cross product of OA and OB vectors, returns magnitude of Z vector
// Returns a positive value, if OAB makes a counter-clockwise turn,
// negative for clockwise turn, and zero if the points are collinear.
export function geoVecCross(a, b, origin) {
    origin = origin || [0, 0];
    return (a[0] - origin[0]) * (b[1] - origin[1]) -
        (a[1] - origin[1]) * (b[0] - origin[0]);
}

