import rbush from 'rbush';

export function nominatim() {
    var nominatim = {},
        endpoint = 'https://nominatim.openstreetmap.org/reverse?';


    nominatim.countryCode = function(location, callback) {
        var cache = iD.services.nominatim.cache,
            countryCodes = cache.search({ minX: location[0], minY: location[1], maxX: location[0], maxY: location[1] });

        if (countryCodes.length > 0)
            return callback(null, countryCodes[0].data);

        d3.json(endpoint +
            iD.util.qsString({
                format: 'json',
                addressdetails: 1,
                lat: location[1],
                lon: location[0]
            }), function(err, result) {
                if (err)
                    return callback(err);
                else if (result && result.error)
                    return callback(result.error);

                var extent = iD.geo.Extent(location).padByMeters(1000);

                cache.insert(Object.assign(extent.bbox(), { data: result.address.country_code }));

                callback(null, result.address.country_code);
            });
    };

    nominatim.reset = function() {
        iD.services.nominatim.cache = rbush();
        return this;
    };

    if (!iD.services.nominatim.cache) {
        nominatim.reset();
    }

    return nominatim;
}

