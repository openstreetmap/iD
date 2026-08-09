import type { Geometry } from '@openstreetmap/id-tagging-schema';
import { select as d3_select } from 'd3-selection';
import type { coreGraph } from '../core';
import { osmIdManager } from '../osm';
import { osmPathHighwayTagValues, osmPavedTags, osmSemipavedTags, osmLifecyclePrefixes } from '../osm/tags';

export type TagGetter<T> = (entity: T) => Tags;

// Memoize getClassesString() results across redraws: with tens of thousands of
// elements re-joined on every full redraw, recomputing the class string for
// each one dominates the redraw time. The memo is reset only when the graph
// object changes identity (edits create a new graph object). Tile-merge
// rebases mutate the graph in place and do NOT reset the memo: that is safe
// because rebase only adds entities absent from the base graph, so the tags
// of entities already in the graph never change on a merge (see coreGraph.rebase).
let _classMemo = new Map<string, string>();
let _classMemoGraph: coreGraph | undefined;
let _instanceId = 0;

export function svgTagClasses<T>() {
    const primaries = [
        'building', 'highway', 'railway', 'waterway', 'aeroway', 'aerialway',
        'piste:type', 'boundary', 'power', 'amenity', 'natural', 'landuse',
        'leisure', 'military', 'place', 'man_made', 'route', 'attraction',
        'roller_coaster', 'building:part', 'indoor', 'climbing', 'cemetery'
    ];
    const statuses: string[] = Object.keys(osmLifecyclePrefixes);
    const secondaries = [
        'oneway', 'bridge', 'tunnel', 'barrier',
        'surface', 'tracktype', 'footway', 'crossing', 'service', 'sport',
        'public_transport', 'location', 'parking', 'golf', 'type', 'leisure',
        'man_made', 'indoor', 'construction', 'proposed', 'bicycle', 'foot'
    ];

    // this function is the default callback, but it can be overridden
    var _tags: TagGetter<any> = function(entity) { return entity.tags; };
    var _graph: coreGraph | undefined;
    const _id = String(++_instanceId);

    // Optional extra memo key component. Non-entity datums (e.g. midpoints)
    // have version-less osmIdManager.key()s (`id + 'v0'`), so the memo alone
    // cannot tell when the classes input changed (e.g. a midpoint whose
    // parent way was switched without the graph changing). Callers with such
    // datums must include whatever identifies the tags source - for
    // midpoints, the parent way's key.
    let _keyExt: ((entity: T) => string) | undefined;


    const tagClasses = function(selection: d3.Selection<SVGGElement>) {
        if (_graph !== _classMemoGraph) {
            _classMemo = new Map();
            _classMemoGraph = _graph;
        }
        selection.each(function tagClassesEach(entity) {
            var value: any = this.className;

            if (value.baseVal !== undefined) {
                value = value.baseVal;
            }

            var key = osmIdManager.key(entity) + '|' + value + '|' + _id
                + (_keyExt ? '|' + _keyExt(entity) : '');

            var computed = _classMemo.get(key);
            if (computed === undefined) {
                computed = tagClasses.getClassesString(_tags(entity), value);
                _classMemo.set(key, computed);
            }

            if (computed !== value) {
                d3_select(this).attr('class', computed);
            }
        });
    };


    function graph(): coreGraph | undefined;
    function graph(val: coreGraph | undefined): typeof tagClasses;
    function graph(val?: coreGraph | undefined): typeof tagClasses | coreGraph | undefined {
        if (!arguments.length) return _graph;
        _graph = val;
        return tagClasses;
    };
    tagClasses.graph = graph;


    function keyExt(fn: ((entity: T) => string) | undefined): typeof tagClasses {
        _keyExt = fn;
        return tagClasses;
    };
    tagClasses.keyExt = keyExt;


    tagClasses.getClassesString = function(t: Tags, value: string) {
        let primary, status;

        // in some situations we want to render perimeter strokes a certain way
        let overrideGeometry: Geometry;
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

        // ensure that classes for tags keys/values with special characters like spaces
        // are not added to the DOM, because it can cause bizarre issues (#9448)
        return classes
            .filter(klass => /^[-_a-z0-9]+$/.test(klass))
            .join(' ')
            .trim();
    };


    function tags(): TagGetter<T>
    function tags(val: TagGetter<T>): typeof tagClasses;
    function tags(val?: TagGetter<T>): typeof tagClasses | TagGetter<T> {
        if (!arguments.length) return _tags;
        _tags = val!;
        return tagClasses;
    };
    tagClasses.tags = tags;

    return tagClasses;
}
