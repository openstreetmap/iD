// Taginfo
iD.taginfo = (function() {

    var taginfo = {},
        endpoint = 'http://taginfo.openstreetmap.org/api/2/';

    function qsString(obj) {
        return Object.keys(obj).sort().map(function(key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
        }).join('&');
    }

    // Given a key, return common values
    // TODO: get type, count correctly based on it
    taginfo.values = function(key, callback) {
        d3.json(endpoint + 'db/keys/values' +
            qsString({
                key: key,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            }), callback);
    };

    return taginfo;
})();
