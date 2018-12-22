import _debounce from 'lodash-es/debounce';
import _forEach from 'lodash-es/forEach';

import { json as d3_json } from 'd3-request';

import { utilQsString } from '../util';


var apibase = 'https://wiki.openstreetmap.org/w/api.php';
var _inflight = {};
var _wikibaseCache = {};
var _localeIds = {};


var debouncedRequest = _debounce(request, 500, { leading: false });

function request(url, callback) {
    if (_inflight[url]) return;

    _inflight[url] = d3_json(url, function (err, data) {
        delete _inflight[url];
        callback(err, data);
    });
}


export default {

    init: function() {
        _inflight = {};
        _wikibaseCache = {};
        _localeIds = {};
    },


    reset: function() {
        _forEach(_inflight, function(req) { req.abort(); });
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
        var locale = _localeIds[langCode];
        var preferredPick, localePick;
        _forEach(entity.claims[property], function(stmt) {
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


    getDescription: function(entity) {
        if (entity.descriptions) {
            // Assume that there will be at most two languages because of
            // how we request it: English + possibly another one.
            // Pick non-English description if available (if we have more than one)
            var langs = Object.keys(entity.descriptions);
            if (langs.length) {
                var lng = langs.length > 1 && langs[0] === 'en' ? langs[1] : langs[0];
                return entity.descriptions[lng].value;
            }
        }
        return undefined;
    },


    toSitelink: function(key, value) {
        var result = value ? 'Tag:' + key + '=' + value : 'Key:' + key;
        return result.replace(/_/g, ' ').trim();
    },


    getEntity: function(params, callback) {
        var doRequest = params.debounce ? debouncedRequest : request;
        var self = this;
        var titles = [];
        var languages = ['en'];
        var result = {};
        var keySitelink = this.toSitelink(params.key);
        var tagSitelink = params.value ? this.toSitelink(params.key, params.value) : false;
        var localeSitelink;

        if (params.langCode && params.langCode !== 'en') {
            languages.push(params.langCode);
            if (!_localeIds[params.langCode]) {
                // This is the first time we are asking about this locale
                // Fetch corresponding entity (if it exists), and cache it.
                // If there is no such entry, cache `true` to avoid re-requesting it.
                localeSitelink = ('Locale:' + params.langCode).replace(/_/g, ' ').trim();
                titles.push(localeSitelink);
            }
        }

        if (_wikibaseCache[keySitelink]) {
            result.key = _wikibaseCache[keySitelink];
        } else {
            titles.push(keySitelink);
        }

        if (tagSitelink) {
            if (_wikibaseCache[tagSitelink]) {
                result.key = _wikibaseCache[tagSitelink];
            } else {
                titles.push(tagSitelink);
            }
        }

        if (!titles.length) {
            // Nothing to do, we already had everything in the cache
            return callback(null, result);
        }

        var obj = {
            action: 'wbgetentities',
            sites: 'wiki',
            titles: titles.join('|'),
            languages: languages.join('|'),
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
                var localeId = true;
                _forEach(d.entities, function(res) {
                    if (res.missing !== '') {
                        var title = res.sitelinks.wiki.title;
                        if (title === keySitelink) {
                            _wikibaseCache[keySitelink] = res;
                            result.key = res;
                        } else if (title === tagSitelink) {
                            _wikibaseCache[tagSitelink] = res;
                            result.tag = res;
                        } else if (title === localeSitelink) {
                            localeId = res.id;
                        } else {
                            console.log('Unexpected title ' + title);
                        }
                    }
                });

                if (localeSitelink) {
                    // If locale ID is not found, set cache to true to prevent repeated queries
                    self.addLocale(params.langCode, localeId);
                }

                callback(null, result);
            }
        });
    },


    addLocale: function(langCode, qid) {
        // Makes it easier to unit test
        _localeIds[langCode] = qid;
    },

    apibase: function(_) {
        if (!arguments.length) return apibase;
        apibase = _;
        return this;
    }

};
