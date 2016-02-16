iD.services.wikipedia = function() {
    var wiki = {},
        endpoint = 'https://en.wikipedia.org/w/api.php?';

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
                if (!data.query) return;
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

    wiki.translations = function(lang, title, callback) {
        d3.jsonp(endpoint.replace('en', lang) +
            iD.util.qsString({
                action: 'query',
                prop: 'langlinks',
                format: 'json',
                callback: '{callback}',
                lllimit: 500,
                titles: title
            }), function(d) {
                var list = d.query.pages[Object.keys(d.query.pages)[0]],
                    translations = {};
                if (list && list.langlinks) {
                    list.langlinks.forEach(function(d) {
                        translations[d.lang] = d['*'];
                    });
                    callback(translations);
                }
            });
    };

    return wiki;
};
