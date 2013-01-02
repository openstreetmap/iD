iD.taginfo = function() {
    var taginfo = {},
        endpoint = 'http://taginfo.openstreetmap.org/api/2/';

    taginfo.keys = function(parameters, callback) {
        d3.json(endpoint + 'db/keys?' +
            iD.util.qsString(_.extend({
                rp: 20,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }, parameters)), callback);
    };

    taginfo.values = function(parameters, callback) {
        d3.json(endpoint + 'db/keys/values?' +
            iD.util.qsString(_.extend({
                rp: 20,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }, parameters)), callback);
    };

    taginfo.docs = function(parameters, callback) {
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
