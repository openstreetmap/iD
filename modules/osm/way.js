import { osmEntity } from './entity';
import { entityEntity } from '../entities/entity';
import { entityWay } from '../entities/way';
import { osmLanes } from './lanes';
import { osmAreaKeys, osmOneWayTags, osmRightSideIsInsideTags } from './tags';


export function osmWay() {
    if (!(this instanceof osmWay)) {
        return (new osmWay()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
}

// use this class for ways
entityEntity.way = osmWay;

// inherit from entityWay
osmWay.prototype = Object.create(entityWay.prototype);

// Use common properties of osmEntity.
// This is not prototype inheritance. osmWay is not an `instanceof` osmEntity.
Object.assign(osmWay.prototype, osmEntity.prototype);

Object.assign(osmWay.prototype, {

    layer: function() {
        // explicit layer tag, clamp between -10, 10..
        if (isFinite(this.tags.layer)) {
            return Math.max(-10, Math.min(+(this.tags.layer), 10));
        }

        // implied layer tag..
        if (this.tags.covered === 'yes') return -1;
        if (this.tags.location === 'overground') return 1;
        if (this.tags.location === 'underground') return -1;
        if (this.tags.location === 'underwater') return -10;

        if (this.tags.power === 'line') return 10;
        if (this.tags.power === 'minor_line') return 10;
        if (this.tags.aerialway) return 10;
        if (this.tags.bridge) return 1;
        if (this.tags.cutting) return -1;
        if (this.tags.tunnel) return -1;
        if (this.tags.waterway) return -1;
        if (this.tags.man_made === 'pipeline') return -10;
        if (this.tags.boundary) return -10;
        return 0;
    },


    isOneWay: function() {
        // explicit oneway tag..
        var values = {
            'yes': true,
            '1': true,
            '-1': true,
            'reversible': true,
            'alternating': true,
            'no': false,
            '0': false
        };
        if (values[this.tags.oneway] !== undefined) {
            return values[this.tags.oneway];
        }

        // implied oneway tag..
        for (var key in this.tags) {
            if (key in osmOneWayTags && (this.tags[key] in osmOneWayTags[key]))
                return true;
        }
        return false;
    },

    // Some identifier for tag that implies that this way is "sided",
    // i.e. the right side is the 'inside' (e.g. the right side of a
    // natural=cliff is lower).
    sidednessIdentifier: function() {
        for (var key in this.tags) {
            var value = this.tags[key];
            if (key in osmRightSideIsInsideTags && (value in osmRightSideIsInsideTags[key])) {
                if (osmRightSideIsInsideTags[key][value] === true) {
                    return key;
                } else {
                    // if the map's value is something other than a
                    // literal true, we should use it so we can
                    // special case some keys (e.g. natural=coastline
                    // is handled differently to other naturals).
                    return osmRightSideIsInsideTags[key][value];
                }
            }
        }

        return null;
    },

    isSided: function() {
        if (this.tags.two_sided === 'yes') {
            return false;
        }

        return this.sidednessIdentifier() !== null;
    },

    lanes: function() {
        return osmLanes(this);
    },

    // returns an object with the tag that implies this is an area, if any
    tagSuggestingArea: function() {
        if (this.tags.area === 'yes') return { area: 'yes' };
        if (this.tags.area === 'no') return null;

        // `highway` and `railway` are typically linear features, but there
        // are a few exceptions that should be treated as areas, even in the
        // absence of a proper `area=yes` or `areaKeys` tag.. see #4194
        var lineKeys = {
            highway: {
                rest_area: true,
                services: true
            },
            railway: {
                roundhouse: true,
                station: true,
                traverser: true,
                turntable: true,
                wash: true
            }
        };
        var returnTags = {};
        for (var key in this.tags) {
            if (key in osmAreaKeys && !(this.tags[key] in osmAreaKeys[key])) {
                returnTags[key] = this.tags[key];
                return returnTags;
            }
            if (key in lineKeys && this.tags[key] in lineKeys[key]) {
                returnTags[key] = this.tags[key];
                return returnTags;
            }
        }
        return null;
    },

    isArea: function() {
        if (this.tags.area === 'yes')
            return true;
        if (!this.isClosed() || this.tags.area === 'no')
            return false;
        return this.tagSuggestingArea() !== null;
    }

});
