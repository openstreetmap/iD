import { json as d3_json } from 'd3-fetch';

import RBush from 'rbush';
import { geoExtent } from '../geo';
import { utilQsString } from '../util';
import { localizer } from '../core';

import { nominatimApiUrl } from '../../config/id.js';
import type { Vec2 } from '../geo/vector';
import type { WithBbox } from '../util/partition';

interface NominatimResult {
    osm_type?: 'node' | 'way' | 'relation';
    osm_id?: number;
    address?: {
        country_code?: string;
        // there are other properties, they can
        // be defined in the future, if required.
    };
}

type NominatimReverseResult = NominatimResult & { error?: string };
type NominatimSearchResult = NominatimResult[] & { error?: string };


var apibase = nominatimApiUrl;
let _inflight: { [key: string]: AbortController } = {};
let _nominatimCache: RBush<WithBbox<NominatimResult>>;


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


    countryCode: function (location: Vec2, callback: Callback<string | undefined>) {
        this.reverse(location, function(err, result) {
            if (err) {
                return callback(err);
            } else if (result?.address) {
                return callback(null, result.address.country_code);
            } else {
                return callback(new Error('Unable to geocode'));
            }
        });
    },


    reverse: function (loc: Vec2, callback: Callback<NominatimResult>) {
        var cached = _nominatimCache.search(
            { minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1] }
        );

        if (cached.length > 0) {
            if (callback) callback(null, cached[0].data);
            return;
        }

        var params = { zoom: 13, format: 'json', addressdetails: 1, lat: loc[1], lon: loc[0] };
        var url = apibase + 'reverse?' + utilQsString(params);

        if (_inflight[url]) return;
        var controller = new AbortController();
        _inflight[url] = controller;

        d3_json(url, {
            signal: controller.signal,
            headers: {
                'Accept-Language': localizer.localeCodes().join(',')
            }
        })
            .then(function(_result) {
                const result = _result as NominatimReverseResult;
                delete _inflight[url];
                if (result && result.error) {
                    throw new Error(result.error);
                }
                var extent = geoExtent(loc).padByMeters(200);
                _nominatimCache.insert(Object.assign(extent.bbox(), {data: result}));
                if (callback) callback(null, result);
            })
            .catch(function(err) {
                delete _inflight[url];
                if (err.name === 'AbortError') return;
                if (callback) callback(err);
            });
    },


    search: function (val: string, callback: Callback<NominatimResult[]>) {
        const params = {
            q: val,
            limit:10,
            format: 'json'
        };
        var url = apibase + 'search?' + utilQsString(params);

        if (_inflight[url]) return;
        var controller = new AbortController();
        _inflight[url] = controller;

        d3_json(url, {
            signal: controller.signal,
            headers: {
                'Accept-Language': localizer.localeCodes().join(',')
            }
        })
            .then(function(_result) {
                const result = _result as NominatimSearchResult;
                delete _inflight[url];
                if (result && result.error) {
                    throw new Error(result.error);
                }
                if (callback) callback(null, result);
            })
            .catch(function(err) {
                delete _inflight[url];
                if (err.name === 'AbortError') return;
                if (callback) callback(err);
            });
    }

};
