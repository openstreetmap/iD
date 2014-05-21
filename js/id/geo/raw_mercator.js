/*
    Bypasses features of D3's default projection stream pipeline that are unnecessary:
    * Antimeridian clipping
    * Spherical rotation
    * Resampling
*/
iD.geo.RawMercator = function () {
    var project = d3.geo.mercator.raw,
        k = 512 / Math.PI, // scale
        x = 0, y = 0, // translate
        clipExtent = [[0, 0], [0, 0]];

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

    projection.stream = d3.geo.transform({
        point: function(x, y) {
            x = projection([x, y]);
            this.stream.point(x[0], x[1]);
        }
    }).stream;

    return projection;
};
