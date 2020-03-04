import { select as d3_select } from 'd3-selection';
import { osmPavedTags, osmPrivateTags, osmCustomersTags, osmDestinationTags, osmSidewalkBoth, osmSidewalkSeparate, osmSidewalkSeparateRight, osmSidewalkSeparateBoth, osmSidewalkSeparateLeft, osmSidewalkSeparateRightOrLeft, osmSidewalkRightOrLeft, osmSidewalkNo, osmCyclewayTrack, osmCyclewayLane, osmCyclewayLaneNotOneway } from '../osm/tags';


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
            var _private = false;
            var customers = false;
            var destination = false;
            var sidewalk = 'blank';
            var cycleway = 'blank';

            var sidewalk_use_sidepath = false;
            var cycleway_use_sidepath = false;

            for (k in t) {
                v = t[k];
                if (k === 'foot' && v === 'use_sidepath')
                {
                    separate_use_sidepath = true;
                }
                if (k === 'bicycle' && v === 'use_sidepath')
                {
                    cycleway_use_sidepath = true;
                }
                if (k in osmPavedTags) {
                    paved = !!osmPavedTags[k][v];
                    //break;
                }
                if (k in osmPrivateTags) {
                    _private = !!osmPrivateTags[k][v];
                }
                if (k in osmCustomersTags) {
                    customers = !!osmCustomersTags[k][v];
                }
                if (k in osmDestinationTags) {
                    destination = !!osmDestinationTags[k][v];
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
                if (k in osmSidewalkSeparate && !!osmSidewalkSeparate[k][v]) {
                    sidewalk = 'separate';
                }
                if (k in osmSidewalkSeparateLeft && !!osmSidewalkSeparateLeft[k][v]) {
                    sidewalk = 'separate_left';
                }
                if (k in osmSidewalkSeparateRight && !!osmSidewalkSeparateRight[k][v]) {
                    sidewalk = 'separate_right';
                }
                if (k in osmSidewalkSeparateBoth && !!osmSidewalkSeparateBoth[k][v]) {
                    sidewalk = 'separate_both';
                }
                if (k in osmSidewalkSeparate && !!osmSidewalkSeparate[k][v]) {
                    sidewalk = 'separate';
                }
                if (k in osmSidewalkRightOrLeft && !!osmSidewalkRightOrLeft[k][v]) {
                    sidewalk = 'oneside';
                }
                if (k in osmSidewalkSeparateRightOrLeft && !!osmSidewalkSeparateRightOrLeft[k][v]) {
                    sidewalk = 'separate_oneside';
                }
                if (k in osmSidewalkNo && !!osmSidewalkNo[k][v]) {
                    sidewalk = 'no';
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
            if (destination) {
                classes.push('tag-destination');
            }
            if (sidewalk !== 'blank') {
                classes.push('tag-sidewalk-' + sidewalk);
                if (sidewalk_use_sidepath)
                {
                    classes.push('tag-sidewalk-use_sidepath');
                }
                if (cycleway_use_sidepath)
                {
                    classes.push('tag-cycleway-use_sidepath');
                }
            }
            if (cycleway !== 'blank') {
                classes.push('tag-cycleway-' + cycleway);
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
