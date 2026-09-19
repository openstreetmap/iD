import { json as d3_json } from 'd3-fetch';
import type { Entities, Item, ItemId, PropertyId, SearchResponse, SearchResult, Site, SnakWithValue, Term, WbGetEntitiesResponse } from 'wikibase-sdk';

import { utilQsString } from '../util';
import { localizer } from '../core/localizer';

var apibase = 'https://www.wikidata.org/w/api.php?';
var _wikidataCache: { [qId: ItemId]: Item } = {};

export interface WikibaseApiResponse {
    success: 0 | 1;
    error: WbGetEntitiesResponse['error'];
    entities: {
        [qId: ItemId]: Item;
    };
}


export interface WikibaseResult {
    title: string;
    description: d3.Selector;
    descriptionLocaleCode: string;
    editURL: string;
    imageURL?: string;
    wiki?: {
        title: string;
        text: string;
        url: string;
    };
}

export default {

    init: function() {},

    reset: function() {
        _wikidataCache = {};
    },


    // Search for Wikidata items matching the query
    itemsForSearchQuery: function(query: string, callback: Callback<SearchResult[]>, language?: string) {
        if (!query) {
            if (callback) callback(new Error('No query'));
            return;
        }

        var lang = this.languagesToQuery()[0];

        var url = apibase + utilQsString({
            action: 'wbsearchentities',
            format: 'json',
            formatversion: 2,
            search: query,
            type: 'item',
            // the language to search
            language: language || lang,
            // the language for the label and description in the result
            uselang: lang,
            limit: 10,
            origin: '*'
        });

        d3_json(url)
            .then(_result => {
                const result = _result as SearchResponse;
                if (result && result.error) {
                    if (result.error.code === 'badvalue' &&
                        result.error.info.includes(lang) &&
                        !language && lang.includes('-')) {
                        // retry without "country suffix" region subtag
                        this.itemsForSearchQuery(query, callback, lang.split('-')[0]);
                        return;
                    } else {
                        throw new Error(JSON.stringify(result.error));
                    }
                }
                if (callback) callback(null, result.search || {});
            })
            .catch(function(err) {
                if (callback) callback(err);
            });
    },


    // Given a Wikipedia language and article title,
    // return an array of corresponding Wikidata entities.
    itemsByTitle: function(lang?: string, title?: string, callback?: Callback<Entities>) {
        if (!title) {
            if (callback) callback(new Error('No title'));
            return;
        }

        lang = lang || 'en';
        var url = apibase + utilQsString({
            action: 'wbgetentities',
            format: 'json',
            formatversion: 2,
            sites: lang.replace(/-/g, '_') + 'wiki',
            titles: title,
            languages: 'en', // shrink response by filtering to one language
            origin: '*'
        });

        d3_json(url)
            .then(function(_result) {
                const result = _result as WikibaseApiResponse;
                if (result && result.error) {
                    throw new Error(JSON.stringify(result.error));
                }
                if (callback) callback(null, result.entities || {});
            })
            .catch(function(err) {
                if (callback) callback(err);
            });
    },


    languagesToQuery: function() {
        return localizer.localeCodes().map(function(code) {
            return code.toLowerCase();
        }).filter(function(code) {
            // HACK: en-us isn't a wikidata language. We should really be filtering by
            // the languages known to be supported by wikidata.
            return code !== 'en-us';
        });
    },


    entityByQID: function(qid: ItemId, callback: Callback<Item>) {
        if (!qid) {
            callback(new Error('No qid'));
            return;
        }
        if (_wikidataCache[qid]) {
            if (callback) callback(null, _wikidataCache[qid]);
            return;
        }

        var langs = this.languagesToQuery();
        var url = apibase + utilQsString({
            action: 'wbgetentities',
            format: 'json',
            formatversion: 2,
            ids: qid,
            props: 'labels|descriptions|claims|sitelinks',
            sitefilter: langs.map(function(d) { return d + 'wiki'; }).join('|'),
            languages: langs.join('|'),
            languagefallback: 1,
            origin: '*'
        });

        d3_json(url)
            .then(function(_result) {
                const result = _result as WikibaseApiResponse;
                if (result && result.error) {
                    throw new Error(JSON.stringify(result.error));
                }
                if (callback) callback(null, result.entities[qid] || {});
            })
            .catch(function(err) {
                if (callback) callback(err);
            });
    },


    // Pass `params` object of the form:
    // {
    //   qid: 'string'      // brand wikidata  (e.g. 'Q37158')
    // }
    //
    // Get an result object used to display tag documentation
    // {
    //   title:        'string',
    //   description:  'string',
    //   editURL:      'string',
    //   imageURL:     'string',
    //   wiki:         { title: 'string', text: 'string', url: 'string' }
    // }
    //
    getDocs: function(params: { qid: ItemId }, callback: Callback<WikibaseResult>) {
        var langs = this.languagesToQuery();
        this.entityByQID(params.qid, function(err, entity) {
            if (err || !entity) {
                callback(err || new Error('No entity'));
                return;
            }

            var i;
            let description: Term | undefined;
            for (i in langs) {
                let code = langs[i];
                if (entity.descriptions?.[code]?.language === code) {
                    description = entity.descriptions[code];
                    break;
                }
            }
            if (!description && Object.values(entity.descriptions || {}).length) description = Object.values(entity.descriptions || {})[0];

            // prepare result
            const result: WikibaseResult = {
                title: entity.id,
                description: selection => selection.text(description ? description.value : ''),
                descriptionLocaleCode: description ? description.language : '',
                editURL: 'https://www.wikidata.org/wiki/' + entity.id
            };

            // add image
            if (entity.claims) {
                var imageroot = 'https://commons.wikimedia.org/w/index.php';
                const props: PropertyId[] = ['P154', 'P18'];  // logo image, image
                var prop, image;
                for (i = 0; i < props.length; i++) {
                    prop = entity.claims[props[i]];
                    if (prop && Object.keys(prop).length > 0) {
                        image = (Object.values(prop)[0].mainsnak as SnakWithValue).datavalue.value;
                        if (image) {
                            result.imageURL = imageroot + '?' + utilQsString({
                                title: 'Special:Redirect/file/' + image,
                                width: 400
                            });
                            break;
                        }
                    }
                }
            }

            if (entity.sitelinks) {
                var englishLocale = localizer.languageCode().toLowerCase() === 'en';

                // must be one of these that we requested..
                for (i = 0; i < langs.length; i++) {   // check each, in order of preference
                    var w = langs[i] + 'wiki' as Site;
                    if (entity.sitelinks[w]) {
                        var title = entity.sitelinks[w]!.title;
                        var tKey = 'inspector.wiki_reference';
                        if (!englishLocale && langs[i] === 'en') {   // user's locale isn't English but
                            tKey = 'inspector.wiki_en_reference';    // we are sending them to enwiki anyway..
                        }

                        result.wiki = {
                            title: title,
                            text: tKey,
                            url: 'https://' + langs[i] + '.wikipedia.org/wiki/' + title.replace(/ /g, '_')
                        };
                        break;
                    }
                }
            }

            callback(null, result);
        });
    }

};
