import { jsonpRequest } from '../util/jsonp_request';
import { qsString } from '../util/index';

var wikipedia = {},
    endpoint = 'https://en.wikipedia.org/w/api.php?';

export function init() {
    wikipedia.search = function(lang, query, callback) {
        if (!query) {
            callback([]);
            return;
        }

        lang = lang || 'en';
        jsonpRequest(endpoint.replace('en', lang) +
            qsString({
                action: 'query',
                list: 'search',
                srlimit: '10',
                srinfo: 'suggestion',
                format: 'json',
                callback: '{callback}',
                srsearch: query
            }), function(data) {
                if (!data || !data.query || !data.query.search) {
                    callback([]);
                    return;
                }
                callback(query, data.query.search.map(function(d) {
                    return d.title;
                }));
            }
        );
    };

    wikipedia.suggestions = function(lang, query, callback) {
        if (!query) {
            callback('', []);
            return;
        }

        lang = lang || 'en';
        jsonpRequest(endpoint.replace('en', lang) +
            qsString({
                action: 'opensearch',
                namespace: 0,
                suggest: '',
                format: 'json',
                callback: '{callback}',
                search: query
            }), function(d) {
                if (!d || d.error) {
                    callback('', []);
                    return;
                }
                callback(d[0], d[1]);
            }
        );
    };

    wikipedia.translations = function(lang, title, callback) {
        if (!title) {
            callback({});
            return;
        }

        jsonpRequest(endpoint.replace('en', lang) +
            qsString({
                action: 'query',
                prop: 'langlinks',
                format: 'json',
                callback: '{callback}',
                lllimit: 500,
                titles: title
            }), function(d) {
                if (!d || d.error) {
                    callback({});
                    return;
                }

                var list = d.query.pages[Object.keys(d.query.pages)[0]],
                    translations = {};
                if (list && list.langlinks) {
                    list.langlinks.forEach(function(d) {
                        translations[d.lang] = d['*'];
                    });
                    callback(translations);
                }
            }
        );
    };

    return wikipedia;
}
