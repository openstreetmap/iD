import { jsonpRequest } from '../util/jsonp_request';
import { qsString } from '../util/index';

var wikidata = {},
    endpoint = 'https://www.wikidata.org/w/api.php?';

export function init() {
    // Given a Wikipedia language and article title, return an array of
    // corresponding Wikidata entities.
    wikidata.itemsByTitle = function(lang, title, callback) {
        lang = lang || 'en';
        jsonpRequest(endpoint + qsString({
            action: 'wbgetentities',
            format: 'json',
            sites: lang.replace(/-/g, '_') + 'wiki',
            titles: title,
            languages: 'en', // shrink response by filtering to one language
            callback: '{callback}'
        }), function(data) {
            callback(title, data.entities || {});
        });
    };
    return wikidata;
}
