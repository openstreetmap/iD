import * as d3 from 'd3';
import { Extent } from '../geo/index';
import { qsString } from '../util/index';
import rbush from 'rbush';

var endpoint, cache;

export function init() {
    endpoint = 'https://nominatim.openstreetmap.org/reverse?';
    if (!cache) {
        reset();
    }
}

export function reset() {
    cache = rbush();
}

export function countryCode(location, callback) {
    var countryCodes = cache.search({ minX: location[0], minY: location[1], maxX: location[0], maxY: location[1] });

    if (countryCodes.length > 0)
        return callback(null, countryCodes[0].data);

    d3.json(endpoint +
        qsString({
            format: 'json',
            addressdetails: 1,
            lat: location[1],
            lon: location[0]
        }), function(err, result) {
            if (err)
                return callback(err);
            else if (result && result.error)
                return callback(result.error);

            var extent = Extent(location).padByMeters(1000);

            cache.insert(Object.assign(extent.bbox(), { data: result.address.country_code }));

            callback(null, result.address.country_code);
        });
}
