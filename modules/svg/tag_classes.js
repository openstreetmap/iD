import { select as d3_select } from 'd3-selection';
import { osmPathHighwayTagValues, osmPavedTags, osmSemipavedTags, osmLifecyclePrefixes } from '../osm/tags';
import { appendThemeTagClasses } from '../core/themes';


export function svgTagClasses() {
    const primaries = [
        'building', 'highway', 'railway', 'waterway', 'aeroway', 'aerialway',
        'piste:type', 'boundary', 'power', 'amenity', 'natural', 'landuse',
        'leisure', 'military', 'place', 'man_made', 'route', 'attraction',
        'roller_coaster', 'building:part', 'indoor', 'climbing'
    ];
    const statuses = Object.keys(osmLifecyclePrefixes);
    const secondaries = [
        'oneway', 'bridge', 'tunnel', 'barrier',
        'surface', 'tracktype', 'footway', 'crossing', 'service', 'sport',
        'public_transport', 'location', 'parking', 'golf', 'type', 'leisure',
        'man_made', 'indoor', 'construction', 'proposed', 'bicycle', 'foot'
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
        let primary, status;

        // in some situations we want to render perimeter strokes a certain way
        let overrideGeometry;
        if (/\bstroke\b/.test(value)) {
            if (!!t.barrier && t.barrier !== 'no') {
                overrideGeometry = 'line';
            }
        }

        // preserve base classes (nothing with `tag-`)
        const classes = value.trim().split(/\s+/)
            .filter(klass => klass.length && !/^tag-/.test(klass))
            .map(klass => (klass === 'line' || klass === 'area')
                // special overrides for some perimeter strokes
                ? (overrideGeometry || klass)
                : klass);

        // pick at most one primary classification tag..
        for (let k of primaries) {
            const v = t[k];
            k = k.replace(':', '_');
            if (!v || v === 'no') continue;

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
            for (const prefix of statuses) {
                for (const key of primaries) {
                    const k = prefix + ':' + key;  // e.g. `demolished:building=yes`
                    const v = t[k];
                    if (!v || v === 'no') continue;

                    status = prefix;
                    break;
                }
            }
        }

        // add at most one status tag, only if relates to primary tag..
        if (!status) {
            for (const k of statuses) {
                const v = t[k];
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
        for (const k of secondaries) {
            const v = t[k];
            if (!v || v === 'no' || k === primary) continue;
            classes.push('tag-' + k);
            classes.push('tag-' + k + '-' + v);
        }

        // For highways, look for surface tagging..
        if ((primary === 'highway' && !osmPathHighwayTagValues[t.highway]) || primary === 'aeroway') {
            if (t.highway !== 'track') { // tracks are styled by grade and not surface
                let surface = 'paved';
                for (const k in t) {
                    const v = t[k];
                    if (k in osmPavedTags) {
                        surface = osmPavedTags[k][v] ? 'paved' : 'unpaved';
                    }
                    if (k in osmSemipavedTags && !!osmSemipavedTags[k][v]) {
                        surface = 'semipaved';
                    }
                }
                classes.push('tag-' + surface);
            } else {
                // Tracks with no `tracktype` for default/unknown grade-based styling
                if (t.highway === 'track' &&
                    (!t.tracktype || (t.tracktype !== 'grade1' && t.tracktype !== 'grade2' && t.tracktype !== 'grade3' && t.tracktype !== 'grade4' && t.tracktype !== 'grade5'))) {
                    classes.push('tag-ungraded');
                }
            }
        }

        // If this is a wikidata-tagged item, add a class for that..
        const qid = (
            t.wikidata ||
            t['flag:wikidata'] ||
            t['brand:wikidata'] ||
            t['network:wikidata'] ||
            t['operator:wikidata']
        );

        if (qid) {
            classes.push('tag-wikidata');
        }

        // add classes for the OSM keys the active theme's CSS styles
        appendThemeTagClasses(classes, t);

        // ensure that classes for tags keys/values with special characters like spaces
        // are not added to the DOM, because it can cause bizarre issues (#9448)
        return classes
            .filter(klass => /^[-_a-z0-9]+$/.test(klass))
            .join(' ')
            .trim();
    };


    tagClasses.tags = function(val) {
        if (!arguments.length) return _tags;
        _tags = val;
        return tagClasses;
    };

    return tagClasses;
}
