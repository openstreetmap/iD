import _extend from 'lodash-es/extend';
import _find from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';
import _isEmpty from 'lodash-es/isEmpty';

import rbush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { request as d3_request } from 'd3-request';

import {
    utilRebind,
    utilTiler,
    utilQsString
} from '../util';


var tiler = utilTiler();
var dispatch = d3_dispatch('authLoading', 'authDone', 'change', 'loading', 'loaded', 'loadedKeepRight');

var _keepRightCache = { loaded: {}, inflight: {}, keepRight: {}, rtree: rbush()};
var _off;
var _keepRightZoom = 16;

var apiBase = 'https://www.keepright.at/export.php?';

// TODO: remove this
    var schema = {
        'error_type': '',
        'object_type': '',
        'object_id': '',
        'comment': '',
        'error_id':'',
        'schema': '',
        'description': '',
        'title': ''
    };


function abortRequest(i) {
    if (i) {
        i.abort();
    }
}


function abortUnwantedRequests(cache, tiles) {
    _forEach(cache.inflight, function(v, k) {
        var wanted = _find(tiles, function(tile) { return k === tile.id; });
        if (!wanted) {
            abortRequest(v);
            delete cache.inflight[k];
        }
    });
}


export default {
    init: function() {
        if (!_keepRightCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
        _forEach(_keepRightCache.inflight, abortRequest);

        _keepRightCache = { loaded: {}, inflight: {}, keepRight: {}, rtree: rbush()};
    },

    loadKeepRight: function(context, projection, keepRightOptions) {
        keepRightOptions = _extend({ 'format': 'geojson' });
        if (_off) return;

        var that = this;
        var path = apiBase +
            'format=' + keepRightOptions.format +
            '&ch=' + keepRightOptions.ch.join() + '&';

        // determine the needed tiles to cover the view
        var tiles = tiler.zoomExtent([_keepRightZoom, _keepRightZoom]).getTiles(projection);

        // abort inflight requests that are no longer needed
        var hadRequests = !_isEmpty(_keepRightCache.inflight);
        abortUnwantedRequests(_keepRightCache, tiles);
        if (hadRequests && _isEmpty(_keepRightCache.inflight)) {
            dispatch.call('loaded');    // stop the spinner
        }

        // issue new requests..
        tiles.forEach(function(tile) {
            if (_keepRightCache.loaded[tile.id] || _keepRightCache.inflight[tile.id]) return;
            if (_isEmpty(_keepRightCache.inflight)) {
                dispatch.call('loading');   // start the spinner
            }

            var cache = _keepRightCache;
            var rect = tile.extent.rectangle();
            var nextPath = path +
                utilQsString({
                    left: rect[0],
                    bottom: [3],
                    right: rect[2],
                    top: rect[1]
                });


            function callbackExample() {
                // TODO: implement
            }

            var exampleOptions = {}; // TODO: implement

            _keepRightCache.inflight[tile.id] = that.loadFromAPI(
                nextPath,
                callbackExample,
                exampleOptions
            );
        });
    },

    loadFromAPI: function(path, callback, options) {
        var result =  d3_request(path) // TODO: rturn or somethign, dont save to var
            .mimeType('application/json') // TODO: only have this as a response if the input format is json
            .header('Content-type', 'application/x-www-form-urlencoded')
            .response(function(xhr) {
                console.log('xhr: ', xhr);
                return JSON.parse(xhr.responseText);
            })
            .get(function(err, data) {
                console.log(data);
            });
        console.log('result: ', result);
    }
};