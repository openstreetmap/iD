import { json as d3_json } from 'd3-fetch';

import RBush from 'rbush';
import { geoExtent } from '../geo';
import { utilQsString } from '../util';
import { localizer } from '../core';

import { nominatimApiUrl } from '../../config/id.js';


const apibase = nominatimApiUrl;
let _inflight = {};
let _nominatimCache;


export default {

    init: function() {
        _inflight = {};
        _nominatimCache = new RBush();
    },

    reset: function() {
        Object.values(_inflight).forEach(function(controller) { controller.abort(); });
        _inflight = {};
        _nominatimCache = new RBush();
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


    reverse: function (loc, callback) {
        const cached = _nominatimCache.search(
            { minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1] }
        );

        if (cached.length > 0) {
            if (callback) callback(null, cached[0].data);
            return;
        }

        const params = { zoom: 13, format: 'json', addressdetails: 1, lat: loc[1], lon: loc[0] };
        const url = apibase + 'reverse?' + utilQsString(params);

        if (_inflight[url]) return;
        const controller = new AbortController();
        _inflight[url] = controller;

        d3_json(url, {
            signal: controller.signal,
            headers: {
                'Accept-Language': localizer.localeCodes().join(',')
            }
        })
            .then(function(result) {
                delete _inflight[url];
                if (result && result.error) {
                    throw new Error(result.error);
                }
                const extent = geoExtent(loc).padByMeters(200);
                _nominatimCache.insert(Object.assign(extent.bbox(), {data: result}));
                if (callback) callback(null, result);
            })
            .catch(function(err) {
                delete _inflight[url];
                if (err.name === 'AbortError') return;
                if (callback) callback(err.message);
            });
    },


    search: function (val, callback) {
        const params = {
            q: val,
            limit:10,
            format: 'json'
        };
        const url = apibase + 'search?' + utilQsString(params);

        if (_inflight[url]) return;
        const controller = new AbortController();
        _inflight[url] = controller;

        d3_json(url, {
            signal: controller.signal,
            headers: {
                'Accept-Language': localizer.localeCodes().join(',')
            }
        })
            .then(function(result) {
                delete _inflight[url];
                if (result && result.error) {
                    throw new Error(result.error);
                }
                if (callback) callback(null, result);
            })
            .catch(function(err) {
                delete _inflight[url];
                if (err.name === 'AbortError') return;
                if (callback) callback(err.message);
            });
    }

};
