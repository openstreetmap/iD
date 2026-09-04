import { json as d3_json } from 'd3-fetch';

import { utilQsString } from '../util';


var endpoint = 'https://en.wikipedia.org/w/api.php?';

interface Article {
    title: string;
    snippet: string;
}

interface ApiError {
    code: string;
    info: string;
    '*': string;
}

export default {

    init: function() {},
    reset: function() {},


    search: function(lang: string, query: string, callback: Callback<string[]>) {
        if (!query) {
            if (callback) callback(new Error('No Query'));
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
            .then(function(_result) {
                const result = _result as { error?: ApiError; query?: { search: Article[] }; };
                if (result && result.error) {
                    throw new Error(JSON.stringify(result.error));
                } else if (!result || !result.query || !result.query.search) {
                    throw new Error('No Results');
                }
                if (callback) {
                    var titles = result.query.search.map(function(d) { return d.title; });
                    callback(null, titles);
                }
            })
            .catch(function(err) {
                if (callback) callback(err);
            });
    },


    suggestions: function(lang: string, query: string, callback: Callback<string[]>) {
        if (!query) {
            if (callback) callback(new Error('No Query'));
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
            .then(function(_result) {
                const result = _result as [query: string, titles: string[]] & { error?: ApiError };
                if (result && result.error) {
                    throw new Error(JSON.stringify(result.error));
                } else if (!result || result.length < 2) {
                    throw new Error('No Results');
                }
                if (callback) callback(null, result[1] || []);
            })
            .catch(function(err) {
                if (callback) callback(err);
            });
    },

};
