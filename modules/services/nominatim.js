import * as d3 from 'd3';
import _ from 'lodash';
import rbush from 'rbush';
import { geoExtent } from '../geo/index';
import { utilQsString } from '../util/index';


var apibase = 'https://nominatim.openstreetmap.org/',
    nominatimCache;


export default {

    init: function() { nominatimCache = rbush(); },
    reset: function() { nominatimCache = rbush(); },


    countryCode: function (location, callback) {
        var countryCodes = nominatimCache.search(
            { minX: location[0], minY: location[1], maxX: location[0], maxY: location[1] }
        );

        if (countryCodes.length > 0) {
            return callback(null, countryCodes[0].data);
        }

        d3.json(apibase + 'reverse?' +
            utilQsString({
                format: 'json',
                addressdetails: 1,
                lat: location[1],
                lon: location[0]
            }), function(err, result) {
                if (err)
                    return callback(err);
                else if (result && result.error)
                    return callback(result.error);

                var extent = geoExtent(location).padByMeters(1000);
                nominatimCache.insert(_.assign(extent.bbox(),
                    { data: result.address.country_code }
                ));

                callback(null, result.address.country_code);
            }
        );
    },


    search: function (val, callback) {
        var searchVal = encodeURIComponent(val);
        d3.json(apibase + 'search/' + searchVal + '?limit=10&format=json', callback);
    }

};
