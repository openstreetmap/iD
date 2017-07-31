import * as d3 from 'd3';
import _ from 'lodash';
import rbush from 'rbush';
import { geoExtent } from '../geo/index';
import { utilQsString } from '../util/index';

var apibase = 'http://offsets.textual.ru/get?',
    inflight = {},
    offsetCache;

export default {
    init: function() {
        inflight = {};
        offsetCache = rbush();
        window.offsetCache = offsetCache;
    },

    reset: function() {
        _.forEach(inflight, function(req) {
            req.abort();
        });
        inflight = {};
        offsetCache = rbush();
    },
    getImageryID: function(url, imageryType) {
        if (url == null) return;
        console.log('url=', url)
        debugger;
        url = url.toLowerCase();
        if (imageryType === 'bing' || url.indexOf('tiles.virtualearth.net') > -1)
            return 'bing';
        // if (url.indexOf("scanex_irs") > )
        if (
            imageryType === 'TMS' &&
            url.match(/.+tiles\.mapbox\.com\/v[3-9]\/openstreetmap\.map.*/)
        )
            return 'mapbox';

        // does iD support WMS? if yes, how to detect
        var isWMS = false;

        // Remove protocol
        var i = url.indexOf('://');
        url = url.substring(i + 3);

        var query = '';
        // Split URL into address and query string
        var questionMarkIndex = url.indexOf('?');
        if (questionMarkIndex > 0) {
            query = url.slice(questionMarkIndex);
            url = url.slice(0, questionMarkIndex);
        }

        var removeWMSParams = [
            'srs',
            'width',
            'height',
            'bbox',
            'service',
            'request',
            'version',
            'format',
            'styles',
            'transparent'
        ];

        var qparams = {};
        var qparamsStr = query.length > 1 ? query.slice(1).split('&') : '';

        qparamsStr.forEach(function(param) {
            var kv = param.split('=');
            console.log(kv);
            kv[0] = kv[0].toLowerCase();
            // WMS: if this is WMS, remove all parameters except map and layers
            if (isWMS && removeWMSParams.indexOf(kv[0]) > -1) {
                return;
            }
            // TMS: skip parameters with variable values and Mapbox's access token
            if (
                (kv.length > 1 &&
                    kv[1].indexOf('{') >= 0 &&
                    kv[1].indexOf('}') > 0) ||
                kv[0] === 'access_token'
            ) {
                return;
            }
            console.log('here')
            qparams[kv[0].toLowerCase()] = kv.length > 1 ? kv[1] : null;
        });

        var sb = '';
        Object.keys(qparams).forEach(function(qk) {
            if (sb.length > 0) sb += '&';
            else if (query.length > 0) sb += '?';
            sb += qk + '=' + qparams[qk];
        });

        // TMS: remove /{zoom} and /{y}.png parts
        url = url.replace(/\/\{[^}]+\}(?:\.\w+)?/g, '');

        // TMS: remove variable parts
        url = url.replace(/\{[^}]+\}/g, '');

        while (url.indexOf('..') > -1) {
            url = url.replace('..', '.');
        }

        if (url.startsWith('.')) url = url.substring(1);

        return url + query;
    },
    search: function(location, url, callback) {
        console.log(this.getImageryID(url))
        var cached = offsetCache.search({
            minX: location[0],
            minY: location[1],
            maxX: location[0],
            maxY: location[1]
        });

        if (cached.length > 0) {
            return callback(
                null,
                cached.map(function(c) {
                    return c.data;
                })
            );
        }

        var params = {
            radius: 10, // default is 10kms
            format: 'json',
            lat: location[1],
            lon: location[0]
        };
        var url = apibase + utilQsString(params);
        if (inflight[url]) return;

        inflight[url] = d3.json(url, function(err, result) {
            delete inflight[url];

            if (err) {
                return callback(err);
            } else if (result && result.error) {
                return callback(result.error);
            }

            if (result.length < 2) {
                return callback('No imagery offset found.');
            }
            // the first entry is always a timestamp
            // which can be discarded.
            result = result.slice(1);
            result.forEach(function(imagery) {
                var extent = geoExtent([
                    parseFloat(imagery.lon),
                    parseFloat(imagery.lat)
                ]).padByMeters(1000); // need to figure out how much to pad

                offsetCache.insert(_.assign(extent.bbox(), { data: imagery }));
            });
            callback(null, result);
        });
    }
};
