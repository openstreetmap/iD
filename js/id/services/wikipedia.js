iD.wikipedia  = function() {
    var wiki = {},
        endpoint = 'http://en.wikipedia.org/w/api.php?';

    wiki.search = function(lang, query, callback) {
        lang = lang || 'en';
        d3.jsonp(endpoint.replace('en', lang) +
            iD.util.qsString({
                action: 'query',
                list: 'search',
                srlimit: '10',
                srinfo: 'suggestion',
                format: 'json',
                callback: '{callback}',
                srsearch: query
            }), function(data) {
                if (!data.query) return console.log("resp", data);
                callback(query, data.query.search.map(function(d) {
                    return d.title;
                }));
            });
    };

    wiki.suggestions = function(lang, query, callback) {
        lang = lang || 'en';
        d3.jsonp(endpoint.replace('en', lang) +
            iD.util.qsString({
                action: 'opensearch',
                namespace: 0,
                suggest: '',
                format: 'json',
                callback: '{callback}',
                search: query
            }), function(d) {
                callback(d[0], d[1]);
            });
    };
    return wiki;
};
