iD.services.taginfo = function() {
    var taginfo = {},
        endpoint = 'https://taginfo.openstreetmap.org/api/4/',
        tag_sorts = {
            point: 'count_nodes',
            vertex: 'count_nodes',
            area: 'count_ways',
            line: 'count_ways'
        },
        tag_filters = {
            point: 'nodes',
            vertex: 'nodes',
            area: 'ways',
            line: 'ways'
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

    function clean(parameters) {
        return _.omit(parameters, 'geometry', 'debounce');
    }

    function popularKeys(parameters) {
        var pop_field = 'count_all';
        if (parameters.filter) pop_field = 'count_' + parameters.filter;
        return function(d) { return parseFloat(d[pop_field]) > 5000 || d.in_wiki; };
    }

    function popularValues() {
        return function(d) { return parseFloat(d.fraction) > 0.01 || d.in_wiki; };
    }

    function valKey(d) { return { value: d.key }; }

    function valKeyDescription(d) {
        return {
            value: d.value,
            title: d.description
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
        var cache = iD.services.taginfo.cache;

        if (cache[url]) {
            callback(null, cache[url]);
        } else if (debounce) {
            debounced(url, done);
        } else {
            d3.json(url, done);
        }

        function done(err, data) {
            if (!err) cache[url] = data;
            callback(err, data);
        }
    }

    taginfo.keys = function(parameters, callback) {
        var debounce = parameters.debounce;
        parameters = clean(setSort(parameters));
        request(endpoint + 'keys/all?' +
            iD.util.qsString(_.extend({
                rp: 10,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }, parameters)), debounce, function(err, d) {
                if (err) return callback(err);
                callback(null, d.data.filter(popularKeys(parameters)).sort(sortKeys).map(valKey));
            });
    };

    taginfo.values = function(parameters, callback) {
        var debounce = parameters.debounce;
        parameters = clean(setSort(setFilter(parameters)));
        request(endpoint + 'key/values?' +
            iD.util.qsString(_.extend({
                rp: 25,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }, parameters)), debounce, function(err, d) {
                if (err) return callback(err);
                callback(null, d.data.filter(popularValues()).map(valKeyDescription), parameters);
            });
    };

    taginfo.docs = function(parameters, callback) {
        var debounce = parameters.debounce;
        parameters = clean(setSort(parameters));

        var path = 'key/wiki_pages?';
        if (parameters.value) path = 'tag/wiki_pages?';
        else if (parameters.rtype) path = 'relation/wiki_pages?';

        request(endpoint + path + iD.util.qsString(parameters), debounce, function(err, d) {
            if (err) return callback(err);
            callback(null, d.data);
        });
    };

    taginfo.endpoint = function(_) {
        if (!arguments.length) return endpoint;
        endpoint = _;
        return taginfo;
    };

    taginfo.reset = function() {
        iD.services.taginfo.cache = {};
        return taginfo;
    };


    if (!iD.services.taginfo.cache) {
        taginfo.reset();
    }

    return taginfo;
};
