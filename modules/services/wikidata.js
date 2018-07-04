import { json as d3_json } from 'd3-request';

import { utilQsString } from '../util';


var endpoint = 'https://www.wikidata.org/w/api.php?';

export default {

    init: function() {},
    reset: function() {},


    // Given a Wikipedia language and article title, return an array of
    // corresponding Wikidata entities.
    itemsByTitle: function(lang, title, callback) {
        if (!title) {
            callback('', {});
            return;
        }

        lang = lang || 'en';
        d3_json(endpoint + utilQsString({
            action: 'wbgetentities',
            format: 'json',
            sites: lang.replace(/-/g, '_') + 'wiki',
            titles: title,
            languages: 'en', // shrink response by filtering to one language
            origin: '*'
        }), function(err, data) {
            if (err || !data || data.error) {
                callback('', {});
            } else {
                callback(title, data.entities || {});
            }
        });
    }

};
