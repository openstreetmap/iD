// @flow
type Vec2 = [number, number];

// constants
var TAU = 2 * Math.PI;
var EQUATORIAL_RADIUS = 6356752.314245179;
var POLAR_RADIUS = 6378137.0;


export function geoLatToMeters(dLat: number) {
    return dLat * (TAU * POLAR_RADIUS / 360);
}


export function geoLonToMeters(dLon: number, atLat: number) {
    return Math.abs(atLat) >= 90 ? 0 :
        dLon * (TAU * EQUATORIAL_RADIUS / 360) * Math.abs(Math.cos(atLat * (Math.PI / 180)));
}


export function geoMetersToLat(m: number) {
    return m / (TAU * POLAR_RADIUS / 360);
}


export function geoMetersToLon(m: number, atLat: number) {
    return Math.abs(atLat) >= 90 ? 0 :
        m / (TAU * EQUATORIAL_RADIUS / 360) / Math.abs(Math.cos(atLat * (Math.PI / 180)));
}


export function geoMetersToOffset(meters: Vec2, tileSize?: number) {
    tileSize = tileSize || 256;
    return [
        meters[0] * tileSize / (TAU * EQUATORIAL_RADIUS),
        -meters[1] * tileSize / (TAU * POLAR_RADIUS)
    ];
}


export function geoOffsetToMeters(offset: Vec2, tileSize?: number) {
    tileSize = tileSize || 256;
    return [
        offset[0] * TAU * EQUATORIAL_RADIUS / tileSize,
        -offset[1] * TAU * POLAR_RADIUS / tileSize
    ];
}


// Equirectangular approximation of spherical distances on Earth
export function geoSphericalDistance(a: Vec2, b: Vec2) {
    var x: number = geoLonToMeters(a[0] - b[0], (a[1] + b[1]) / 2);
    var y: number = geoLatToMeters(a[1] - b[1]);
    return Math.sqrt((x * x) + (y * y));
}


// scale to zoom
export function geoScaleToZoom(k: number, tileSize?: number) {
    tileSize = tileSize || 256;
    var log2ts: number = Math.log(tileSize) * Math.LOG2E;
    return Math.log(k * TAU) / Math.LN2 - log2ts;
}


// zoom to scale
export function geoZoomToScale(z: number, tileSize?: number) {
    tileSize = tileSize || 256;
    return tileSize * Math.pow(2, z) / TAU;
}

