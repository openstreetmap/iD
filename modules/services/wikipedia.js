import { json as d3_json } from 'd3-fetch';

import { utilQsString } from '../util';


var endpoint = 'https://en.wikipedia.org/w/api.php?';

export default {

    init: function() {},
    reset: function() {},


    search: function(lang, query, callback) {
        if (!query) {
            if (callback) callback('No Query', []);
            return;
        }

        lang = lang || 'en';
        var url = endpoint.replace('en', lang) +
            utilQsString({
                action: 'query',
                list: 'search',
                srlimit: '10',
                srinfo: 'suggestion',
                format: 'json',
                origin: '*',
                srsearch: query
            });

        d3_json(url)
            .then(function(result) {
                if (result && result.error) {
                    throw new Error(result.error);
                } else if (!result || !result.query || !result.query.search) {
                    throw new Error('No Results');
                }
                if (callback) {
                    var titles = result.query.search.map(function(d) { return d.title; });
                    callback(null, titles);
                }
            })
            .catch(function(err) {
                if (callback) callback(err, []);
            });
    },


    suggestions: function(lang, query, callback) {
        if (!query) {
            if (callback) callback('', []);
            return;
        }

        lang = lang || 'en';
        var url = endpoint.replace('en', lang) +
            utilQsString({
                action: 'opensearch',
                namespace: 0,
                suggest: '',
                format: 'json',
                origin: '*',
                search: query
            });

        d3_json(url)
            .then(function(result) {
                if (result && result.error) {
                    throw new Error(result.error);
                } else if (!result || result.length < 2) {
                    throw new Error('No Results');
                }
                if (callback) callback(null, result[1] || []);
            })
            .catch(function(err) {
                if (callback) callback(err.message, []);
            });
    },


    translations: function(lang, title, callback) {
        if (!title) {
            if (callback) callback('No Title');
            return;
        }

        var url = endpoint.replace('en', lang) +
            utilQsString({
                action: 'query',
                prop: 'langlinks',
                format: 'json',
                origin: '*',
                lllimit: 500,
                titles: title
            });

        d3_json(url)
            .then(function(result) {
                if (result && result.error) {
                    throw new Error(result.error);
                } else if (!result || !result.query || !result.query.pages) {
                    throw new Error('No Results');
                }
                if (callback) {
                    var list = result.query.pages[Object.keys(result.query.pages)[0]];
                    var translations = {};
                    if (list && list.langlinks) {
                        list.langlinks.forEach(function(d) { translations[d.lang] = d['*']; });
                    }
                    callback(null, translations);
                }
            })
            .catch(function(err) {
                if (callback) callback(err.message);
            });
    }

};
