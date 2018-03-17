// @flow
import type { Vec2 } from '.';

// vector equals
export function geoVecEqual(a: Vec2, b: Vec2, epsilon?: number): boolean {
    if (epsilon) {
        return (Math.abs(a[0] - b[0]) <= epsilon) && (Math.abs(a[1] - b[1]) <= epsilon);
    } else {
        return (a[0] === b[0]) && (a[1] === b[1]);
    }
}

// vector addition
export function geoVecAdd(a: Vec2, b: Vec2): Vec2 {
    return [ a[0] + b[0], a[1] + b[1] ];
}

// vector subtraction
export function geoVecSubtract(a: Vec2, b: Vec2): Vec2 {
    return [ a[0] - b[0], a[1] - b[1] ];
}

// vector scaling
export function geoVecScale(a: Vec2, mag: number): Vec2 {
    return [ a[0] * mag, a[1] * mag ];
}

// vector rounding (was: geoRoundCoordinates)
export function geoVecFloor(a: Vec2): Vec2 {
    return [ Math.floor(a[0]), Math.floor(a[1]) ];
}

// linear interpolation
export function geoVecInterp(a: Vec2, b: Vec2, t: number): Vec2 {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t
    ];
}

// http://jsperf.com/id-dist-optimization
export function geoVecLength(a: Vec2, b: Vec2): number {
    var x: number = a[0] - b[0];
    var y: number = a[1] - b[1];
    return Math.sqrt((x * x) + (y * y));
}

// Return the counterclockwise angle in the range (-pi, pi)
// between the positive X axis and the line intersecting a and b.
export function geoVecAngle(a: Vec2, b: Vec2): number {
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
}

// dot product
export function geoVecDot(a: Vec2, b: Vec2, origin?: Vec2): number {
    origin = origin || [0, 0];
    return (a[0] - origin[0]) * (b[0] - origin[0]) +
        (a[1] - origin[1]) * (b[1] - origin[1]);
}

// 2D cross product of OA and OB vectors, returns magnitude of Z vector
// Returns a positive value, if OAB makes a counter-clockwise turn,
// negative for clockwise turn, and zero if the points are collinear.
export function geoVecCross(a: Vec2, b: Vec2, origin?: Vec2): number {
    origin = origin || [0, 0];
    return (a[0] - origin[0]) * (b[1] - origin[1]) -
        (a[1] - origin[1]) * (b[0] - origin[0]);
}

