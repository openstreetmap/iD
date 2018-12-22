import _debounce from 'lodash-es/debounce';
import _forEach from 'lodash-es/forEach';

import { json as d3_json } from 'd3-request';

import { utilQsString } from '../util';


var apibase = 'https://wiki.openstreetmap.org/w/api.php';
var _inflight = {};
var _wikibaseCache = {};


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
    },


    reset: function() {
        _forEach(_inflight, function(req) { req.abort(); });
        _inflight = {};
    },


    /** List of data items representing language regions.
     *  To regenerate, use Sophox query:  http://tinyurl.com/y6v9ne2c (every instance of Q6999)
     *  A less accurate list can be seen here (everything that links to Q6999):
     *  https://wiki.openstreetmap.org/w/index.php?title=Special%3AWhatLinksHere&target=Item%3AQ6999&namespace=120
     */
    regionCodes: {
        ar: 'Q7780', az: 'Q7781', bg: 'Q7782', bn: 'Q7783', ca: 'Q7784', cs: 'Q7785', da: 'Q7786',
        de: 'Q6994', el: 'Q7787', es: 'Q7788', et: 'Q7789', fa: 'Q7790', fi: 'Q7791', fr: 'Q7792',
        gl: 'Q7793', hr: 'Q7794', ht: 'Q7795', hu: 'Q7796', id: 'Q7797', it: 'Q7798', ja: 'Q7799',
        ko: 'Q7800', lt: 'Q7801', lv: 'Q7802', ms: 'Q7803', nl: 'Q7804', no: 'Q7805', pl: 'Q7806',
        pt: 'Q7807', ro: 'Q7808', ru: 'Q7809', sk: 'Q7810', sq: 'Q7811', sv: 'Q7812', tr: 'Q7813',
        uk: 'Q7814', vi: 'Q7815', yue: 'Q7816', 'zh-hans': 'Q7817', 'zh-hant': 'Q7818',
    },


    /**
     * Get the best value for the property, or undefined if not found
     * @param entity object from wikibase
     * @param property string e.g. 'P4' for image
     * @param langCode string e.g. 'fr' for French
     */
    claimToValue: function(entity, property, langCode) {
        if (!entity.claims[property]) return undefined;
        var region = this.regionCodes[langCode];
        var preferredPick, regionPick;
        _forEach(entity.claims[property], function(stmt) {
            // If exists, use value limited to the needed language (has a qualifier P26 = region)
            // Or if not found, use the first value with the "preferred" rank
            if (!preferredPick && stmt.rank === 'preferred') {
                preferredPick = stmt;
            }
            if (stmt.qualifiers && stmt.qualifiers.P26 && stmt.qualifiers.P26[0].datavalue.value.id === region) {
                regionPick = stmt;
            }
        });
        var result = regionPick || preferredPick;

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

        var titles = [];
        var languages = ['en'];
        var result = {};
        var keySitelink = this.toSitelink(params.key);
        var tagSitelink = params.value ? this.toSitelink(params.key, params.value) : false;

        if (params.langCode && params.langCode !== 'en') {
            languages.push(params.langCode);
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
                _forEach(d.entities, function(res) {
                    if (res.missing !== '') {
                        var title = res.sitelinks.wiki.title;
                        if (title === keySitelink) {
                            _wikibaseCache[keySitelink] = res;
                            result.key = res;
                        } else if (title === tagSitelink) {
                            _wikibaseCache[tagSitelink] = res;
                            result.tag = res;
                        } else {
                            console.log('Unexpected title ' + title);
                        }
                    }
                });

                callback(null, result);
            }
        });
    },


    apibase: function(_) {
        if (!arguments.length) return apibase;
        apibase = _;
        return this;
    }

};
