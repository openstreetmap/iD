import * as d3 from 'd3';
import _ from 'lodash';
import { utilQsString } from '../util/index';


var endpoint = 'https://taginfo.openstreetmap.org/api/4/',
    taginfoCache = {},
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


function sets(parameters, n, o) {
    if (parameters.geometry && o[parameters.geometry]) {
        parameters[n] = o[parameters.geometry];
    }
    return parameters;
}


function setFilter(parameters) {
    return sets(parameters, 'filter', tag_filters);
}


function setSort(parameters) {
    return sets(parameters, 'sortname', tag_sorts);
}


function setSortMembers(parameters) {
    return sets(parameters, 'sortname', tag_sort_members);
}


function clean(parameters) {
    return _.omit(parameters, 'geometry', 'debounce');
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


var debounced = _.debounce(d3.json, 100, true);


function request(url, debounce, callback) {
    if (taginfoCache[url]) {
        callback(null, taginfoCache[url]);
    } else if (debounce) {
        debounced(url, done);
    } else {
        d3.json(url, done);
    }

    function done(err, data) {
        if (!err) {
            taginfoCache[url] = data;
        }
        callback(err, data);
    }
}


export default {

    init: function() { taginfoCache = {}; },
    reset: function() { taginfoCache = {}; },


    keys: function(parameters, callback) {
        var debounce = parameters.debounce;
        parameters = clean(setSort(parameters));
        request(endpoint + 'keys/all?' +
            utilQsString(_.extend({
                rp: 10,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }, parameters)), debounce, function(err, d) {
                if (err) {
                    callback(err);
                } else {
                    var f = filterKeys(parameters.filter);
                    callback(null, d.data.filter(f).sort(sortKeys).map(valKey));
                }
            }
        );
    },


    multikeys: function(parameters, callback) {
        var debounce = parameters.debounce;
        parameters = clean(setSort(parameters));
        var prefix = parameters.query;
        request(endpoint + 'keys/all?' +
            utilQsString(_.extend({
                rp: 25,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }, parameters)), debounce, function(err, d) {
                if (err) {
                    callback(err);
                } else {
                    var f = filterMultikeys(prefix);
                    callback(null, d.data.filter(f).map(valKey));
                }
            }
        );
    },


    values: function(parameters, callback) {
        var debounce = parameters.debounce;
        parameters = clean(setSort(setFilter(parameters)));
        request(endpoint + 'key/values?' +
            utilQsString(_.extend({
                rp: 25,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }, parameters)), debounce, function(err, d) {
                if (err) {
                    callback(err);
                } else {
                    // In most cases we prefer taginfo value results with lowercase letters.
                    // A few OSM keys expect values to contain uppercase values (see #3377).
                    // This is not an exhaustive list (e.g. `name` also has uppercase values)
                    // but these are the fields where taginfo value lookup is most useful.
                    var re = /network|taxon|genus|species/;
                    var allowUpperCase = (parameters.key.match(re) !== null);
                    var f = filterValues(allowUpperCase);
                    callback(null, d.data.filter(f).map(valKeyDescription));
                }
            }
        );
    },


    roles: function(parameters, callback) {
        var debounce = parameters.debounce;
        var geometry = parameters.geometry;
        parameters = clean(setSortMembers(parameters));
        request(endpoint + 'relation/roles?' +
            utilQsString(_.extend({
                rp: 25,
                sortname: 'count_all_members',
                sortorder: 'desc',
                page: 1
            }, parameters)), debounce, function(err, d) {
                if (err) {
                    callback(err);
                } else {
                    var f = filterRoles(geometry);
                    callback(null, d.data.filter(f).map(roleKey));
                }
            }
        );
    },


    docs: function(parameters, callback) {
        var debounce = parameters.debounce;
        parameters = clean(setSort(parameters));

        var path = 'key/wiki_pages?';
        if (parameters.value) path = 'tag/wiki_pages?';
        else if (parameters.rtype) path = 'relation/wiki_pages?';

        request(endpoint + path + utilQsString(parameters), debounce, function(err, d) {
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
