import _uniq from 'lodash-es/uniq';

import { json as d3_json } from 'd3-request';

import { utilQsString } from '../util';
import { currentLocale } from '../util/locale';

var endpoint = 'https://www.wikidata.org/w/api.php?';
var _wikidataCache = {};

export default {

    init: function() {},

    reset: function() {
        _wikidataCache = {};
    },


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
            formatversion: 2,
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
    },


    entityByQID: function(qid, callback) {
        if (!qid) {
            callback('', {});
            return;
        }
        if (_wikidataCache[qid]) {
            callback('', _wikidataCache[qid]);
            return;
        }

        var langs = _uniq([
            currentLocale.toLowerCase(),
            currentLocale.split('-', 2)[0].toLowerCase(),
            'en'
        ]);

        d3_json(endpoint + utilQsString({
            action: 'wbgetentities',
            format: 'json',
            formatversion: 2,
            ids: qid,
            props: 'labels|descriptions|claims|sitelinks',
            sitefilter: langs.map(function(d) { return d + 'wiki'; }).join('|'),
            languages: langs.join('|'),
            languagefallback: 1,
            origin: '*'
        }), function(err, data) {
            if (err || !data || data.error) {
                callback('', {});
            } else {
                _wikidataCache[qid] = data.entities[qid];
                callback(qid, data.entities[qid] || {});
            }
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
    getDocs: function(params, callback) {
        this.entityByQID(params.qid, function(err, entity) {
            if (err || !entity) {
                callback(err);
                return;
            }

            var description;
            if (entity.descriptions && Object.keys(entity.descriptions).length > 0) {
                description = entity.descriptions[Object.keys(entity.descriptions)[0]].value;
            }

            // prepare result
            var result = {
                title: entity.id,
                description: description,
                editURL: 'https://www.wikidata.org/wiki/' + entity.id
            };

            // add image
            if (entity.claims) {
                var imageroot = 'https://commons.wikimedia.org/w/index.php';
                var props = ['P154','P18'];  // logo image, image
                var prop, image;
                for (var i = 0; i < props.length; i++) {
                    prop = entity.claims[props[i]];
                    if (prop && Object.keys(prop).length > 0) {
                        image = prop[Object.keys(prop)[0]].mainsnak.datavalue.value;
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

            // TODO add wiki sitelink
            // result.wiki = ?

            callback(null, result);
        });
    }

};
