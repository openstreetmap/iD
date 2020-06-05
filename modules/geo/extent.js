import { geoMetersToLat, geoMetersToLon } from './geo';


export function geoExtent(min, max) {
    if (!(this instanceof geoExtent)) {
        return new geoExtent(min, max);
    } else if (min instanceof geoExtent) {
        return min;
    } else if (min && min.length === 2 && min[0].length === 2 && min[1].length === 2) {
        this[0] = min[0];
        this[1] = min[1];
    } else {
        this[0] = min        || [ Infinity,  Infinity];
        this[1] = max || min || [-Infinity, -Infinity];
    }
}

geoExtent.prototype = new Array(2);

Object.assign(geoExtent.prototype, {

    equals: function (obj) {
        return this[0][0] === obj[0][0] &&
            this[0][1] === obj[0][1] &&
            this[1][0] === obj[1][0] &&
            this[1][1] === obj[1][1];
    },


    extend: function(obj) {
        if (!(obj instanceof geoExtent)) obj = new geoExtent(obj);
        return geoExtent(
            [Math.min(obj[0][0], this[0][0]), Math.min(obj[0][1], this[0][1])],
            [Math.max(obj[1][0], this[1][0]), Math.max(obj[1][1], this[1][1])]
        );
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
        return [(this[0][0] + this[1][0]) / 2, (this[0][1] + this[1][1]) / 2];
    },


    rectangle: function() {
        return [this[0][0], this[0][1], this[1][0], this[1][1]];
    },


    bbox: function() {
        return { minX: this[0][0], minY: this[0][1], maxX: this[1][0], maxY: this[1][1] };
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
        if (!(obj instanceof geoExtent)) obj = new geoExtent(obj);
        return obj[0][0] >= this[0][0] &&
               obj[0][1] >= this[0][1] &&
               obj[1][0] <= this[1][0] &&
               obj[1][1] <= this[1][1];
    },


    intersects: function(obj) {
        if (!(obj instanceof geoExtent)) obj = new geoExtent(obj);
        return obj[0][0] <= this[1][0] &&
               obj[0][1] <= this[1][1] &&
               obj[1][0] >= this[0][0] &&
               obj[1][1] >= this[0][1];
    },


    intersection: function(obj) {
        if (!this.intersects(obj)) return new geoExtent();
        return new geoExtent(
            [Math.max(obj[0][0], this[0][0]), Math.max(obj[0][1], this[0][1])],
            [Math.min(obj[1][0], this[1][0]), Math.min(obj[1][1], this[1][1])]
        );
    },


    percentContainedIn: function(obj) {
        if (!(obj instanceof geoExtent)) obj = new geoExtent(obj);
        var a1 = this.intersection(obj).area();
        var a2 = this.area();

        if (a1 === Infinity || a2 === Infinity) {
            return 0;
        } else if (a1 === 0 || a2 === 0) {
            if (obj.contains(this)) {
                return 1;
            }
            return 0;
        } else {
            return a1 / a2;
        }
    },


    padByMeters: function(meters) {
        var dLat = geoMetersToLat(meters);
        var dLon = geoMetersToLon(meters, this.center()[1]);
        return geoExtent(
            [this[0][0] - dLon, this[0][1] - dLat],
            [this[1][0] + dLon, this[1][1] + dLat]
        );
    },


    toParam: function() {
        return this.rectangle().join(',');
    }

});
