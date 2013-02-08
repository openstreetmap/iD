iD.geo.Extent = function geoExtent(min, max) {
    if (!(this instanceof iD.geo.Extent)) return new iD.geo.Extent(min, max);
    if (min instanceof iD.geo.Extent) {
        return min;
    } else if (min && min.length === 2 && min[0].length === 2 && min[1].length === 2) {
        this[0] = min[0];
        this[1] = min[1];
    } else {
        this[0] = min        || [ Infinity,  Infinity];
        this[1] = max || min || [-Infinity, -Infinity];
    }
};

iD.geo.Extent.prototype = [[], []];

_.extend(iD.geo.Extent.prototype, {
    extend: function (obj) {
        obj = iD.geo.Extent(obj);
        return iD.geo.Extent([Math.min(obj[0][0], this[0][0]),
                              Math.min(obj[0][1], this[0][1])],
                             [Math.max(obj[1][0], this[1][0]),
                              Math.max(obj[1][1], this[1][1])]);
    },

    center: function () {
        return [(this[0][0] + this[1][0]) / 2,
                (this[0][1] + this[1][1]) / 2];
    },

    intersects: function (obj) {
        obj = iD.geo.Extent(obj);
        return obj[0][0] <= this[1][0] &&
               obj[0][1] <= this[1][1] &&
               obj[1][0] >= this[0][0] &&
               obj[1][1] >= this[0][1];
    }
});
