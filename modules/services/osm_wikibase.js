import _debounce from 'lodash-es/debounce';
import _forEach from 'lodash-es/forEach';

import { json as d3_json } from 'd3-request';

import { utilQsString } from '../util';
import { currentLocale } from '../util/locale';


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


    docs: function(params, callback) {
        var doRequest = params.debounce ? debouncedRequest : request;

        // if (params.value) path = 'tag/wiki_pages?';
        // else if (params.rtype) path = 'relation/wiki_pages?';

        var obj = {
            action: 'wbgetentities',
            sites: 'wiki',
            titles: 'Tag:amenity=parking',
            languages: 'en',
            origin: '*',
            formatversion: 2,
            format: 'json'
        }
        var url = apibase + '?' + utilQsString(obj);
        doRequest(url, function(err, d) {
            if (err) {
                callback(err);
            } else {
                _wikibaseCache[url] = d.data;
                callback(null, d.data);
            }
        });
    },


    apibase: function(_) {
        if (!arguments.length) return apibase;
        apibase = _;
        return this;
    }

};
