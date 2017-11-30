import _assign from 'lodash-es/assign';
import _forEach from 'lodash-es/forEach';

import { json as d3_json } from 'd3-request';

import rbush from 'rbush';
import { geoExtent } from '../geo';
import { utilQsString } from '../util';


var apibase = 'https://nominatim.openstreetmap.org/',
    inflight = {},
    nominatimCache;


export default {

    init: function() {
        inflight = {};
        nominatimCache = rbush();
    },

    reset: function() {
        _forEach(inflight, function(req) { req.abort(); });
        inflight = {};
        nominatimCache = rbush();
    },


    countryCode: function (location, callback) {
        this.reverse(location, function(err, result) {
            if (err) {
                return callback(err);
            } else if (result.address) {
                return callback(null, result.address.country_code);
            } else {
                return callback('Unable to geocode', null);
            }
        });
    },


    reverse: function (location, callback) {
        var cached = nominatimCache.search(
            { minX: location[0], minY: location[1], maxX: location[0], maxY: location[1] }
        );

        if (cached.length > 0) {
            return callback(null, cached[0].data);
        }

        var params = { zoom: 13, format: 'json', addressdetails: 1, lat: location[1], lon: location[0] };
        var url = apibase + 'reverse?' + utilQsString(params);
        if (inflight[url]) return;

        inflight[url] = d3_json(url, function(err, result) {
            delete inflight[url];

            if (err) {
                return callback(err);
            } else if (result && result.error) {
                return callback(result.error);
            }

            var extent = geoExtent(location).padByMeters(200);
            nominatimCache.insert(_assign(extent.bbox(), {data: result}));

            callback(null, result);
        });
    },


    search: function (val, callback) {
        var searchVal = encodeURIComponent(val);
        var url = apibase + 'search/' + searchVal + '?limit=10&format=json';
        if (inflight[url]) return;

        inflight[url] = d3_json(url, function(err, result) {
            delete inflight[url];
            callback(err, result);
        });
    }

};
