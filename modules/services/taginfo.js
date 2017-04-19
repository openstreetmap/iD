import * as d3 from 'd3';
import _ from 'lodash';
import { utilQsString } from '../util';


var endpoint = 'https://taginfo.openstreetmap.org/api/4/',
    taginfoCache = {},
    popularKeys = {},
    tag_sorts = {
        point: 'count_nodes',
        vertex: 'count_nodes',
        area: 'count_ways',
        line: 'count_ways'
    },
    tag_sort_members = {
        point: 'count_node_members',
        vertex: 'count_node_members',
        area: 'count_way_members',
        line: 'count_way_members',
        relation: 'count_relation_members'
    },
    tag_filters = {
        point: 'nodes',
        vertex: 'nodes',
        area: 'ways',
        line: 'ways'
    },
    tag_members_fractions = {
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
    return _.omit(params, 'geometry', 'debounce');
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
        return parseFloat(d.fraction) > 0.0 || d.in_wiki;
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
    return {
        value: d.value,
        title: d.description || d.value
    };
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


var debouncedRequest = _.debounce(request, 750, { leading: false });

function request(url, params, callback) {
    if (taginfoCache[url]) {
        callback(null, taginfoCache[url]);
    } else {
        d3.json(url, function (err, data) {
            if (!err) {
                taginfoCache[url] = data;
            }
            callback(err, data);
        });
    }
}


export default {

    init: function() {
        taginfoCache = {};
        popularKeys = {};

        // Fetch popular keys.  We'll exclude these from `values`
        // lookups because they stress taginfo, and they aren't likely
        // to yield meaningful autocomplete results.. see #3955
        var params = { rp: 100, sortname: 'values_all', sortorder: 'desc', page: 1, debounce: false };
        this.keys(params, function(err, data) {
            if (err) return;
            data.forEach(function(d) {
                if (d === 'opening_hours') return;  // exception
                popularKeys[d.value] = true;
            });
        });
    },


    reset: function() { },


    keys: function(params, callback) {
        var req = params.debounce ? debouncedRequest : request;
        params = clean(setSort(params));

        var qs = utilQsString(
            _.extend({ rp: 10, sortname: 'count_all', sortorder: 'desc', page: 1 }, params)
        );


        req(endpoint + 'keys/all?' + qs, params, function(err, d) {
            if (err) {
                callback(err);
            } else {
                var f = filterKeys(params.filter);
                callback(null, d.data.filter(f).sort(sortKeys).map(valKey));
            }
        });
    },


    multikeys: function(params, callback) {
        var req = params.debounce ? debouncedRequest : request;
        params = clean(setSort(params));
        var prefix = params.query;

        var qs = utilQsString(
            _.extend({ rp: 25, sortname: 'count_all', sortorder: 'desc', page: 1 }, params)
        );

        req(endpoint + 'keys/all?' + qs, params, function(err, d) {
            if (err) {
                callback(err);
            } else {
                var f = filterMultikeys(prefix);
                callback(null, d.data.filter(f).map(valKey));
            }
        });
    },


    values: function(params, callback) {
        // Exclude popular keys from values lookups.. see #3955
        var key = params.key;
        if (key && popularKeys[key]) {
            callback(null, []);
            return;
        }

        var req = params.debounce ? debouncedRequest : request;
        params = clean(setSort(setFilter(params)));

        var qs = utilQsString(
            _.extend({ rp: 25, sortname: 'count_all', sortorder: 'desc', page: 1 }, params)
        );

        req(endpoint + 'key/values?' + qs, params, function(err, d) {
            if (err) {
                callback(err);
            } else {
                // In most cases we prefer taginfo value results with lowercase letters.
                // A few OSM keys expect values to contain uppercase values (see #3377).
                // This is not an exhaustive list (e.g. `name` also has uppercase values)
                // but these are the fields where taginfo value lookup is most useful.
                var re = /network|taxon|genus|species|brand|grape_variety|_hours|_times/;
                var allowUpperCase = (params.key.match(re) !== null);
                var f = filterValues(allowUpperCase);
                callback(null, d.data.filter(f).map(valKeyDescription));
            }
        });
    },


    roles: function(params, callback) {
        var req = params.debounce ? debouncedRequest : request;
        var geometry = params.geometry;
        params = clean(setSortMembers(params));

        var qs = utilQsString(
            _.extend({ rp: 25, sortname: 'count_all_members', sortorder: 'desc', page: 1 }, params)
        );

        req(endpoint + 'relation/roles?' + qs, params, function(err, d) {
            if (err) {
                callback(err);
            } else {
                var f = filterRoles(geometry);
                callback(null, d.data.filter(f).map(roleKey));
            }
        });
    },


    docs: function(params, callback) {
        var req = params.debounce ? debouncedRequest : request;
        params = clean(setSort(params));

        var path = 'key/wiki_pages?';
        if (params.value) path = 'tag/wiki_pages?';
        else if (params.rtype) path = 'relation/wiki_pages?';

        req(endpoint + path + utilQsString(params), params, function(err, d) {
            if (err) {
                callback(err);
            } else {
                callback(null, d.data);
            }
        });
    },


    endpoint: function(_) {
        if (!arguments.length) return endpoint;
        endpoint = _;
        return this;
    }

};
