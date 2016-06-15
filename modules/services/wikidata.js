export function wikidata() {
    var wikidata = {},
        endpoint = 'https://www.wikidata.org/w/api.php?';


    // Given a Wikipedia language and article title, return an array of
    // corresponding Wikidata entities.
    wikidata.itemsByTitle = function(lang, title, callback) {
        lang = lang || 'en';
        d3.jsonp(endpoint + iD.util.qsString({
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
