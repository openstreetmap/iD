iD.countryCode  = function() {
    var countryCode = {},
        endpoint = 'https://nominatim.openstreetmap.org/reverse?';

    if (!iD.countryCode.cache) {
        iD.countryCode.cache = rbush();
    }

    var cache = iD.countryCode.cache;

    countryCode.search = function(location, callback) {
        var countryCodes = cache.search([location[0], location[1], location[0], location[1]]);

        if (countryCodes.length > 0)
            return callback(null, countryCodes[0][4]);

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

                cache.insert([extent[0][0], extent[0][1], extent[1][0], extent[1][1], result.address.country_code]);

                callback(null, result.address.country_code);
            });
    };

    return countryCode;
};
