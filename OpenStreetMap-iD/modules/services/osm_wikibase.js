import _debounce from 'lodash-es/debounce';

import { json as d3_json } from 'd3-fetch';

import { localizer } from '../core/localizer';
import { utilQsString } from '../util';


var apibase = 'https://wiki.openstreetmap.org/w/api.php';
var _inflight = {};
var _wikibaseCache = {};
var _localeIDs = { en: false };


var debouncedRequest = _debounce(request, 500, { leading: false });

function request(url, callback) {
    if (_inflight[url]) return;
    var controller = new AbortController();
    _inflight[url] = controller;

    d3_json(url, { signal: controller.signal })
        .then(function(result) {
            delete _inflight[url];
            if (callback) callback(null, result);
        })
        .catch(function(err) {
            delete _inflight[url];
            if (err.name === 'AbortError') return;
            if (callback) callback(err.message);
        });
}


export default {

    init: function() {
        _inflight = {};
        _wikibaseCache = {};
        _localeIDs = {};
    },


    reset: function() {
        Object.values(_inflight).forEach(function(controller) { controller.abort(); });
        _inflight = {};
    },


    /**
     * Get the best value for the property, or undefined if not found
     * @param entity object from wikibase
     * @param property string e.g. 'P4' for image
     * @param langCode string e.g. 'fr' for French
     */
    claimToValue: function(entity, property, langCode) {
        if (!entity.claims[property]) return undefined;
        var locale = _localeIDs[langCode];
        var preferredPick, localePick;

        entity.claims[property].forEach(function(stmt) {
            // If exists, use value limited to the needed language (has a qualifier P26 = locale)
            // Or if not found, use the first value with the "preferred" rank
            if (!preferredPick && stmt.rank === 'preferred') {
                preferredPick = stmt;
            }
            if (locale && stmt.qualifiers && stmt.qualifiers.P26 &&
                stmt.qualifiers.P26[0].datavalue.value.id === locale
            ) {
                localePick = stmt;
            }
        });

        var result = localePick || preferredPick;
        if (result) {
            var datavalue = result.mainsnak.datavalue;
            return datavalue.type === 'wikibase-entityid' ? datavalue.value.id : datavalue.value;
        } else {
            return undefined;
        }
    },


    /**
     * Convert monolingual property into a key-value object (language -> value)
     * @param entity object from wikibase
     * @param property string e.g. 'P31' for monolingual wiki page title
     */
    monolingualClaimToValueObj: function(entity, property) {
        if (!entity || !entity.claims[property]) return undefined;

        return entity.claims[property].reduce(function(acc, obj) {
            var value = obj.mainsnak.datavalue.value;
            acc[value.language] = value.text;
            return acc;
        }, {});
    },


    toSitelink: function(key, value) {
        var result = value ? ('Tag:' + key + '=' + value) : 'Key:' + key;
        return result.replace(/_/g, ' ').trim();
    },


    //
    // Pass params object of the form:
    // {
    //   key: 'string',
    //   value: 'string',
    //   langCode: 'string'
    // }
    //
    getEntity: function(params, callback) {
        var doRequest = params.debounce ? debouncedRequest : request;
        var that = this;
        var titles = [];
        var result = {};
        var rtypeSitelink = (params.key === 'type' && params.value) ? ('Relation:' + params.value).replace(/_/g, ' ').trim() : false;
        var keySitelink = params.key ? this.toSitelink(params.key) : false;
        var tagSitelink = (params.key && params.value) ? this.toSitelink(params.key, params.value) : false;
        var localeSitelink;

        if (params.langCodes) {
            params.langCodes.forEach(function(langCode) {
                if (_localeIDs[langCode] === undefined) {
                    // If this is the first time we are asking about this locale,
                    // fetch corresponding entity (if it exists), and cache it.
                    // If there is no such entry, cache `false` value to avoid re-requesting it.
                    localeSitelink = ('Locale:' + langCode).replace(/_/g, ' ').trim();
                    titles.push(localeSitelink);
                }
            });
        }

        if (rtypeSitelink) {
            if (_wikibaseCache[rtypeSitelink]) {
                result.rtype = _wikibaseCache[rtypeSitelink];
            } else {
                titles.push(rtypeSitelink);
            }
        }

        if (keySitelink) {
            if (_wikibaseCache[keySitelink]) {
                result.key = _wikibaseCache[keySitelink];
            } else {
                titles.push(keySitelink);
            }
        }

        if (tagSitelink) {
            if (_wikibaseCache[tagSitelink]) {
                result.tag = _wikibaseCache[tagSitelink];
            } else {
                titles.push(tagSitelink);
            }
        }

        if (!titles.length) {
            // Nothing to do, we already had everything in the cache
            return callback(null, result);
        }

        // Requesting just the user language code
        // If backend recognizes the code, it will perform proper fallbacks,
        // and the result will contain the requested code. If not, all values are returned:
        // {"zh-tw":{"value":"...","language":"zh-tw","source-language":"zh-hant"}
        // {"pt-br":{"value":"...","language":"pt","for-language":"pt-br"}}
        var obj = {
            action: 'wbgetentities',
            sites: 'wiki',
            titles: titles.join('|'),
            languages: params.langCodes.join('|'),
            languagefallback: 1,
            origin: '*',
            format: 'json',
            // There is an MW Wikibase API bug https://phabricator.wikimedia.org/T212069
            // We shouldn't use v1 until it gets fixed, but should switch to it afterwards
            // formatversion: 2,
        };

        var url = apibase + '?' + utilQsString(obj);
        doRequest(url, function(err, d) {
            if (err) {
                callback(err);
            } else if (!d.success || d.error) {
                callback(d.error.messages.map(function(v) { return v.html['*']; }).join('<br>'));
            } else {
                var localeID = false;
                Object.values(d.entities).forEach(function(res) {
                    if (res.missing !== '') {

                        var title = res.sitelinks.wiki.title;
                        if (title === rtypeSitelink) {
                            _wikibaseCache[rtypeSitelink] = res;
                            result.rtype = res;
                        } else if (title === keySitelink) {
                            _wikibaseCache[keySitelink] = res;
                            result.key = res;
                        } else if (title === tagSitelink) {
                            _wikibaseCache[tagSitelink] = res;
                            result.tag = res;
                        } else if (title === localeSitelink) {
                            localeID = res.id;
                        } else {
                            console.log('Unexpected title ' + title);  // eslint-disable-line no-console
                        }
                    }
                });

                if (localeSitelink) {
                    // If locale ID is not found, store false to prevent repeated queries
                    that.addLocale(params.langCodes[0], localeID);
                }

                callback(null, result);
            }
        });
    },


    //
    // Pass params object of the form:
    // {
    //   key: 'string',     // required
    //   value: 'string'    // optional
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
        var that = this;
        var langCodes = localizer.localeCodes().map(function(code) {
            return code.toLowerCase();
        });
        params.langCodes = langCodes;

        this.getEntity(params, function(err, data) {
            if (err) {
                callback(err);
                return;
            }

            var entity = data.rtype || data.tag || data.key;
            if (!entity) {
                callback('No entity');
                return;
            }

            var i;
            var description;
            for (i in langCodes) {
                let code = langCodes[i];
                if (entity.descriptions[code] && entity.descriptions[code].language === code) {
                    description = entity.descriptions[code];
                    break;
                }
            }
            if (!description && Object.values(entity.descriptions).length) description = Object.values(entity.descriptions)[0];

            // prepare result
            var result = {
                title: entity.title,
                description: description ? description.value : '',
                descriptionLocaleCode: description ? description.language : '',
                editURL: 'https://wiki.openstreetmap.org/wiki/' + entity.title
            };

            // add image
            if (entity.claims) {
                var imageroot;
                var image = that.claimToValue(entity, 'P4', langCodes[0]);
                if (image) {
                    imageroot = 'https://commons.wikimedia.org/w/index.php';
                } else {
                    image = that.claimToValue(entity, 'P28', langCodes[0]);
                    if (image) {
                        imageroot = 'https://wiki.openstreetmap.org/w/index.php';
                    }
                }
                if (imageroot && image) {
                    result.imageURL = imageroot + '?' + utilQsString({
                        title: 'Special:Redirect/file/' + image,
                        width: 400
                    });
                }
            }

            // Try to get a wiki page from tag data item first, followed by the corresponding key data item.
            // If neither tag nor key data item contain a wiki page in the needed language nor English,
            // get the first found wiki page from either the tag or the key item.
            var rtypeWiki = that.monolingualClaimToValueObj(data.rtype, 'P31');
            var tagWiki = that.monolingualClaimToValueObj(data.tag, 'P31');
            var keyWiki = that.monolingualClaimToValueObj(data.key, 'P31');

            var wikis = [rtypeWiki, tagWiki, keyWiki];
            for (i in wikis) {
                var wiki = wikis[i];
                for (var j in langCodes) {
                    var code = langCodes[j];
                    var referenceId = (langCodes[0].split('-')[0] !== 'en' && code.split('-')[0] === 'en') ? 'inspector.wiki_en_reference' : 'inspector.wiki_reference';
                    var info = getWikiInfo(wiki, code, referenceId);
                    if (info) {
                        result.wiki = info;
                        break;
                    }
                }
                if (result.wiki) break;
            }

            callback(null, result);


            // Helper method to get wiki info if a given language exists
            function getWikiInfo(wiki, langCode, tKey) {
                if (wiki && wiki[langCode]) {
                    return {
                        title: wiki[langCode],
                        text: tKey,
                        url: 'https://wiki.openstreetmap.org/wiki/' + wiki[langCode]
                    };
                }
            }
        });
    },


    addLocale: function(langCode, qid) {
        // Makes it easier to unit test
        _localeIDs[langCode] = qid;
    },


    apibase: function(val) {
        if (!arguments.length) return apibase;
        apibase = val;
        return this;
    }

};
