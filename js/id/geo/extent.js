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

iD.geo.Extent.prototype = new Array(2);

_.extend(iD.geo.Extent.prototype, {
    equals: function (obj) {
        return this[0][0] === obj[0][0] &&
            this[0][1] === obj[0][1] &&
            this[1][0] === obj[1][0] &&
            this[1][1] === obj[1][1];
    },

    extend: function(obj) {
        if (!(obj instanceof iD.geo.Extent)) obj = new iD.geo.Extent(obj);
        return iD.geo.Extent([Math.min(obj[0][0], this[0][0]),
                              Math.min(obj[0][1], this[0][1])],
                             [Math.max(obj[1][0], this[1][0]),
                              Math.max(obj[1][1], this[1][1])]);
    },

    _extend: function(extent) {
        this[0][0] = Math.min(extent[0][0], this[0][0]);
        this[0][1] = Math.min(extent[0][1], this[0][1]);
        this[1][0] = Math.max(extent[1][0], this[1][0]);
        this[1][1] = Math.max(extent[1][1], this[1][1]);
    },

    area: function() {
        return Math.abs((this[1][0] - this[0][0]) * (this[1][1] - this[0][1]));
    },

    center: function() {
        return [(this[0][0] + this[1][0]) / 2,
                (this[0][1] + this[1][1]) / 2];
    },

    rectangle: function() {
        return [this[0][0], this[0][1], this[1][0], this[1][1]];
    },

    polygon: function() {
        return [
            [this[0][0], this[0][1]],
            [this[0][0], this[1][1]],
            [this[1][0], this[1][1]],
            [this[1][0], this[0][1]],
            [this[0][0], this[0][1]]
        ];
    },

    contains: function(obj) {
        if (!(obj instanceof iD.geo.Extent)) obj = new iD.geo.Extent(obj);
        return obj[0][0] >= this[0][0] &&
               obj[0][1] >= this[0][1] &&
               obj[1][0] <= this[1][0] &&
               obj[1][1] <= this[1][1];
    },

    intersects: function(obj) {
        if (!(obj instanceof iD.geo.Extent)) obj = new iD.geo.Extent(obj);
        return obj[0][0] <= this[1][0] &&
               obj[0][1] <= this[1][1] &&
               obj[1][0] >= this[0][0] &&
               obj[1][1] >= this[0][1];
    },

    intersection: function(obj) {
        if (!this.intersects(obj)) return new iD.geo.Extent();
        return new iD.geo.Extent([Math.max(obj[0][0], this[0][0]),
                                  Math.max(obj[0][1], this[0][1])],
                                 [Math.min(obj[1][0], this[1][0]),
                                  Math.min(obj[1][1], this[1][1])]);
    },

    percentContainedIn: function(obj) {
        if (!(obj instanceof iD.geo.Extent)) obj = new iD.geo.Extent(obj);
        var a1 = this.intersection(obj).area(),
            a2 = this.area();

        if (a1 === Infinity || a2 === Infinity || a1 === 0 || a2 === 0) {
            return 0;
        } else {
            return a1 / a2;
        }
    },

    padByMeters: function(meters) {
        var dLat = iD.geo.metersToLat(meters),
            dLon = iD.geo.metersToLon(meters, this.center()[1]);
        return iD.geo.Extent(
                [this[0][0] - dLon, this[0][1] - dLat],
                [this[1][0] + dLon, this[1][1] + dLat]);
    },

    toParam: function() {
        return this.rectangle().join(',');
    }

});
