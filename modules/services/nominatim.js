import { json as d3_json } from 'd3-request';

import rbush from 'rbush';
import { geoExtent } from '../geo';
import { utilQsString } from '../util';


var apibase = 'https://nominatim.openstreetmap.org/';
var _inflight = {};
var _nominatimCache;


export default {

    init: function() {
        _inflight = {};
        _nominatimCache = rbush();
    },

    reset: function() {
        Object.values(_inflight).forEach(function(req) { req.abort(); });
        _inflight = {};
        _nominatimCache = rbush();
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
        var cached = _nominatimCache.search(
            { minX: location[0], minY: location[1], maxX: location[0], maxY: location[1] }
        );

        if (cached.length > 0) {
            return callback(null, cached[0].data);
        }

        var params = { zoom: 13, format: 'json', addressdetails: 1, lat: location[1], lon: location[0] };
        var url = apibase + 'reverse?' + utilQsString(params);
        if (_inflight[url]) return;

        _inflight[url] = d3_json(url, function(err, result) {
            delete _inflight[url];

            if (err) {
                return callback(err);
            } else if (result && result.error) {
                return callback(result.error);
            }

            var extent = geoExtent(location).padByMeters(200);
            _nominatimCache.insert(Object.assign(extent.bbox(), {data: result}));

            callback(null, result);
        });
    },


    search: function (val, callback) {
        var searchVal = encodeURIComponent(val);
        var url = apibase + 'search/' + searchVal + '?limit=10&format=json';
        if (_inflight[url]) return;

        _inflight[url] = d3_json(url, function(err, result) {
            delete _inflight[url];
            callback(err, result);
        });
    }

};
