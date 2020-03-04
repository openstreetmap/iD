import _debounce from 'lodash-es/debounce';

import { json as d3_json } from 'd3-fetch';

import { utilObjectOmit, utilQsString } from '../util';
import { currentLocale } from '../util/locale';


var apibase = 'https://taginfo.openstreetmap.org/api/4/';
var _inflight = {};
var _popularKeys = {};
var _taginfoCache = {};

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
};
var tag_members_fractions = {
    point: 'count_node_members_fraction',
    vertex: 'count_node_members_fraction',
    area: 'count_way_members_fraction',
    line: 'count_way_members_fraction',
    relation: 'count_relation_members_fraction'
};


function sets(params, n, o) {
    if (params.geometry && o[params.geometry]) {
        params[n] = o[params.geometry];
    }
    return params;
}


function setFilter(params) {
    return sets(params, 'filter', tag_filters);
}


function setSort(params) {
    return sets(params, 'sortname', tag_sorts);
}


function setSortMembers(params) {
    return sets(params, 'sortname', tag_sort_members);
}


function clean(params) {
    return utilObjectOmit(params, ['geometry', 'debounce']);
}


function filterKeys(type) {
    var count_type = type ? 'count_' + type : 'count_all';
    return function(d) {
        return parseFloat(d[count_type]) > 2500 || d.in_wiki;
    };
}


function filterMultikeys(prefix) {
    return function(d) {
        // d.key begins with prefix, and d.key contains no additional ':'s
        var re = new RegExp('^' + prefix + '(.*)$');
        var matches = d.key.match(re) || [];
        return (matches.length === 2 && matches[1].indexOf(':') === -1);
    };
}


function filterValues(allowUpperCase) {
    return function(d) {
        if (d.value.match(/[;,]/) !== null) return false;  // exclude some punctuation
        if (!allowUpperCase && d.value.match(/[A-Z*]/) !== null) return false;  // exclude uppercase letters
        return parseFloat(d.fraction) > 0.0;
    };
}


function filterRoles(geometry) {
    return function(d) {
        if (d.role === '') return false; // exclude empty role
        if (d.role.match(/[A-Z*;,]/) !== null) return false;  // exclude uppercase letters and some punctuation
        return parseFloat(d[tag_members_fractions[geometry]]) > 0.0;
    };
}


function valKey(d) {
    return {
        value: d.key,
        title: d.key
    };
}


function valKeyDescription(d) {
    var obj = {
        value: d.value,
        title: d.description || d.value
    };
    if (d.count) {
        obj.count = d.count;
    }
    return obj;
}


function roleKey(d) {
    return {
        value: d.role,
        title: d.role
    };
}


// sort keys with ':' lower than keys without ':'
function sortKeys(a, b) {
    return (a.key.indexOf(':') === -1 && b.key.indexOf(':') !== -1) ? -1
        : (a.key.indexOf(':') !== -1 && b.key.indexOf(':') === -1) ? 1
        : 0;
}


var debouncedRequest = _debounce(request, 300, { leading: false });

function request(url, params, exactMatch, callback, loaded) {
    if (_inflight[url]) return;

    if (checkCache(url, params, exactMatch, callback)) return;

    var controller = new AbortController();
    _inflight[url] = controller;

    d3_json(url, { signal: controller.signal })
        .then(function(result) {
            delete _inflight[url];
            if (loaded) loaded(null, result);
        })
        .catch(function(err) {
            delete _inflight[url];
            if (err.name === 'AbortError') return;
            if (loaded) loaded(err.message);
        });
}


function checkCache(url, params, exactMatch, callback) {
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
        _popularKeys = {
            postal_code: true   // #5377
        };

        // Fetch popular keys.  We'll exclude these from `values`
        // lookups because they stress taginfo, and they aren't likely
        // to yield meaningful autocomplete results.. see #3955
        var params = {
            rp: 100,
            sortname: 'values_all',
            sortorder: 'desc',
            page: 1,
            debounce: false,
            lang: currentLocale
        };
        this.keys(params, function(err, data) {
            if (err) return;
            data.forEach(function(d) {
                if (d.value === 'opening_hours') return;  // exception
                _popularKeys[d.value] = true;
            });
        });
    },


    reset: function() {
        Object.values(_inflight).forEach(function(controller) { controller.abort(); });
        _inflight = {};
    },


    keys: function(params, callback) {
        var doRequest = params.debounce ? debouncedRequest : request;
        params = clean(setSort(params));
        params = Object.assign({
            rp: 10,
            sortname: 'count_all',
            sortorder: 'desc',
            page: 1,
            lang: currentLocale
        }, params);

        var url = apibase + 'keys/all?' + utilQsString(params);
        doRequest(url, params, false, callback, function(err, d) {
            if (err) {
                callback(err);
            } else {
                var f = filterKeys(params.filter);
                var result = d.data.filter(f).sort(sortKeys).map(valKey);
                _taginfoCache[url] = result;
                callback(null, result);
            }
        });
    },


    multikeys: function(params, callback) {
        var doRequest = params.debounce ? debouncedRequest : request;
        params = clean(setSort(params));
        params = Object.assign({
            rp: 25,
            sortname: 'count_all',
            sortorder: 'desc',
            page: 1,
            lang: currentLocale
        }, params);

        var prefix = params.query;
        var url = apibase + 'keys/all?' + utilQsString(params);
        doRequest(url, params, true, callback, function(err, d) {
            if (err) {
                callback(err);
            } else {
                var f = filterMultikeys(prefix);
                var result = d.data.filter(f).map(valKey);
                _taginfoCache[url] = result;
                callback(null, result);
            }
        });
    },


    values: function(params, callback) {
        // Exclude popular keys from values lookups.. see #3955
        var key = params.key;
        if (key && _popularKeys[key]) {
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
            lang: currentLocale
        }, params);

        var url = apibase + 'key/values?' + utilQsString(params);
        doRequest(url, params, false, callback, function(err, d) {
            if (err) {
                callback(err);
            } else {
                // In most cases we prefer taginfo value results with lowercase letters.
                // A few OSM keys expect values to contain uppercase values (see #3377).
                // This is not an exhaustive list (e.g. `name` also has uppercase values)
                // but these are the fields where taginfo value lookup is most useful.
                var re = /network|taxon|genus|species|brand|grape_variety|royal_cypher|listed_status|booth|rating|stars|:output|_hours|_times|_ref|manufacturer|country|target|brewery/;
                var allowUpperCase = re.test(params.key);
                var f = filterValues(allowUpperCase);

                var result = d.data.filter(f).map(valKeyDescription);
                _taginfoCache[url] = result;
                callback(null, result);
            }
        });
    },


    roles: function(params, callback) {
        var doRequest = params.debounce ? debouncedRequest : request;
        var geometry = params.geometry;
        params = clean(setSortMembers(params));
        params = Object.assign({
            rp: 25,
            sortname: 'count_all_members',
            sortorder: 'desc',
            page: 1,
            lang: currentLocale
        }, params);

        var url = apibase + 'relation/roles?' + utilQsString(params);
        doRequest(url, params, true, callback, function(err, d) {
            if (err) {
                callback(err);
            } else {
                var f = filterRoles(geometry);
                var result = d.data.filter(f).map(roleKey);
                _taginfoCache[url] = result;
                callback(null, result);
            }
        });
    },


    docs: function(params, callback) {
        var doRequest = params.debounce ? debouncedRequest : request;
        params = clean(setSort(params));

        var path = 'key/wiki_pages?';
        if (params.value) {
            path = 'tag/wiki_pages?';
        } else if (params.rtype) {
            path = 'relation/wiki_pages?';
        }

        var url = apibase + path + utilQsString(params);
        doRequest(url, params, true, callback, function(err, d) {
            if (err) {
                callback(err);
            } else {
                _taginfoCache[url] = d.data;
                callback(null, d.data);
            }
        });
    },


    apibase: function(_) {
        if (!arguments.length) return apibase;
        apibase = _;
        return this;
    }

};
