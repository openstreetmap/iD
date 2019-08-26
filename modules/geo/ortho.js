import { geoVecEqual, geoVecNormalizedDot } from './vector';


export function geoOrthoNormalizedDotProduct(a, b, origin) {
    if (geoVecEqual(origin, a) || geoVecEqual(origin, b)) {
        return 1;  // coincident points, treat as straight and try to remove
    }
    return geoVecNormalizedDot(a, b, origin);
}


function geoOrthoFilterDotProduct(dotp, epsilon, lowerThreshold, upperThreshold, allowStraightAngles) {
    var val = Math.abs(dotp);
    if (val < epsilon) {
        return 0;      // already orthogonal
    } else if (allowStraightAngles && Math.abs(val-1) < epsilon) {
        return 0;      // straight angle, which is okay in this case
    } else if (val < lowerThreshold || val > upperThreshold) {
        return dotp;   // can be adjusted
    } else {
        return null;   // ignore vertex
    }
}


export function geoOrthoCalcScore(points, isClosed, epsilon, threshold) {
    var score = 0;
    var first = isClosed ? 0 : 1;
    var last = isClosed ? points.length : points.length - 1;
    var coords = points.map(function(p) { return p.coord; });

    var lowerThreshold = Math.cos((90 - threshold) * Math.PI / 180);
    var upperThreshold = Math.cos(threshold * Math.PI / 180);

    for (var i = first; i < last; i++) {
        var a = coords[(i - 1 + coords.length) % coords.length];
        var origin = coords[i];
        var b = coords[(i + 1) % coords.length];

        var dotp = geoOrthoFilterDotProduct(geoOrthoNormalizedDotProduct(a, b, origin), epsilon, lowerThreshold, upperThreshold);
        if (dotp === null) continue;    // ignore vertex
        score = score + 2.0 * Math.min(Math.abs(dotp - 1.0), Math.min(Math.abs(dotp), Math.abs(dotp + 1)));
    }

    return score;
}

// returns the maximum angle less than `lessThan` between the actual corner and a 0° or 90° corner
export function geoOrthoMaxOffsetAngle(coords, isClosed, lessThan) {
    var max = -Infinity;

    var first = isClosed ? 0 : 1;
    var last = isClosed ? coords.length : coords.length - 1;

    for (var i = first; i < last; i++) {
        var a = coords[(i - 1 + coords.length) % coords.length];
        var origin = coords[i];
        var b = coords[(i + 1) % coords.length];
        var normalizedDotP = geoOrthoNormalizedDotProduct(a, b, origin);

        var angle = Math.acos(Math.abs(normalizedDotP)) * 180 / Math.PI;

        if (angle > 45) angle = 90 - angle;

        if (angle >= lessThan) continue;

        if (angle > max) max = angle;
    }

    if (max === -Infinity) return null;

    return max;
}


// similar to geoOrthoCalcScore, but returns quickly if there is something to do
export function geoOrthoCanOrthogonalize(coords, isClosed, epsilon, threshold, allowStraightAngles) {
    var score = null;
    var first = isClosed ? 0 : 1;
    var last = isClosed ? coords.length : coords.length - 1;

    var lowerThreshold = Math.cos((90 - threshold) * Math.PI / 180);
    var upperThreshold = Math.cos(threshold * Math.PI / 180);

    for (var i = first; i < last; i++) {
        var a = coords[(i - 1 + coords.length) % coords.length];
        var origin = coords[i];
        var b = coords[(i + 1) % coords.length];

        var dotp = geoOrthoFilterDotProduct(geoOrthoNormalizedDotProduct(a, b, origin), epsilon, lowerThreshold, upperThreshold, allowStraightAngles);
        if (dotp === null) continue;        // ignore vertex
        if (Math.abs(dotp) > 0) return 1;   // something to do
        score = 0;                          // already square
    }

    return score;
}
