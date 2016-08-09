import { qsString } from '../util/index';
import { jsonpRequest } from '../util/jsonp_request';

var wikipedia = {},
    endpoint = 'https://en.wikipedia.org/w/api.php?';

export function init() {
    wikipedia.search = function(lang, query, callback) {
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
                if (!data.query) return;
                callback(query, data.query.search.map(function(d) {
                    return d.title;
                }));
            });
    };

    wikipedia.suggestions = function(lang, query, callback) {
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
                callback(d[0], d[1]);
            });
    };

    wikipedia.translations = function(lang, title, callback) {
        jsonpRequest(endpoint.replace('en', lang) +
            qsString({
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

    return wikipedia;
}
