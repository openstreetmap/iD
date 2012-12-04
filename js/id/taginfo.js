iD.taginfo = function() {
    var taginfo = {},
        endpoint = 'http://taginfo.openstreetmap.org/api/2/';

    taginfo.values = function(key, callback) {
        d3.json(endpoint + 'db/keys/values?' +
            iD.Util.qsString({
                key: key,
                rp: 20,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }), callback);
    };

    taginfo.endpoint = function(_) {
        if (!arguments.length) return endpoint;
        endpoint = _;
        return taginfo;
    };

    return taginfo;
};
