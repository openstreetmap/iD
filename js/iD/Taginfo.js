if (typeof iD === 'undefined') iD = {};

// Taginfo service singleton
iD.Taginfo = (function() {

    var taginfo = {},
        endpoint = 'http://taginfo.openstreetmap.org/api/2/';

    // Given a key, return common values
    // TODO: get type, count correctly based on it
    taginfo.values = function(key, callback) {
        $.ajax({
            url: endpoint + 'db/keys/values',
            data: {
                key: key,
                sortname: 'count_all',
                sortorder: 'desc',
                page: 1
            },
            dataType: 'jsonp',
            success: function(resp) {
                if (resp.data) callback(resp.data);
            }
        });
    };

    return taginfo;
})();
