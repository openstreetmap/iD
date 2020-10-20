import { select as d3_select } from 'd3-selection';
import { osmPavedTags, osmSidewalkBoth, osmSidewalkShared, osmSidewalkSeparate, osmSidewalkSeparateRight, osmSidewalkSeparateLeft, osmSidewalkRight, osmSidewalkLeft, osmSidewalkNo, osmCyclewayTrack, osmCyclewayLane, osmCyclewayLaneNotOneway } from '../osm/tags';


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
    var _tags = function(entity) { return entity.tags; };


    var tagClasses = function(selection) {
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


    tagClasses.getClassesString = function(t, value) {
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
            .filter(function(klass) {
                return klass.length && !/^tag-/.test(klass);
            })
            .map(function(klass) {  // special overrides for some perimeter strokes
                return (klass === 'line' || klass === 'area') ? (overrideGeometry || klass) : klass;
            });

        // pick at most one primary classification tag..
        for (i = 0; i < primaries.length; i++) {
            k = primaries[i];
            v = t[k];
            if (!v || v === 'no') continue;
    
            if (k === 'piste:type') {  // avoid a ':' in the class name
                k = 'piste';
            } else if (k === 'building:part') {  // avoid a ':' in the class name
                k = 'building_part';
            }
    
            primary = k;
            if (statuses.indexOf(v) !== -1) {   // e.g. `railway=abandoned`
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
                    k = statuses[i] + ':' + primaries[j];  // e.g. `demolished:building=yes`
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

                if (v === 'yes') {   // e.g. `railway=rail + abandoned=yes`
                    status = k;
                }
                else if (primary && primary === v) {  // e.g. `railway=rail + abandoned=railway`
                    status = k;
                } else if (!primary && primaries.indexOf(v) !== -1) {  // e.g. `abandoned=railway`
                    status = k;
                    primary = v;
                    classes.push('tag-' + v);
                }  // else ignore e.g.  `highway=path + abandoned=railway`

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

        // check for number of flats in building or landuse residential:
        if (primary === 'building' || (primary === 'landuse' && t.landuse === 'residential'))
        {
            var numberOfFlats = 0;
            for (k in t) {
                v = t[k];
                if (k === 'building:flats' || k === 'flats' || k === 'houses')
                {
                    numberOfFlats = v;
                    break;
                }
            }
            if (numberOfFlats > 0)
            {
                classes.push('tag-has-flats');
                classes.push('tag-flats-'+numberOfFlats);
            }
        }

        // For highways, look for surface tagging..
        if (primary === 'highway' || primary === 'aeroway') {
            var paved = (t.highway !== 'track');
            var ignoreSidewalk = (
               t.highway === 'motorway'
            || t.highway === 'motorway_link'
            || t.highway === 'track'
            || t.highway === 'footway'
            || t.highway === 'cycleway'
            || t.highway === 'service'
            || t.highway === 'living_street'
            || t.highway === 'pedestrian'
            || t.highway === 'escape'
            || t.highway === 'raceway'
            || t.highway === 'bridleway'
            || t.highway === 'steps'
            || t.highway === 'path'
            || t.highway === 'corridor'
            || t.highway === 'proposed'
            || t.highway === 'construction'
            );
            var ignoreMaxSpeed = (
               t.highway === 'track'
            || t.highway === 'footway'
            || t.highway === 'cycleway'
            || t.highway === 'service'
            || t.highway === 'pedestrian'
            || t.highway === 'escape'
            || t.highway === 'raceway'
            || t.highway === 'bridleway'
            || t.highway === 'steps'
            || t.highway === 'path'
            || t.highway === 'corridor'
            || t.highway === 'proposed'
            || t.highway === 'construction'
            );
            var _private = false;
            var customers = false;
            var destination = false;
            var noMotorVehicle = false;
            var sidewalk = 'blank';
            var cycleway = 'blank';
            var cyclewayType = 'none';
            var sidewalkLeft = false;
            var sidewalkRight = false;
            var sidewalkSeparate = false;
            var sidewalkBoth = false;
            var cyclewayWithPedestrian = true;
            var isCycleway = (t.highway === 'cycleway');
            var sidewalkUseSidepath = false;
            var sidewalkSeparateLeftRightOrBoth = false;
            var cyclewayUseSidepath = false;
            var cyclewayHasSegregatedTag = false;
            var hasMaxSpeed = false;
            var maxSpeed    = null;
            var hasLanes = false;
            var delivery = false;
            var isSidewalk = false;
            var isCrossing = false;
            var hasName = false;
            var bicycleTag = null;

            for (k in t) {
                v = t[k];
                if ((k === 'foot' || k === 'routing:foot') && v === 'use_sidepath')
                {
                    sidewalkUseSidepath = true;
                }
                if (k === 'footway' && v === 'sidewalk')
                {
                    isSidewalk = true;
                }
                if (k === 'footway' && v === 'crossing')
                {
                    isCrossing = true;
                }
                if (k === 'name' && v !== '' && v !== undefined && v !== null)
                {
                    hasName = true;
                }
                
                if ((k === 'bicycle' || k === 'routing:bicycle') && v === 'use_sidepath')
                {
                    cyclewayUseSidepath = true;
                }
                if (k === 'bicycle')
                {
                    bicycleTag = v;
                }
                if (t.highway === 'cycleway' && k === 'segregated')
                {
                    if (v === 'no')
                    {
                        classes.push('tag-cycleway-segregated-no');
                    }
                    else if (v === 'yes')
                    {
                        classes.push('tag-cycleway-segregated-yes');
                    }
                    else
                    {
                        classes.push('tag-cycleway-segregated-undefined');
                    }
                    cyclewayHasSegregatedTag = true;
                }
                
                if (k === 'maxspeed' && v >= 10 && v <= 100)
                {
                    hasMaxSpeed = true;
                    maxSpeed = v;
                }
                if (k === 'lanes' && v >= 1 && v <= 10)
                {
                    hasLanes = true;
                }
                if (isCycleway && k === 'foot' && v === 'no')
                {
                    cyclewayWithPedestrian = false;
                }
                if (k in osmPavedTags) {
                    paved = !!osmPavedTags[k][v];
                    //break;
                }
                if ((k === 'bicycle' || k === 'foot' || k === 'motor_vehicle' || k === 'access') && v === 'private') {
                    _private = true;
                }
                if ((k === 'bicycle' || k === 'foot' || k === 'motor_vehicle' || k === 'access') && v === 'customers') {
                    customers = true;
                }
                if ((k === 'bicycle' || k === 'foot' || k === 'motor_vehicle' || k === 'access') && v === 'destination') {
                    destination = true;
                }
                if ((k === 'routing:bicycle' || k === 'routing:foot' || k === 'routing:motor_vehicle' || k === 'access:routing') && v === 'destination') {
                    destination = true;
                }
                if ((k === 'bicycle' || k === 'foot' || k === 'motor_vehicle' || k === 'access') && v === 'delivery') {
                    delivery = true;
                }
                if (k === 'motor_vehicle' && v === 'no') {
                    noMotorVehicle = true;
                }
                if (k === 'cycleway:right' && v === 'lane') {
                    cyclewayType = 'cycleway-right-lane';
                }
                if (k === 'cycleway:left' && v === 'lane') {
                    cyclewayType = 'cycleway-left-lane';
                }
                if (k in osmCyclewayTrack && !!osmCyclewayTrack[k][v]) {
                    cycleway = 'track';
                }
                if (k in osmCyclewayLane && !!osmCyclewayLane[k][v]) {
                    cycleway = 'lane';
                }
                if (k in osmCyclewayLaneNotOneway && !!osmCyclewayLaneNotOneway[k][v]) {
                    cycleway = 'not_one_way';
                }
                if (k in osmSidewalkBoth && !!osmSidewalkBoth[k][v]) {
                    sidewalk = 'both';
                }
                if (k in osmSidewalkNo && !!osmSidewalkNo[k][v]) {
                    sidewalk = 'no';
                }
                if (k in osmSidewalkShared && !!osmSidewalkShared[k][v]) {
                    sidewalk = 'shared';
                }
                if (k in osmSidewalkSeparate && !!osmSidewalkSeparate[k][v]) {
                    sidewalkSeparate = true;
                }
                if (k in osmSidewalkRight && !!osmSidewalkRight[k][v]) {
                    sidewalkRight;
                }
                if (k in osmSidewalkLeft && !!osmSidewalkLeft[k][v]) {
                    sidewalkLeft;
                }
                if (k in osmSidewalkSeparateLeft && !!osmSidewalkSeparateLeft[k][v]) {
                    sidewalkSeparate = true;
                    sidewalkLeft = true;
                }
                if (k in osmSidewalkSeparateRight && !!osmSidewalkSeparateRight[k][v]) {
                    sidewalkSeparate = true;
                    sidewalkRight = true;
                }
                
            }
            if (!paved) {
                classes.push('tag-unpaved');
            }
            if (_private) {
                classes.push('tag-private');
            }
            if (customers) {
                classes.push('tag-customers');
            }
            if (noMotorVehicle) {
                classes.push('tag-no-motor_vehicle');
            }
            if (delivery) {
                classes.push('tag-delivery');
            }
            if (destination) {
                classes.push('tag-destination');
            }
            if (sidewalk === 'shared') {
                classes.push('tag-sidewalk-shared');
            }
            if (sidewalkSeparate) {
                sidewalk = 'separate';
                classes.push('tag-sidewalk-separate');
            }
            if (sidewalkLeft && sidewalkRight)
            {
                sidewalkBoth = true;
                sidewalkSeparateLeftRightOrBoth = sidewalkSeparate;
                classes.push('tag-sidewalk-both');
            }
            if (!sidewalkBoth && sidewalkLeft)
            {
                classes.push('tag-sidewalk-left');
            }
            if (!sidewalkBoth && sidewalkRight)
            {
                classes.push('tag-sidewalk-right');
            }
            if (!sidewalkBoth && (sidewalkLeft || sidewalkRight))
            {
                sidewalkSeparateLeftRightOrBoth = sidewalkSeparate;
                classes.push('tag-sidewalk-oneside');
            }
            if (sidewalkBoth)
            {
                classes.push('tag-sidewalk-both');
            }
            if (!ignoreSidewalk && sidewalk === 'blank' && !sidewalkBoth && !sidewalkLeft && !sidewalkRight)
            {
                classes.push('tag-sidewalk-missing');
            }

            if (sidewalkSeparate && !sidewalkSeparateLeftRightOrBoth)
            {
                classes.push('tag-sidewalk-missing_separate_specify');
            }

            if (sidewalkUseSidepath)
            {
                classes.push('tag-sidewalk-use_sidepath');
            }
            if (cyclewayUseSidepath)
            {
                classes.push('tag-cycleway-use_sidepath');
            }

            if (sidewalk !== 'blank') {
                classes.push('tag-sidewalk-' + sidewalk);
                if (sidewalkUseSidepath)
                {
                    classes.push('tag-sidewalk-use_sidepath');
                }
                if (cyclewayUseSidepath)
                {
                    classes.push('tag-cycleway-use_sidepath');
                }
            }
            if (cycleway !== 'blank') {
                classes.push('tag-cycleway-' + cycleway);
                if (cyclewayHasSegregatedTag === false && cyclewayWithPedestrian)
                {
                    classes.push('tag-cycleway-segregated-undefined');
                }
            }
            if (cyclewayType !== 'none') {
                classes.push('tag-' + cyclewayType);
            }
            
            if (isCycleway && !cyclewayWithPedestrian)
            {
                classes.push('tag-cycleway-no_pedestrian');
            }
            if (!ignoreMaxSpeed && !hasMaxSpeed) {
                classes.push('tag-maxspeed-missing');
            }
            if (!ignoreMaxSpeed && !hasLanes) {
                classes.push('tag-lanes-missing');
            }
            if (isSidewalk)
            {
                if (!hasName)
                {
                    classes.push('tag-footway-sidewalk-no-name');
                }
                if (bicycleTag === 'yes') {
                    classes.push('tag-footway-sidewalk-bicycle-yes');
                }
                else if (bicycleTag === 'no') {
                    classes.push('tag-footway-sidewalk-bicycle-no');
                }
                else if (bicycleTag === 'dismount') {
                    classes.push('tag-footway-sidewalk-bicycle-dismount');
                }
                else
                {
                    classes.push('tag-footway-sidewalk-bicycle-undefined');
                }
            }

            if (isCrossing)
            {
                if (!hasName)
                {
                    classes.push('tag-footway-crossing-no-name');
                }
                if (bicycleTag === 'yes') {
                    classes.push('tag-footway-crossing-bicycle-yes');
                }
                else if (bicycleTag === 'no') {
                    classes.push('tag-footway-crossing-bicycle-no');
                }
                else if (bicycleTag === 'dismount') {
                    classes.push('tag-footway-crossing-bicycle-dismount');
                }
                else
                {
                    classes.push('tag-footway-crossing-bicycle-undefined');
                }
            }

            if (maxSpeed) {
                var maxSpeedRoundedToNearest10 = Math.round(maxSpeed / 10) * 10;
                classes.push('tag-maxspeed-' + maxSpeedRoundedToNearest10);
            }

        }

        // If this is a wikidata-tagged item, add a class for that..
        if (t.wikidata || t['brand:wikidata']) {
            classes.push('tag-wikidata');
        }

        return classes.join(' ').trim();
    };


    tagClasses.tags = function(val) {
        if (!arguments.length) return _tags;
        _tags = val;
        return tagClasses;
    };

    return tagClasses;
}
