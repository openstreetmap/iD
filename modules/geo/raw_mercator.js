import {
    geoMercatorRaw as d3_geoMercatorRaw,
    geoTransform as d3_geoTransform
} from 'd3-geo';

import {
    zoomIdentity as d3_zoomIdentity
} from 'd3-zoom';


/*
    Bypasses features of D3's default projection stream pipeline that are unnecessary:
    * Antimeridian clipping
    * Spherical rotation
    * Resampling
*/
export function geoRawMercator() {
    var project = d3_geoMercatorRaw;
    var k = 512 / Math.PI; // scale
    var x = 0;
    var y = 0; // translate
    var clipExtent = [[0, 0], [0, 0]];


    function projection(point) {
        point = project(point[0] * Math.PI / 180, point[1] * Math.PI / 180);
        return [point[0] * k + x, y - point[1] * k];
    }


    projection.invert = function(point) {
        point = project.invert((point[0] - x) / k, (y - point[1]) / k);
        return point && [point[0] * 180 / Math.PI, point[1] * 180 / Math.PI];
    };


    projection.scale = function(_) {
        if (!arguments.length) return k;
        k = +_;
        return projection;
    };


    projection.translate = function(_) {
        if (!arguments.length) return [x, y];
        x = +_[0];
        y = +_[1];
        return projection;
    };


    projection.clipExtent = function(_) {
        if (!arguments.length) return clipExtent;
        clipExtent = _;
        return projection;
    };


    projection.transform = function(obj) {
        if (!arguments.length) return d3_zoomIdentity.translate(x, y).scale(k);
        x = +obj.x;
        y = +obj.y;
        k = +obj.k;
        return projection;
    };


    projection.stream = d3_geoTransform({
        point: function(x, y) {
            var vec = projection([x, y]);
            this.stream.point(vec[0], vec[1]);
        }
    }).stream;


    return projection;
}
