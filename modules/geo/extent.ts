import { geoMetersToLat, geoMetersToLon } from './geo';
import type { Vec2, Vec4 } from './vector';

export interface BBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

declare class geoExtent extends Array<Vec2> {
    constructor(min?: geoExtent | Vec2 | [Vec2, Vec2], max?: Vec2)
    equals(obj: geoExtent): boolean;
    extend(obj: geoExtent | Vec2 | [Vec2, Vec2]): geoExtent;
    _extend(obj: geoExtent): void;
    area(): number;
    center(): Vec2;
    rectangle(): Vec4;
    bbox(): BBox;
    polygon(): Vec2[];
    contains(other: geoExtent | Vec2 | [Vec2, Vec2]): boolean;
    intersects(other: geoExtent | Vec2 | [Vec2, Vec2]): boolean;
    intersection(other: geoExtent | [Vec2, Vec2]): geoExtent;
    percentContainedIn(other: geoExtent | Vec2 | [Vec2, Vec2]): number;
    padByMeters(metres: number): geoExtent;
    toParam(): string;
    split(): [geoExtent, geoExtent, geoExtent, geoExtent]
}

function isVec2Tuple(value: Vec2 | [Vec2, Vec2] | undefined): value is [Vec2, Vec2] {
    return (
        Array.isArray(value) &&
        value.length === 2 &&
        Array.isArray(value[0]) &&
        value[0].length === 2 &&
        Array.isArray(value[1]) &&
        value[1].length === 2
    );
}

function geoExtent(this: unknown, min?: geoExtent | Vec2 | [Vec2, Vec2], max?: Vec2) {
    if (!(this instanceof geoExtent)) {
        return new geoExtent(min, max);
    } else if (min instanceof geoExtent) {
        return min;
    } else if (isVec2Tuple(min)) {
        this[0] = min[0];
        this[1] = min[1];
    } else {
        this[0] = min        || [ Infinity,  Infinity];
        this[1] = max || min || [-Infinity, -Infinity];
    }
    return this;
}

geoExtent.prototype = <geoExtent> new Array(2);

    geoExtent.prototype.equals = function (obj) {
        return this[0][0] === obj[0][0] &&
            this[0][1] === obj[0][1] &&
            this[1][0] === obj[1][0] &&
            this[1][1] === obj[1][1];
    };


    geoExtent.prototype.extend = function(obj) {
        if (!(obj instanceof geoExtent)) obj = new geoExtent(obj);
        return geoExtent(
            [Math.min(obj[0][0], this[0][0]), Math.min(obj[0][1], this[0][1])],
            [Math.max(obj[1][0], this[1][0]), Math.max(obj[1][1], this[1][1])]
        );
    };


    geoExtent.prototype._extend = function(extent) {
        this[0][0] = Math.min(extent[0][0], this[0][0]);
        this[0][1] = Math.min(extent[0][1], this[0][1]);
        this[1][0] = Math.max(extent[1][0], this[1][0]);
        this[1][1] = Math.max(extent[1][1], this[1][1]);
    };


    geoExtent.prototype.area = function() {
        return Math.abs((this[1][0] - this[0][0]) * (this[1][1] - this[0][1]));
    };


    geoExtent.prototype.center = function() {
        return [(this[0][0] + this[1][0]) / 2, (this[0][1] + this[1][1]) / 2];
    };


    geoExtent.prototype.rectangle = function() {
        return [this[0][0], this[0][1], this[1][0], this[1][1]];
    };


    geoExtent.prototype.bbox = function() {
        return { minX: this[0][0], minY: this[0][1], maxX: this[1][0], maxY: this[1][1] };
    };


    geoExtent.prototype.polygon = function() {
        return [
            [this[0][0], this[0][1]],
            [this[0][0], this[1][1]],
            [this[1][0], this[1][1]],
            [this[1][0], this[0][1]],
            [this[0][0], this[0][1]]
        ];
    };


    geoExtent.prototype.contains = function(obj) {
        if (!(obj instanceof geoExtent)) obj = new geoExtent(obj);
        return obj[0][0] >= this[0][0] &&
               obj[0][1] >= this[0][1] &&
               obj[1][0] <= this[1][0] &&
               obj[1][1] <= this[1][1];
    };


    geoExtent.prototype.intersects = function(obj) {
        if (!(obj instanceof geoExtent)) obj = new geoExtent(obj);
        return obj[0][0] <= this[1][0] &&
               obj[0][1] <= this[1][1] &&
               obj[1][0] >= this[0][0] &&
               obj[1][1] >= this[0][1];
    };


    geoExtent.prototype.intersection = function(obj) {
        if (!this.intersects(obj)) return new geoExtent();
        return new geoExtent(
            [Math.max(obj[0][0], this[0][0]), Math.max(obj[0][1], this[0][1])],
            [Math.min(obj[1][0], this[1][0]), Math.min(obj[1][1], this[1][1])]
        );
    };


    geoExtent.prototype.percentContainedIn = function(obj) {
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
    };


    geoExtent.prototype.padByMeters = function(meters) {
        var dLat = geoMetersToLat(meters);
        var dLon = geoMetersToLon(meters, this.center()[1]);
        return geoExtent(
            [this[0][0] - dLon, this[0][1] - dLat],
            [this[1][0] + dLon, this[1][1] + dLat]
        );
    };


    geoExtent.prototype.toParam = function() {
        return this.rectangle().join(',');
    };

    geoExtent.prototype.split = function() {
        const center = this.center();
        return [
            geoExtent(this[0], center),
            geoExtent([center[0], this[0][1]], [this[1][0], center[1]]),
            geoExtent(center, this[1]),
            geoExtent([this[0][0], center[1]], [center[0], this[1][1]])
        ];
    };

export { geoExtent };
