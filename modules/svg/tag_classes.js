import { select as d3_select } from 'd3-selection';
import { osmPathHighwayTagValues, osmPavedTags, osmSemipavedTags, osmLifecyclePrefixes } from '../osm/tags';


export function svgTagClasses() {
    var primaries = [
        'building', 'highway', 'railway', 'waterway', 'aeroway', 'aerialway',
        'piste:type', 'boundary', 'power', 'amenity', 'natural', 'landuse',
        'leisure', 'military', 'place', 'man_made', 'route', 'attraction',
        'building:part', 'indoor'
    ];
    var statuses = Object.keys(osmLifecyclePrefixes);
    var secondaries = [
        'oneway', 'bridge', 'tunnel', 'embankment', 'cutting', 'barrier',
        'surface', 'tracktype', 'footway', 'crossing', 'service', 'sport',
        'public_transport', 'location', 'parking', 'golf', 'type', 'leisure',
        'man_made', 'indoor', 'construction', 'proposed'
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
                } else if (primary && primary === v) {  // e.g. `railway=rail + abandoned=railway`
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

        // For highways, look for surface tagging..
        if ((primary === 'highway' && !osmPathHighwayTagValues[t.highway]) || primary === 'aeroway') {
            var surface = t.highway === 'track' ? 'unpaved' : 'paved';
            for (k in t) {
                v = t[k];
                if (k in osmPavedTags) {
                    surface = osmPavedTags[k][v] ? 'paved' : 'unpaved';
                }
                if (k in osmSemipavedTags && !!osmSemipavedTags[k][v]) {
                    surface = 'semipaved';
                }
            }
            classes.push('tag-' + surface);
        }

        // If this is a wikidata-tagged item, add a class for that..
        var qid = (
            t.wikidata ||
            t['flag:wikidata'] ||
            t['brand:wikidata'] ||
            t['network:wikidata'] ||
            t['operator:wikidata']
        );

        if (qid) {
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
