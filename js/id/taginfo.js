iD.taginfo = function() {
    var taginfo = {},
        endpoint = 'http://taginfo.openstreetmap.org/api/2/',
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
        return _.omit(parameters, 'geometry');
    }

    taginfo.keys = function(parameters, callback) {
        parameters = clean(setSort(setFilter(parameters)));
        d3.json(endpoint + 'db/keys?' +
            iD.util.qsString(_.extend({
                rp: 6,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }, parameters)), callback);
    };

    taginfo.values = function(parameters, callback) {
        parameters = clean(setSort(setFilter(parameters)));
        d3.json(endpoint + 'db/keys/values?' +
            iD.util.qsString(_.extend({
                rp: 20,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }, parameters)), callback);
    };

    taginfo.docs = function(parameters, callback) {
        parameters = clean(setSort(parameters));
        d3.json(endpoint + 'wiki/tags?' +
            iD.util.qsString(parameters), callback);
    };

    taginfo.endpoint = function(_) {
        if (!arguments.length) return endpoint;
        endpoint = _;
        return taginfo;
    };

    return taginfo;
};
