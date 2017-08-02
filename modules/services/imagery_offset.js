import * as d3 from 'd3';
import _ from 'lodash';
import rbush from 'rbush';
import { geoExtent, geoSphericalDistance } from '../geo/index';
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
    getImageryID: function(url) {
        if (url == null) return;

        url = url.toLowerCase();
        if (url.indexOf('tiles.virtualearth.net') > -1) return 'bing';

        if (url.match(/.+tiles\.mapbox\.com\/v[3-9]\/openstreetmap\.map.*/))
            return 'mapbox';

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

        var qparams = {};
        var qparamsStr = query.length > 1 ? query.slice(1).split('&') : '';

        qparamsStr.forEach(function(param) {
            var kv = param.split('=');
            kv[0] = kv[0].toLowerCase();

            // TMS: skip parameters with variable values and Mapbox's access token
            if (
                (kv.length > 1 &&
                    kv[1].indexOf('{') >= 0 &&
                    kv[1].indexOf('}') > 0) ||
                kv[0] === 'access_token'
            ) {
                return;
            }
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
    match: function(location, imageryId, data) {
        // TOFIX: need to figure out the closest distance
        //  to start with, ideally it should be distance of
        // center screen to nearest edge.
        var closestDistance = Infinity;
        var matchedImagery;

        data
            .filter(function(d) {
                return d.data.imagery === imageryId;
            })
            .forEach(function(d) {
                var imagery = d.data;
                var dist = geoSphericalDistance(
                    [parseFloat(imagery.lon), parseFloat(imagery.lat)],
                    location
                );
                if (dist < closestDistance) {
                    closestDistance = dist;
                    matchedImagery = imagery;
                    return d.data;
                }
            });
        return matchedImagery;
    },
    search: function(location, url, callback) {
        var cached = offsetCache.search({
            minX: location[0],
            minY: location[1],
            maxX: location[0],
            maxY: location[1]
        });

        var imageryId = this.getImageryID(url);

        if (cached.length > 0) {
            return callback(null, this.match(location, imageryId, cached));
        }

        var params = {
            radius: 10, // default is 10kms
            format: 'json',
            lat: location[1],
            lon: location[0]
        };

        var databaseUrl = apibase + utilQsString(params);

        if (inflight[databaseUrl]) return;
        var that = this;
        inflight[databaseUrl] = d3.json(databaseUrl, function(err, result) {
            delete inflight[databaseUrl];

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
            result
                .filter(function(imagery) {
                    return imagery.type === 'offset';
                })
                .forEach(function(imagery) {
                    var extent = geoExtent([
                        parseFloat(imagery.lon),
                        parseFloat(imagery.lat)
                    ]).padByMeters(9 * 1000); // need to figure out how much to pad

                    offsetCache.insert(
                        _.assign(extent.bbox(), { data: imagery })
                    );
                });
            callback(null, that.match(location, imageryId, cached));
        });
    }
};
