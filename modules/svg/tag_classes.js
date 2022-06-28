import {
    select as d3_select
} from 'd3-selection';
import {
    osmPavedTags
} from '../osm/tags';


export function svgTagClasses() {
    var primaries = [
        'building', 'highway', 'railway', 'waterway', 'aeroway', 'aerialway',
        'piste:type', 'boundary', 'power', 'amenity', 'natural', 'landuse',
        'leisure', 'military', 'place', 'man_made', 'route', 'attraction',
        'building:part', 'indoor'
    ];
    var statuses = [
        'proposed', 'construction', 'disused', 'abandoned', 'dismantled',
        'razed', 'demolished', 'obliterated', 'intermittent'
    ];
    var secondaries = [
        'oneway', 'bridge', 'tunnel', 'embankment', 'cutting', 'barrier',
        'surface', 'tracktype', 'footway', 'crossing', 'service', 'sport',
        'public_transport', 'location', 'parking', 'golf', 'type', 'leisure',
        'man_made', 'indoor'
    ];
    var _tags = function (entity) {
        return entity.tags;
    };


    var tagClasses = function (selection) {
        selection.each(function tagClassesEach(entity) {
            var value = this.className;

            if (value.baseVal !== undefined) {
                value = value.baseVal;
            }

            var t = _tags(entity);

            var computed = tagClasses.getClassesString(t, value);

            if (computed !== value) {
                d3_select(this).attr('class', computed);
            }
        });
    };


    tagClasses.getClassesString = function (t, value) {
        var primary, status;
        var i, j, k, v;

        // in some situations we want to render perimeter strokes a certain way
        var overrideGeometry;
        if (/\bstroke\b/.test(value)) {
            if (!!t.barrier && t.barrier !== 'no') {
                overrideGeometry = 'line';
            }
        }

        // preserve base classes (nothing with `tag-`)
        var classes = value.trim().split(/\s+/)
            .filter(function (klass) {
                return klass.length && !/^tag-/.test(klass);
            })
            .map(function (klass) { // special overrides for some perimeter strokes
                return (klass === 'line' || klass === 'area') ? (overrideGeometry || klass) : klass;
            });

        // pick at most one primary classification tag..
        for (i = 0; i < primaries.length; i++) {
            k = primaries[i];
            v = t[k];
            if (!v || v === 'no') continue;

            if (k === 'piste:type') { // avoid a ':' in the class name
                k = 'piste';
            } else if (k === 'building:part') { // avoid a ':' in the class name
                k = 'building_part';
            }

            primary = k;
            if (statuses.indexOf(v) !== -1) { // e.g. `railway=abandoned`
                status = v;
                classes.push('tag-' + k);
            } else {
                classes.push('tag-' + k);
                classes.push('tag-' + k + '-' + v);
            }

            break;
        }

        if (!primary) {
            for (i = 0; i < statuses.length; i++) {
                for (j = 0; j < primaries.length; j++) {
                    k = statuses[i] + ':' + primaries[j]; // e.g. `demolished:building=yes`
                    v = t[k];
                    if (!v || v === 'no') continue;

                    status = statuses[i];
                    break;
                }
            }
        }

        // add at most one status tag, only if relates to primary tag..
        if (!status) {
            for (i = 0; i < statuses.length; i++) {
                k = statuses[i];
                v = t[k];
                if (!v || v === 'no') continue;

                if (v === 'yes') { // e.g. `railway=rail + abandoned=yes`
                    status = k;
                } else if (primary && primary === v) { // e.g. `railway=rail + abandoned=railway`
                    status = k;
                } else if (!primary && primaries.indexOf(v) !== -1) { // e.g. `abandoned=railway`
                    status = k;
                    primary = v;
                    classes.push('tag-' + v);
                } // else ignore e.g.  `highway=path + abandoned=railway`

                if (status) break;
            }
        }

        if (status) {
            classes.push('tag-status');
            classes.push('tag-status-' + status);
        }

        // add any secondary tags
        for (i = 0; i < secondaries.length; i++) {
            k = secondaries[i];
            v = t[k];
            if (!v || v === 'no' || k === primary) continue;
            classes.push('tag-' + k);
            classes.push('tag-' + k + '-' + v);
        }


        // check for number of flats in building or landuse residential and office tag:
        if (primary === 'building' || (primary === 'landuse' && t.landuse === 'residential')) {
            var numberOfFlats = 0;
            for (k in t) {
                v = t[k];
                if (k === 'building:flats' || k === 'flats' || k === 'houses') {
                    numberOfFlats = v;
                    break;
                }
                if (k === 'office' && v === 'yes') {
                    classes.push('tag-building-office-yes');
                }
            }
            if (numberOfFlats > 0) {
                classes.push('tag-has-flats');
                classes.push('tag-flats-' + numberOfFlats);
            }
        }

        // For highways, look for surface tagging..
        if (primary === 'highway' || primary === 'aeroway') {
            //var paved = (t.highway !== 'track');
            var ignoreSidewalk = (
                t.highway === 'motorway' ||
                t.highway === 'motorway_link' ||
                t.highway === 'track' ||
                t.highway === 'footway' ||
                t.highway === 'cycleway' ||
                t.highway === 'service' ||
                t.highway === 'living_street' ||
                t.highway === 'pedestrian' ||
                t.highway === 'escape' ||
                t.highway === 'raceway' ||
                t.highway === 'bridleway' ||
                t.highway === 'steps' ||
                t.highway === 'path' ||
                t.highway === 'corridor' ||
                t.highway === 'construction' ||
                t.highway === 'proposed'
            );
            var ignoreMaxSpeed = (
                t.highway === 'track' ||
                t.highway === 'footway' ||
                t.highway === 'cycleway' ||
                t.highway === 'pedestrian' ||
                t.highway === 'escape' ||
                t.highway === 'raceway' ||
                t.highway === 'bridleway' ||
                t.highway === 'steps' ||
                t.highway === 'path' ||
                t.highway === 'corridor' ||
                t.highway === 'construction' ||
                t.highway === 'proposed'
            );

            var sidewalk = null;
            var sidewalkLeft = null;
            var sidewalkRight = null;
            var cycleway = null;
            var crossing = null;
            var segregated = null;
            var foot = null;
            var bicycle = null;
            var motor_vehicle = null;
            var bus = null;
            var footway = null;
            var maxSpeed = null;
            var access = null;
            var lanes = null;
            var lanesForward = null;
            var lanesBackward = null;
            var lanesBothWays = null;
            var widthLanesCount = null;
            var widthLanesStartCount = null;
            var widthLanesEndCount = null;
            var widthLanesForwardCount = null;
            var widthLanesForwardStartCount = null;
            var widthLanesForwardEndCount = null;
            var widthLanesBackwardCount = null;
            var widthLanesBackwardStartCount = null;
            var widthLanesBackwardEndCount = null;

            var isOneWay = false;
            var hasName = false;
            var hasLanes = false;
            var hasLanesForward = false;
            var hasLanesBackward = false;
            var hasLanesBothWays = false;
            var isSidewalk = false;
            var isCycleway = false;
            var isCrossing = false;

            for (k in t) {
                v = t[k];

                if (k === 'access') {
                    access = v;
                    classes.push('tag-access-' + access);
                }
                if (k === 'foot' || k === 'routing:foot') {
                    foot = v;
                    classes.push('tag-foot-' + foot);
                }
                if (k === 'bicycle' || k === 'routing:bicycle') {
                    bicycle = v;
                    classes.push('tag-bicycle-' + bicycle);
                }
                if (k === 'motor_vehicle' || k === 'routing:motor_vehicle') {
                    motor_vehicle = v;
                    classes.push('tag-motor_vehicle-' + motor_vehicle);
                }
                if (k === 'bus' || k === 'routing:bus' || k === 'psv') {
                    bus = v;
                    classes.push('tag-bus-' + bus);
                }
                if (k === 'busway:right' || k === 'busway:left' || k === 'busway' || k === 'bus:lanes' || k === 'bus:lanes:forward' || k === 'bus:lanes:backward') {
                    classes.push('tag-busway');
                }
                if (k === 'cycleway') {
                    cycleway = v;
                    isCycleway = true;
                    classes.push('tag-cycleway-' + cycleway);
                }
                if (k === 'cycleway:left') {
                    cycleway = v;
                    classes.push('tag-cycleway_left-' + cycleway);
                }
                if (k === 'cycleway:right') {
                    cycleway = v;
                    classes.push('tag-cycleway_right-' + cycleway);
                }
                if (k === 'cycleway:both') {
                    cycleway = v;
                    classes.push('tag-cycleway_both-' + cycleway);
                }
                if (k === 'crossing') {
                    crossing = v;
                    isCrossing = true;
                    classes.push('tag-crossing-' + crossing);
                }
                if (k === 'segregated') {
                    segregated = v;
                    classes.push('tag-segregated-' + segregated);
                }
                if (k === 'footway') {
                    footway = v;
                    isSidewalk = true;
                    classes.push('tag-footway-' + footway);
                }
                if (!ignoreSidewalk && k === 'sidewalk' && ['shared', 'separate', 'no'].includes(v)) {
                    sidewalk = v;
                }
                if (!ignoreSidewalk && k === 'sidewalk:left') {
                    sidewalkLeft = v;
                    classes.push('tag-sidewalk_left-' + sidewalkLeft);
                }
                if (!ignoreSidewalk && k === 'sidewalk:right') {
                    sidewalkRight = v;
                    classes.push('tag-sidewalk_right-' + sidewalkRight);
                }
                /*if ((k === 'footway' || k === 'cycleway') && v === 'crossing') {
                    isCrossing = true;
                }*/
                if (k === 'name' && v !== '' && v !== undefined && v !== null) {
                    hasName = true;
                    classes.push('tag-name-yes');
                }
                if (!ignoreMaxSpeed && (k === 'maxspeed' || k === 'maxspeed:advisory') && v >= 10 && v <= 130) {
                    maxSpeed = Number(v);
                }
                if (k === 'oneway' && v === 'yes') {
                    isOneWay = true;
                }
                if (k === 'lanes' && v >= 1 && v <= 8) {
                    lanes = Number(v);
                    hasLanes = true;
                }
                if (k === 'lanes:forward' && v >= 1 && v <= 8) {
                    lanesForward = Number(v);
                    hasLanesForward = true;
                }
                if (k === 'lanes:backward' && v >= 1 && v <= 8) {
                    lanesBackward = Number(v);
                    hasLanesBackward = true;
                }
                if (k === 'lanes:both_ways' && v >= 1 && v <= 8) {
                    lanesBothWays = Number(v);
                    hasLanesBothWays = true;
                }
                if (k === 'turn:lanes' || k === 'turn:lanes:forward' || k === 'turn:lanes:backward' || k === 'turn:lanes:both_ways') {
                    classes.push('tag-turn_lanes-yes');
                }
                if (k === 'placement' && v === 'transition') {
                    classes.push('tag-placement-transition');
                }
                if ((k === 'placement' && v !== 'transition') || k === 'placement:forward' || 'placement:backward') {
                    classes.push('tag-placement-not-transition');
                }
                if (k === 'width:lanes') {
                    widthLanesCount = (v.match(/\|/g) || []).length + 1;
                }
                if (k === 'width:lanes:start') {
                    widthLanesStartCount = (v.match(/\|/g) || []).length + 1;
                }
                if (k === 'width:lanes:end') {
                    widthLanesEndCount = (v.match(/\|/g) || []).length + 1;
                }
                if (k === 'width:lanes:forward') {
                    widthLanesForwardCount = (v.match(/\|/g) || []).length + 1;
                }
                if (k === 'width:lanes:forward:start') {
                    widthLanesForwardStartCount = (v.match(/\|/g) || []).length + 1;
                }
                if (k === 'width:lanes:forward:end') {
                    widthLanesForwardEndCount = (v.match(/\|/g) || []).length + 1;
                }
                if (k === 'width:lanes:backward') {
                    widthLanesBackwardCount = (v.match(/\|/g) || []).length + 1;
                }
                if (k === 'width:lanes:backward:start') {
                    widthLanesBackwardStartCount = (v.match(/\|/g) || []).length + 1;
                }
                if (k === 'width:lanes:backward:end') {
                    widthLanesBackwardEndCount = (v.match(/\|/g) || []).length + 1;
                }
                /* unpaved */
                if (k in osmPavedTags) {
                    var isPaved = !!osmPavedTags[k][v];
                    if (!isPaved) {
                        classes.push('tag-unpaved');
                    }
                }

            }

            /* validate and classify sidewalk presence: */
            if (!ignoreSidewalk) {
                if (
                    (sidewalk === 'separate' && sidewalkLeft === 'separate' && sidewalkRight === 'separate') ||
                    (sidewalk === 'separate' && sidewalkLeft === 'no' && sidewalkRight === 'separate') ||
                    (sidewalk === 'separate' && sidewalkLeft === 'separate' && sidewalkRight === 'no') ||
                    (sidewalk === null && sidewalkLeft === 'separate' && sidewalkRight === 'separate') ||
                    (sidewalk === null && sidewalkLeft === 'separate' && sidewalkRight === 'no') ||
                    (sidewalk === null && sidewalkLeft === 'no' && sidewalkRight === 'separate')
                ) {
                    classes.push('tag-sidewalk-separate');
                    if (sidewalkLeft === 'no' && sidewalkRight === 'separate') {
                        classes.push('tag-sidewalk-separate-right');
                    } else if (sidewalkLeft === 'separate' && sidewalkRight === 'no') {
                        classes.push('tag-sidewalk-separate-left');
                    } else if (sidewalkLeft === 'separate' && sidewalkRight === 'separate') {
                        classes.push('tag-sidewalk-separate-both');
                    }
                } else if (
                    (sidewalk === 'shared' && sidewalkLeft === 'shared' && sidewalkRight === 'shared') ||
                    (sidewalk === 'shared' && sidewalkLeft === 'no' && sidewalkRight === 'shared') ||
                    (sidewalk === 'shared' && sidewalkLeft === 'shared' && sidewalkRight === 'no') ||
                    (sidewalk === null && sidewalkLeft === 'shared' && sidewalkRight === 'shared') ||
                    (sidewalk === null && sidewalkLeft === 'shared' && sidewalkRight === 'no') ||
                    (sidewalk === null && sidewalkLeft === 'no' && sidewalkRight === 'shared')
                ) {
                    classes.push('tag-sidewalk-shared');
                    if (sidewalkRight === 'shared' && sidewalkLeft === 'no') {
                        classes.push('tag-sidewalk-shared-right');
                    } else if (sidewalkLeft === 'shared' && sidewalkRight === 'no') {
                        classes.push('tag-sidewalk-shared-left');
                    }
                } else if (
                    (sidewalk === 'no' && sidewalkLeft === null && sidewalkRight === null) ||
                    (sidewalk === null && sidewalkLeft === 'no' && sidewalkRight === 'no')
                ) {
                    classes.push('tag-sidewalk-no');
                } else if (sidewalk === null && sidewalkLeft === null && sidewalkRight === null) {
                    classes.push('tag-sidewalk-undefined');
                } else {
                    classes.push('tag-sidewalk-invalid');
                }
            }

            /* validate lanes */
            if (!isOneWay && hasLanes && lanes > 2 && lanes % 2 === 1) {
                if (!hasLanesForward || !hasLanesBackward) {
                    classes.push('tag-lanes-error-count-lanes');
                }
            }
            if (hasLanesForward && hasLanesBackward && lanes !== lanesForward + lanesBackward) {
                if (hasLanesBothWays && lanes !== lanesForward + lanesBackward + lanesBothWays) {
                    classes.push('tag-lanes-error-count-lanes-total-mismatch');
                }
            }
            if (
                (widthLanesCount && widthLanesCount !== lanes) ||
                (widthLanesStartCount && widthLanesStartCount !== lanes) ||
                (widthLanesEndCount && widthLanesEndCount !== lanes) ||
                (widthLanesForwardCount && widthLanesForwardCount !== lanesForward) ||
                (widthLanesForwardStartCount && widthLanesForwardStartCount !== lanesForward) ||
                (widthLanesForwardEndCount && widthLanesForwardEndCount !== lanesForward) ||
                (widthLanesBackwardCount && widthLanesBackwardCount !== lanesBackward) ||
                (widthLanesBackwardStartCount && widthLanesBackwardStartCount !== lanesBackward) ||
                (widthLanesBackwardEndCount && widthLanesBackwardEndCount !== lanesBackward)
            ) {
                classes.push('tag-lanes-error-width-lanes');
            }



            /* undefined and reverses */
            if (t.highway === 'cycleway' && !segregated) {
                classes.push('tag-segregated-undefined');
            }
            if (!hasName && (isSidewalk || isCycleway || isCrossing)) {
                classes.push('tag-name-no');
            }

            /* maxspeeds */
            if (!ignoreMaxSpeed) {
                if (maxSpeed) {
                    var maxSpeedRoundedToNearest10 = Math.round(maxSpeed / 10) * 10;
                    if (maxSpeedRoundedToNearest10 > 60) {
                        classes.push('tag-maxspeed-more_than_60');
                    }
                    classes.push('tag-maxspeed-' + maxSpeedRoundedToNearest10);
                } else if (t.highway !== 'service') {
                    classes.push('tag-maxspeed-undefined');
                }
                if (!hasLanes && t.highway !== 'service') {
                    classes.push('tag-lanes-undefined');
                }
                if (foot !== 'use_sidepath') {
                    classes.push('tag-foot-not-use_sidepath');
                }

            }

        }

        // If this is a wikidata-tagged item, add a class for that..
        if (t.wikidata || t['brand:wikidata']) {
            classes.push('tag-wikidata');
        }

        return classes.join(' ').trim();
    };


    tagClasses.tags = function (val) {
        if (!arguments.length) return _tags;
        _tags = val;
        return tagClasses;
    };

    return tagClasses;
}
