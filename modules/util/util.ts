import { color as d3_color, type RGBColor } from 'd3';
import { remove as removeDiacritics } from 'diacritics';

import { fixRTLTextForSvg, rtlRegex } from './svg_paths_rtl_fix';

import { t, localizer } from '../core/localizer';
import { utilArrayUnion } from './array';
import { utilDetect } from './detect';
import { geoExtent } from '../geo/extent';
import type { coreGraph } from '../core';
import type { OsmNode } from '../osm/node';


export function utilTagText(entity: iD.OsmEntity): string {
    const obj = (entity && entity.tags) || {};
    return Object.keys(obj)
        .map(k => k + '=' + obj[k])
        .join(', ');
}


export function utilTotalExtent(array: EntityID[] | iD.OsmEntity[], graph: coreGraph): geoExtent {
    const extent = geoExtent();
    let entity : iD.OsmEntity | undefined;
    for (const val of array) {
        entity = typeof val === 'string' ? graph.hasEntity(val) : val;
        if (entity) {
            extent._extend(entity.extent(graph));
        }
    }
    return extent;
}

export type TagDiff = {
    type: '-' | '+';
    key: string;
    oldVal: string;
    newVal: string;
    display: string;
};
export function utilTagDiff(oldTags: Tags, newTags: Tags): TagDiff[] {
    const tagDiff : TagDiff[] = [];
    const keys = utilArrayUnion(Object.keys(oldTags), Object.keys(newTags)).sort();
    keys.forEach(function(k) {
        const oldVal = oldTags[k];
        const newVal = newTags[k];

        if ((oldVal || oldVal === '') && (newVal === undefined || newVal !== oldVal)) {
            tagDiff.push({
                type: '-',
                key: k,
                oldVal: oldVal,
                newVal: newVal,
                display: '- ' + k + '=' + oldVal
            });
        }
        if ((newVal || newVal === '') && (oldVal === undefined || newVal !== oldVal)) {
            tagDiff.push({
                type: '+',
                key: k,
                oldVal: oldVal,
                newVal: newVal,
                display: '+ ' + k + '=' + newVal
            });
        }
    });
    return tagDiff;
}


export function utilEntitySelector(ids: EntityID[]): string {
    return ids.length ? '.' + ids.join(',.') : 'nothing';
}


// returns an selector to select entity ids for:
//  - entityIDs passed in
//  - shallow descendant entityIDs for any of those entities that are relations
export function utilEntityOrMemberSelector(ids: EntityID[], graph: coreGraph) {
    const seen = new Set(ids);
    ids.forEach(collectShallowDescendants);
    return utilEntitySelector(Array.from(seen));

    function collectShallowDescendants(id: EntityID) {
        const entity = graph.hasEntity(id);
        if (!entity || entity.type !== 'relation') return;

        entity.members
            .map(member => member.id)
            .forEach(id => seen.add(id));
    }
}


// returns an selector to select entity ids for:
//  - entityIDs passed in
//  - deep descendant entityIDs for any of those entities that are relations
export function utilEntityOrDeepMemberSelector(ids: EntityID[], graph: coreGraph): string {
    return utilEntitySelector(utilEntityAndDeepMemberIDs(ids, graph));
}


// returns an selector to select entity ids for:
//  - entityIDs passed in
//  - deep descendant entityIDs for any of those entities that are relations
export function utilEntityAndDeepMemberIDs(ids: EntityID[], graph: coreGraph): EntityID[] {
    const seen: Set<EntityID> = new Set();
    ids.forEach(collectDeepDescendants);
    return Array.from(seen);

    function collectDeepDescendants(id: EntityID) {
        if (seen.has(id)) return;
        seen.add(id);

        const entity = graph.hasEntity(id);
        if (!entity || entity.type !== 'relation') return;

        entity.members
            .map(member => member.id)
            .forEach(collectDeepDescendants);   // recurse
    }
}

// returns an selector to select entity ids for:
//  - deep descendant entityIDs for any of those entities that are relations
export function utilDeepMemberSelector(ids: EntityID[], graph: coreGraph, skipMultipolygonMembers: boolean): string {
    const idsSet = new Set(ids);
    const seen: Set<EntityID> = new Set();
    const returners: Set<EntityID> = new Set();
    ids.forEach(collectDeepDescendants);
    return utilEntitySelector(Array.from(returners));

    function collectDeepDescendants(id: EntityID) {
        if (seen.has(id)) return;
        seen.add(id);

        if (!idsSet.has(id)) {
            returners.add(id);
        }

        const entity = graph.hasEntity(id);
        if (!entity || entity.type !== 'relation') return;
        if (skipMultipolygonMembers && entity.isMultipolygon()) return;
        entity.members
            .map(member => member.id)
            .forEach(collectDeepDescendants);   // recurse
    }
}


// Adds or removes highlight styling for the specified entities
export function utilHighlightEntities(ids: EntityID[], highlighted: boolean, context: iD.Context): void {
    context.surface()
        .selectAll(utilEntityOrDeepMemberSelector(ids, context.graph()))
        .classed('highlighted', highlighted);
}


// returns an Array that is the union of:
//  - nodes for any nodeIDs passed in
//  - child nodes of any wayIDs passed in
//  - descendant member and child nodes of relationIDs passed in
export function utilGetAllNodes(ids: EntityID[], graph: coreGraph): OsmNode[] {
    const seen: Set<EntityID> = new Set();
    const nodes: Set<OsmNode> = new Set<OsmNode>();

    ids.forEach(collectNodes);
    return Array.from<OsmNode>(nodes);

    function collectNodes(id: EntityID) {
        if (seen.has(id)) return;
        seen.add(id);

        const entity = graph.hasEntity(id);
        if (!entity) return;

        if (entity.type === 'node') {
            nodes.add(entity as OsmNode);
        } else if (entity.type === 'way') {
            entity.nodes.forEach(collectNodes);
        } else {
            entity.members
                .map(member => member.id)
                .forEach(collectNodes);   // recurse
        }
    }
}

/**
 * @param entity the entity to generate a display name for
 * @param flags a set of flags to tweak the display name output:
 *             - hideNetwork: If true, the `network` tag will not be used
 *                            in the name to prevent it being shown twice
 *                            (see PR #8707#discussion_r712658175)
 *             - hideRef:     If true, the `ref` tag will not be output.
 *             - isMapLabel:  If true, this name is for a label on the map.
 *                            If falsy, it's for a label elsewhere in the UI.
 */
export function utilDisplayName(entity: iD.OsmEntity, flags: {
    hideNetwork?: boolean,
    hideRef?: boolean,
    isMapLabel?: boolean
}): string {
    const name = localizer.expandedLocaleCodes()
        .map(code => entity.tags[`name:${code}`])
        .find(Boolean) || entity.tags.name || '';

    const tags = {
        direction: entity.tags.direction,
        from: entity.tags.from,
        name,
        network: flags?.hideNetwork ? undefined : (entity.tags.cycle_network || entity.tags.network),
        ref: flags?.hideRef ? undefined : entity.tags.ref,
        to: entity.tags.to,
        via: entity.tags.via
    };

    // A right or left-right arrow likely indicates a formulaic “name” as specified by the Public Transport v2 schema.
    // This name format already contains enough details to disambiguate the feature; avoid duplicating these details.
    if (entity.tags.route && entity.tags.name && entity.tags.name.match(/[→⇒↔⇔]|[-=]>/)) {
        return entity.tags.name;
    }

    // Non-routes tend to be labeled in many places besides the relation lists, such as the map, where brevity is important.
    if (!entity.tags.route && name) {
        return name;
    }

    const keyComponents = [];

    if (tags.network) {
        keyComponents.push('network');
    }
    if (tags.ref) {
        keyComponents.push('ref');
    }
    if (tags.name) {
        keyComponents.push('name');
    }

    // Routes may need more disambiguation based on direction or destination
    if (entity.tags.route) {
        if (tags.direction) {
            keyComponents.push('direction');
        } else if (tags.from && tags.to) {
            keyComponents.push('from');
            keyComponents.push('to');
            if (tags.via) {
                keyComponents.push('via');
            }
        }
    }

    if (keyComponents.length) {
        return t('inspector.display_name.' + keyComponents.join('_'), tags);
    }

    const alternativeNameKeys = [
        'addr:housename',
        'alt_name',
        'official_name',
        'loc_name',
        'loc_ref',
        'unsigned_ref',
        'seamark:name',
        'sector:name',
        'lock_name'
    ];

    if (entity.tags.highway === 'milestone' || entity.tags.railway === 'milestone') {
        // distance & railway:position are only valid as names when used on a milestone
        alternativeNameKeys.push('distance', 'railway:position');
    }

    // if there's still no name found, try some other name-like tags
    for (const key of alternativeNameKeys) {
        if (key in entity.tags) {
            return entity.tags[key];
        }
    }

    // as a last resort, use the street address as a name.
    const unit = entity.tags['addr:unit'];
    const housenumber = entity.tags['addr:housenumber'];
    const streetOrPlace = entity.tags['addr:street'] || entity.tags['addr:place'];

    if (!flags?.isMapLabel && unit && housenumber && streetOrPlace) {
        return t('inspector.display_name_addr_with_unit', {
            unit,
            housenumber,
            streetOrPlace,
        });
    }

    if (!flags?.isMapLabel && housenumber && streetOrPlace) {
        return t('inspector.display_name_addr', {
            housenumber,
            streetOrPlace,
        });
    }

    // the housenumber can always be used, regardless of isMapLabel
    if (housenumber) return housenumber;

    // no match found
    return '';
}


export function utilDisplayNameForPath(entity: iD.OsmEntity): string {
    let name = utilDisplayName(entity, { isMapLabel: true });
    const isFirefox = utilDetect().browser.toLowerCase().indexOf('firefox') > -1;
    const isNewChromium = Number(utilDetect().version.split('.')[0]) >= 96.0;

    if (!isFirefox && !isNewChromium && name && rtlRegex.test(name)) {
        name = fixRTLTextForSvg(name);
    }

    return name;
}


export function utilDisplayType(id: EntityID): string {
    switch (id.charAt(0)) {
        case 'n': return t('inspector.node');
        case 'w': return t('inspector.way');
        case 'r': return t('inspector.relation');
        default: throw new Error('entity id with invalid or missing type');
    }
}


export function utilEntityRoot(entityType: 'node' | 'way' | 'relation'): 'n' | 'w' | 'r' {
    switch (entityType) {
        case 'node': return 'n';
        case 'way': return 'w';
        case 'relation': return 'r';
    }
}


// Returns a single object containing the tags of all the given entities.
// Example:
// {
//   highway: 'service',
//   service: 'parking_aisle'
// }
//           +
// {
//   highway: 'service',
//   service: 'driveway',
//   width: '3'
// }
//           =
// {
//   highway: 'service',
//   service: [ 'driveway', 'parking_aisle' ],
//   width: [ '3', undefined ]
// }
export function utilCombinedTags(entityIDs: EntityID[], graph: coreGraph): TagsMulti {
    const tags: TagsMulti = {};
    const tagCounts: { [key: TagKey]: number } = {};
    const allKeys: Set<TagKey> = new Set();
    const allTags: Tags[] = [];

    const entities = entityIDs
        .map(entityID => graph.hasEntity(entityID))
        .filter(x => x !== undefined);


    // gather the aggregate keys
    for (const entity of entities) {
        const keys = Object.keys(entity.tags).filter(Boolean);
        keys.forEach(function(key) {
            allKeys.add(key);
        });
    }

    for (const entity of entities) {
        allTags.push(entity.tags);

        for (const key of allKeys) {
            const value = entity.tags[key]; // purposely allow `undefined`

            if (!tags.hasOwnProperty(key)) {
                // first value, set as raw
                tags[key] = value;
            } else {
                if (!Array.isArray(tags[key])) {
                    if (tags[key] !== value) {
                        // first alternate value, replace single value with array
                        tags[key] = [tags[key], value];
                    }
                } else { // type is array
                    if (tags[key].indexOf(value) === -1) {
                        // subsequent alternate value, add to array
                        tags[key].push(value);
                    }
                }
            }

            const tagHash = key + '=' + value;
            if (!tagCounts[tagHash]) tagCounts[tagHash] = 0;
            tagCounts[tagHash] += 1;
        }
    }

    for (const key in tags) {
        if (!Array.isArray(tags[key])) continue;

        // sort values by frequency then alphabetically
        tags[key] = tags[key].sort(function(val1, val2) {
            const count2 = tagCounts[key + '=' + val2];
            const count1 = tagCounts[key + '=' + val1];
            if (count2 !== count1) {
                return count2 - count1;
            }
            if (val2 && val1) {
                return val1.localeCompare(val2);
            }
            return val1 ? 1 : -1;
        });
    }

    return Object.defineProperty(tags, Symbol.for('allTags'), { enumerable: false, value: allTags });
}


export function utilStringQs(str: string): {[k: string]: string} {
    str = str.replace(/^[#?]{0,2}/, ''); // advance past any leading '?' or '#' characters
    return Object.fromEntries(new URLSearchParams(str));
}


export function utilQsString(obj: {[k: string]: string}, softEncode: boolean) {
    let str = new URLSearchParams(obj).toString();
    if (softEncode) {
        // for better readability of URL hashes: optionally
        // leave some special characters unescaped
        //   "/" used in map state
        //   ":", ",", {" and "}" used in background param
        str = str.replace(/(%2F|%3A|%2C|%7B|%7D)/g, decodeURIComponent);
    }
    return str;
}


export function utilPrefixDOMProperty(property: string): string | false {
    const prefixes = ['webkit', 'ms', 'moz', 'o'];
    let i = -1;
    const n = prefixes.length;
    const s = document.body;

    if (property in s) return property;

    property = property.slice(0, 1).toUpperCase() + property.slice(1);

    while (++i < n) {
        if (prefixes[i] + property in s) {
            return prefixes[i] + property;
        }
    }

    return false;
}


export function utilPrefixCSSProperty(property: string): string | false {
    const prefixes = ['webkit', 'ms', 'Moz', 'O'];
    let i = -1;
    const n = prefixes.length;
    const s = document.body.style;

    if (property.toLowerCase() in s) {
        return property.toLowerCase();
    }

    while (++i < n) {
        if (prefixes[i] + property in s) {
            return '-' + prefixes[i].toLowerCase() + property.replace(/([A-Z])/g, '-$1').toLowerCase();
        }
    }

    return false;
}


let transformProperty;
export function utilSetTransform(el: d3.Selection, x: number, y: number, scale: number): d3.Selection {
    transformProperty ||= utilPrefixCSSProperty('Transform');
    const prop = transformProperty;
    const translate = utilDetect().opera ? 'translate('   + x + 'px,' + y + 'px)'
        : 'translate3d(' + x + 'px,' + y + 'px,0)';
    return el.style(prop, translate + (scale ? ' scale(' + scale + ')' : ''));
}


// Calculates Levenshtein distance between two strings
// see:  https://en.wikipedia.org/wiki/Levenshtein_distance
// first converts the strings to lowercase and replaces diacritic marks with ascii equivalents.
//
// if options.substring is true, it instead calculates the minimal Levenshtein distance between
// the string a and any substring of b
// see: https://en.wikipedia.org/wiki/Approximate_string_matching#Problem_formulation_and_algorithms
export function utilEditDistance(a: string, b: string, options?: {
    substring?: boolean
}): number {
    a = removeDiacritics(a.toLowerCase());
    b = removeDiacritics(b.toLowerCase());
    if (a.length === 0) return options?.substring ? 0 : b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = options?.substring ? [0] : [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i-1) === a.charAt(j-1)) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                    Math.min(matrix[i][j-1] + 1, // insertion
                    matrix[i-1][j] + 1)); // deletion
            }
        }
    }
    if (options?.substring) {
        return Math.min(...matrix.map(r => r[a.length]));
    }
    return matrix[b.length][a.length];
}


// a d3.mouse-alike which
// 1. Only works on HTML elements, not SVG
// 2. Does not cause style recalculation
export function utilFastMouse(container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    const rectLeft = rect.left;
    const rectTop = rect.top;
    const clientLeft = +container.clientLeft;
    const clientTop = +container.clientTop;
    return function(e: MouseEvent) {
        return [
            e.clientX - rectLeft - clientLeft,
            e.clientY - rectTop - clientTop
        ];
    };
}


// wraps an index to an interval [0..length-1]
export function utilWrap(index: number, length: number): number {
    if (index < 0) {
        index += Math.ceil(-index/length)*length;
    }
    return index % length;
}


/**
 * a replacement for functor
 *
 * @param value any value
 * @returns a function that returns that value or the value if it's a function
 */
export function utilFunctor<T>(value: T | (() => T)): () => T {
    if (typeof value === 'function') return value as (() => T);
    return () => value;
}


export function utilNoAuto(selection: d3.Selection): d3.Selection {
    const isText = (selection.size() && selection.node().tagName.toLowerCase() === 'textarea');

    return selection
        // assign 'new-password' even for non-password fields to prevent browsers (Chrome) ignoring 'off'
        .attr('autocomplete', 'new-password')
        .attr('autocorrect', 'off')
        .attr('autocapitalize', 'off')
        .attr('data-1p-ignore', 'true')  // 1Password
        .attr('data-bwignore', 'true')   // Bitwarden
        .attr('data-form-type', 'other') // Dashlane
        .attr('data-lpignore', 'true')   // LastPass
        .attr('spellcheck', isText ? 'true' : 'false');
}


// https://stackoverflow.com/questions/194846/is-there-any-kind-of-hash-code-function-in-javascript
// https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
export function utilHashcode(str: string): number {
    let hash = 0;
    if (str.length === 0) {
        return hash;
    }
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

// Returns version of `str` with all runs of special characters replaced by `_`;
// suitable for HTML ids, classes, selectors, etc.
export function utilSafeClassName(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

// Returns string based on `val` that is highly unlikely to collide with an id
// used previously or that's present elsewhere in the document. Useful for preventing
// browser-provided autofills or when embedding iD on pages with unknown elements.
export function utilUniqueDomId(val: any): string {
    return 'ideditor-' + utilSafeClassName(val.toString()) + '-' + new Date().getTime().toString();
}

// Returns the length of `str` in unicode characters. This can be less than
// `String.length()` since a single unicode character can be composed of multiple
// JavaScript UTF-16 code units.
export function utilUnicodeCharsCount(str: string): number {
    // Native ES2015 implementations of `Array.from` split strings into unicode characters
    return Array.from(str).length;
}

// Returns a new string representing `str` cut from its start to `limit` length
// in unicode characters. Note that this runs the risk of splitting graphemes.
export function utilUnicodeCharsTruncated(str: string, limit: number): string {
    return Array.from(str).slice(0, limit).join('');
}

function toNumericID(id: EntityID): number {
    const match = id.match(/^[cnwr](-?\d+)$/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return NaN;
}

function compareNumericIDs(left: number, right: number): number {
    if (isNaN(left) && isNaN(right)) return -1;
    if (isNaN(left)) return 1;
    if (isNaN(right)) return -1;
    if (Math.sign(left) !== Math.sign(right)) return -Math.sign(left);
    if (Math.sign(left) < 0) return Math.sign(right - left);
    return Math.sign(left - right);
}

// Returns -1 if the first parameter ID is older than the second,
// 1 if the second parameter is older, 0 if they are the same.
// If both IDs are test IDs, the function returns -1.
export function utilCompareIDs(left: EntityID, right: EntityID): number {
    return compareNumericIDs(toNumericID(left), toNumericID(right));
}

// Returns the chronologically oldest ID in the list.
// Database IDs (with positive numbers) before editor ones (with negative numbers).
// Among each category, the closest number to 0 is the oldest.
// Test IDs (any string that does not conform to OSM's ID scheme) are taken last.
export function utilOldestID(ids: EntityID[]): EntityID | undefined {
    if (ids.length === 0) {
        return undefined;
    }

    let oldestIDIndex = 0;
    let oldestID = toNumericID(ids[0]);

    for (let i = 1; i < ids.length; i++) {
        const num = toNumericID(ids[i]);

        if (compareNumericIDs(oldestID, num) === 1) {
            oldestIDIndex = i;
            oldestID = num;
        }
    }

    return ids[oldestIDIndex];
}

// returns a normalized and truncated string to `maxChars` utf-8 characters
export function utilCleanOsmString(val: any, maxChars: number) {
    // be lenient with input
    if (val === undefined || val === null) {
      val = '';
    } else {
      val = val.toString();
    }

    // remove whitespace
    val = val.trim();

    // use the canonical form of the string
    if (val.normalize) val = val.normalize('NFC');

    // trim to the number of allowed characters
    return utilUnicodeCharsTruncated(val, maxChars);
}

// https://stackoverflow.com/a/70360753/1627467
export function getLuma(color: string): number {
    const {r, g, b} = d3_color(color) as RGBColor;
    return 0.2999 * r + 0.587 * g + 0.114 * b;
}

/** @param {XMLHttpRequestBodyInit} input */
export function utilGzip(input: string) {
    // check if compression is supported natively
    if (!globalThis.CompressionStream) return undefined;

    try {
        const stream = new Response(input).body!.pipeThrough(
            new CompressionStream('gzip')
        );
        return new Response(stream).blob();
     } catch {
        // if an error is thrown, it means the browser supports
        // CompressionStream but not the specific algorithm.
        return undefined;
    }
}

export function utilIsValidURL(url: string, strict = false): boolean {
    try {
        // First try strict WHATWG parsing
        const link = new URL(url);
        return link.protocol.startsWith('http');
    } catch {
        if (strict) return false;
        // Fallback: accept if it looks like a valid scheme://something, even if semicolons are present
        return /^https?:\/\/\S+$/i.test(url);
    }
}
