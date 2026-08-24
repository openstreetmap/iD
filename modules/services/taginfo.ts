import { debounce } from 'es-toolkit';

import { json as d3_json } from 'd3-fetch';

import { utilObjectOmit, utilQsString } from '../util';
import { localizer } from '../core/localizer';
import { allowUpperCaseTagValues } from '../osm/tags';

import { taginfoApiUrl } from '../../config/id.js';

var apibase = taginfoApiUrl;
let _inflight: { [url: string]: AbortController } = {};
let _popularKeys: { [key: TagKey]: boolean } = {};

// manually exclude some additional keys – #5377, #7485, #10287, #11733
// these will be returned by keys(), but taginfo will not be queried for values() requests
var _extraExcludedKeys = /^(addr:.+|postal_code|via|((int_|loc_|nat_|official_|old_|ref_|reg_|short_|full_|sorting_|alt_|artist_|long_|bridge:|tunnel:)?name(:left|:right)?(:[a-z]+)?))$/;

var _extraExcludedKeyNames = /^(hashtags?|created_by)$/;

let _taginfoCache: { [url: string]: unknown[] } = {};

export interface TaginfoKey {
    key: TagKey;
    description?: string;

    count_all: number;
    count_all_fraction: number;
    count_nodes: number;
    count_nodes_fraction: number;
    count_ways: number;
    count_ways_fraction: number;
    count_relations: number;
    count_relations_fraction: number;

    values_all: number;
    users_all: number;
    in_wiki: boolean,
    projects: number;
}
export interface TaginfoTag {
    value: TagValue,
    count: number,
    fraction: number;
    in_wiki: boolean;
    description?: string;
    desclang?: string;
    descdir?: string;
}
export interface TaginfoRole {
    role: string;
    count_node_members_fraction: number;
    count_way_members_fraction: number;
    count_relation_members_fraction: number;
}

export type Params = {
    debounce?: boolean;
    rp?: number;
    query?: string;
    geometry?: Geometry
    filter?: Filter;
    sortname?: string;
    sortorder?: 'asc' | 'desc';
    page?: number;
    lang?: string;
}

interface ValueTitle {
    value: string;
    title: string;
}

var tag_sorts = {
    point: 'count_nodes',
    vertex: 'count_nodes',
    area: 'count_ways',
    line: 'count_ways'
};
var tag_sort_members = {
    point: 'count_node_members',
    vertex: 'count_node_members',
    area: 'count_way_members',
    line: 'count_way_members',
    relation: 'count_relation_members'
};
var tag_filters = {
    point: 'nodes',
    vertex: 'nodes',
    area: 'ways',
    line: 'ways'
} as const;
type Filter = typeof tag_filters[keyof typeof tag_filters];

var tag_members_fractions = {
    point: 'count_node_members_fraction',
    vertex: 'count_node_members_fraction',
    area: 'count_way_members_fraction',
    line: 'count_way_members_fraction',
    relation: 'count_relation_members_fraction'
} as const;
type Geometry = keyof typeof tag_members_fractions;


function sets<T extends Params>(params: T, n: keyof T, o: Partial<Record<Geometry, string>>): T {
    if (params.geometry && o[params.geometry]) {
        params[n] = o[params.geometry] as never;
    }
    return params;
}


function setFilter<T extends Params>(params: T): T {
    return sets(params, 'filter', tag_filters);
}


function setSort<T extends Params>(params: T): T {
    return sets(params, 'sortname', tag_sorts);
}


function setSortMembers<T extends Params>(params: T): T {
    return sets(params, 'sortname', tag_sort_members);
}


function clean<T extends Params>(params: T): T {
    return utilObjectOmit(params, ['geometry', 'debounce']) as T;
}


function filterKeys(type: Filter | undefined) {
    const count_type = type ? `count_${type}` as const : 'count_all';
    return function(d: TaginfoKey) {
        return Number(d[count_type]) > 2500 || d.in_wiki;
    };
}


function filterMultikeys(prefix: string) {
    return function(d: TaginfoKey) {
        // d.key begins with prefix, and d.key contains no additional ':'s
        var re = new RegExp('^' + prefix + '(.*)$', 'i');
        var matches = d.key.match(re) || [];
        return (matches.length === 2 && matches[1].indexOf(':') === -1);
    };
}


function filterValues(allowUpperCase: boolean, key: TagKey) {
    return function(d: TaginfoTag) {
        if (d.value.match(/[;,]/) !== null) return false;  // exclude some punctuation
        if (!allowUpperCase &&
            !(key === 'type' && d.value === 'associatedStreet') &&
            d.value.match(/[A-Z*]/) !== null) return false;  // exclude uppercase letters
        return d.count > 100; // exclude rare tags
    };
}


function filterRoles(geometry: Geometry) {
    return function(d: TaginfoRole) {
        if (d.role === '') return false; // exclude empty role
        if (d.role.match(/[A-Z*;,]/) !== null) return false;  // exclude uppercase letters and some punctuation
        return Number(d[tag_members_fractions[geometry]]) > 0.0;
    };
}

function valKey(d: TaginfoKey): ValueTitle {
    return {
        value: d.key,
        title: d.key
    };
}


function valKeyDescription(d: TaginfoTag): ValueTitle {
    var obj = {
        value: d.value,
        title: d.description || d.value
    };
    return obj;
}


function roleKey(d: TaginfoRole): ValueTitle {
    return {
        value: d.role,
        title: d.role
    };
}


// sort keys with ':' lower than keys without ':'
function sortKeys(a: TaginfoKey, b: TaginfoKey) {
    return (a.key.indexOf(':') === -1 && b.key.indexOf(':') !== -1) ? -1
        : (a.key.indexOf(':') !== -1 && b.key.indexOf(':') === -1) ? 1
        : 0;
}


var debouncedRequest = debounce(request, 300, { edges: ['trailing'] }) as typeof request;

function request<T, C>(url: string, params: Params, exactMatch: boolean, callback: Callback<C>, loaded?: Callback<T>) {
    if (_inflight[url]) return;

    if (checkCache(url, params, exactMatch, callback)) return;

    var controller = new AbortController();
    _inflight[url] = controller;

    d3_json(url, { signal: controller.signal })
        .then(function(result) {
            delete _inflight[url];
            if (loaded) loaded(null, result as T);
        })
        .catch(function(err) {
            delete _inflight[url];
            if (err.name === 'AbortError') return;
            if (loaded) loaded(err);
        });
}

function checkCache(url: string, params: Params, exactMatch: boolean, callback: Callback<any>) {
    var rp = params.rp || 25;
    var testQuery = params.query || '';
    var testUrl = url;

    do {
        var hit = _taginfoCache[testUrl];

        // exact match, or shorter match yielding fewer than max results (rp)
        if (hit && (url === testUrl || hit.length < rp)) {
            callback(null, hit);
            return true;
        }

        // don't try to shorten the query
        if (exactMatch || !testQuery.length) return false;

        // do shorten the query to see if we already have a cached result
        // that has returned fewer than max results (rp)
        testQuery = testQuery.slice(0, -1);
        testUrl = url.replace(/&query=(.*?)&/, '&query=' + testQuery + '&');
    } while (testQuery.length >= 0);

    return false;
}


export default {

    init: function() {
        _inflight = {};
        _taginfoCache = {};
        _popularKeys = {};

        // Fetch popular keys.  We'll exclude these from `values`
        // lookups because they stress taginfo, and they aren't likely
        // to yield meaningful autocomplete results.. see #3955
        var params: Params = {
            rp: 100,
            sortname: 'values_all',
            sortorder: 'desc',
            page: 1,
            debounce: false,
            lang: localizer.languageCode()
        };
        this.keys(params, function(err, data) {
            if (err) return;
            data!.forEach(function(d) {
                if (d.value === 'opening_hours') return;  // exception
                _popularKeys[d.value] = true;
            });
        });
    },


    reset: function() {
        Object.values(_inflight).forEach(function(controller) { controller.abort(); });
        _inflight = {};
    },


    keys: function(params: Params, callback: Callback<ValueTitle[]>) {
        var doRequest = params.debounce ? debouncedRequest : request;
        params = clean(setSort(params));
        params = Object.assign({
            rp: 10,
            sortname: 'count_all',
            sortorder: 'desc',
            page: 1,
            lang: localizer.languageCode()
        }, params);

        var url = apibase + 'keys/all?' + utilQsString(params);
        doRequest<{ data: TaginfoKey[] }, ValueTitle[]>(url, params, false, callback, function(err, d) {
            if (err) {
                callback(err);
            } else {
                var f = filterKeys(params.filter);
                var result = d!.data.filter(f).filter(d => !_extraExcludedKeyNames.test(d.key)).sort(sortKeys).map(valKey);
                _taginfoCache[url] = result;
                callback(null, result);
            }
        });
    },


    multikeys: function(params: Params & { query: string; key?: TagKey }, callback: Callback<ValueTitle[]>) {
        var doRequest = params.debounce ? debouncedRequest : request;
        params = clean(setSort(params));
        params = Object.assign({
            rp: 25,
            sortname: 'count_all',
            sortorder: 'desc',
            page: 1,
            lang: localizer.languageCode()
        }, params);

        var prefix = params.query;
        var url = apibase + 'keys/all?' + utilQsString(params);
        doRequest<{ data: TaginfoKey[] }, ValueTitle[]>(url, params, true, callback, function(err, d) {
            if (err) {
                callback(err);
            } else {
                var f = filterMultikeys(prefix);
                var result = d!.data.filter(f).map(valKey);
                _taginfoCache[url] = result;
                callback(null, result);
            }
        });
    },


    values: function(params: Params & { key: TagKey }, callback: Callback<ValueTitle[]>) {
        // Exclude popular keys from values lookups.. see #3955
        var key = params.key;
        if (key && _popularKeys[key] === true || _extraExcludedKeys.test(key)) {
            callback(null, []);
            return;
        }

        var doRequest = params.debounce ? debouncedRequest : request;
        params = clean(setSort(setFilter(params)));
        params = Object.assign({
            rp: 25,
            sortname: 'count_all',
            sortorder: 'desc',
            page: 1,
            lang: localizer.languageCode()
        }, params);

        var url = apibase + 'key/values?' + utilQsString(params);
        doRequest<{ data: TaginfoTag[] }, ValueTitle[]>(url, params, false, callback, function(err, d) {
            if (err) {
                callback(err);
            } else {
                // In most cases we prefer taginfo value results with lowercase letters.
                // A few OSM keys expect values to contain uppercase values (see #3377).
                // This is not an exhaustive list (e.g. `name` also has uppercase values)
                // but these are the fields where taginfo value lookup is most useful.
                var allowUpperCase = allowUpperCaseTagValues.test(params.key);
                var f = filterValues(allowUpperCase, params.key);

                var result = d!.data.filter(f).map(valKeyDescription);
                _taginfoCache[url] = result;
                callback(null, result);
            }
        });
    },


    roles: function(params: Params & { geometry: Geometry; rtype?: string }, callback: Callback<ValueTitle[]>) {
        var doRequest = params.debounce ? debouncedRequest : request;
        var geometry = params.geometry!;
        params = clean(setSortMembers(params));
        params = Object.assign({
            rp: 25,
            sortname: 'count_all_members',
            sortorder: 'desc',
            page: 1,
            lang: localizer.languageCode()
        }, params);

        var url = apibase + 'relation/roles?' + utilQsString(params);
        doRequest<{ data: TaginfoRole[] }, ValueTitle[]>(url, params, true, callback, function(err, d) {
            if (err) {
                callback(err);
            } else {
                var f = filterRoles(geometry);
                var result = d!.data.filter(f).map(roleKey);
                _taginfoCache[url] = result;
                callback(null, result);
            }
        });
    },


    docs: function(params: Params & { key?: TagKey; value?: string; rtype?: string }, callback: Callback<unknown[]>) {
        var doRequest = params.debounce ? debouncedRequest : request;
        params = clean(setSort(params));

        var path = 'key/wiki_pages?';
        if (params.value) {
            path = 'tag/wiki_pages?';
        } else if (params.rtype) {
            path = 'relation/wiki_pages?';
        }

        var url = apibase + path + utilQsString(params);
        doRequest<{ data: unknown[] }, unknown[]>(url, params, true, callback, function(err, d) {
            if (err) {
                callback(err);
            } else {
                _taginfoCache[url] = d!.data;
                callback(null, d!.data);
            }
        });
    },
};
