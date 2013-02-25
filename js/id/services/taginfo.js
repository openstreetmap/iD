iD.taginfo = function() {
    var taginfo = {},
        endpoint = 'http://taginfo.openstreetmap.org/api/4/',
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

    var cache = this.cache = {};

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
        return _.omit(parameters, 'geometry');
    }

    function popularKeys(parameters) {
        var pop_field = 'count_all';
        if (parameters.filter) pop_field = 'count_' + parameters.filter;
        return function(d) { return parseFloat(d[pop_field]) > 10000; };
    }

    function popularValues(parameters) {
        return function(d) { return parseFloat(d.fraction) > 0.01; };
    }

    function valKey(d) { return { value: d.key }; }

    function valKeyDescription(d) {
        return {
            value: d.value,
            title: d.description
        };
    }

    var debounced = _.debounce(d3.json, 100, true);

    function request(url, callback) {
        if (cache[url]) {
            callback(null, cache[url]);
        } else {
            debounced(url, function(err, data) {
                if (!err) cache[url] = data;
                callback(err, data);
            });
        }
    }

    taginfo.keys = function(parameters, callback) {
        parameters = clean(setSort(setFilter(parameters)));
        request(endpoint + 'keys/all?' +
            iD.util.qsString(_.extend({
                rp: 6,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }, parameters)), function(err, d) {
                if (err) return callback(err);
                callback(null, d.data.filter(popularKeys(parameters)).map(valKey));
            });
    };

    taginfo.values = function(parameters, callback) {
        parameters = clean(setSort(setFilter(parameters)));
        request(endpoint + 'key/values?' +
            iD.util.qsString(_.extend({
                rp: 20,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }, parameters)), function(err, d) {
                if (err) return callback(err);
                callback(null, d.data.filter(popularValues()).map(valKeyDescription), parameters);
            });
    };

    taginfo.docs = function(parameters, callback) {
        parameters = clean(setSort(parameters));
        request(endpoint + 'tag/wiki_pages?' +
            iD.util.qsString(parameters), callback);
    };

    taginfo.endpoint = function(_) {
        if (!arguments.length) return endpoint;
        endpoint = _;
        return taginfo;
    };

    return taginfo;
};
