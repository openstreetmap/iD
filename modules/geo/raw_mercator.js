import {
    geoMercatorRaw as d3_geoMercatorRaw,
    geoTransform as d3_geoTransform
} from 'd3-geo';

import {
    zoomIdentity as d3_zoomIdentity
} from 'd3-zoom';

/**
 * @import { Vec2 } from './vector';
 * @typedef {[Vec2, Vec2]} ClipExtent
 */

/**
    Bypasses features of D3's default projection stream pipeline that are unnecessary:
    * Antimeridian clipping
    * Spherical rotation
    * Resampling
*/
export function geoRawMercator() {
    const project = d3_geoMercatorRaw;
    let k = 512 / Math.PI; // scale
    let x = 0;
    let y = 0; // translate
    /** @type {ClipExtent} */
    let clipExtent = [[0, 0], [0, 0]];

    /**
     * @param {Vec2} point
     * @returns {Vec2}
     */
    function projection(point) {
        point = project(point[0] * Math.PI / 180, point[1] * Math.PI / 180);
        return [point[0] * k + x, y - point[1] * k];
    }

    /**
     * @param {Vec2} point
     * @returns {Vec2}
     */
    projection.invert = function(point) {
        point = project.invert((point[0] - x) / k, (y - point[1]) / k);
        return point && [point[0] * 180 / Math.PI, point[1] * 180 / Math.PI];
    };


    /** @type {GetSet<typeof projection, number>} */
    projection.scale = function(_) {
        if (!arguments.length) return k;
        k = +_;
        return projection;
    };


    /** @type {GetSet<typeof projection, Vec2>} */
    projection.translate = function(_) {
        if (!arguments.length) return [x, y];
        x = +_[0];
        y = +_[1];
        return projection;
    };


    /** @type {GetSet<typeof projection, Vec2>} */
    projection.clipExtent = function(_) {
        if (!arguments.length) return clipExtent;
        clipExtent = _;
        return projection;
    };


    /** @type {GetSet<typeof projection, ZoomTransform>} */
    projection.transform = function(obj) {
        if (!arguments.length) return d3_zoomIdentity.translate(x, y).scale(k);
        x = +obj.x;
        y = +obj.y;
        k = +obj.k;
        return projection;
    };


    projection.stream = d3_geoTransform({
        point: function(x, y) {
            const vec = projection([x, y]);
            this.stream.point(vec[0], vec[1]);
        }
    }).stream;


    return projection;
}
/**
 * @typedef {ReturnType<geoRawMercator>} Projection
 */
