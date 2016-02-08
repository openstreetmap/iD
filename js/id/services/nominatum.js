iD.services.nominatum  = function() {
    var nominatum = {},
        endpoint = 'https://nominatim.openstreetmap.org/reverse?';


    nominatum.countryCode = function(location, callback) {
        var cache = iD.services.nominatum.cache,
            countryCodes = cache.search([location[0], location[1], location[0], location[1]]);

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

    nominatum.reset = function() {
        iD.services.nominatum.cache = rbush();
        return nominatum;
    };


    if (!iD.services.nominatum.cache) {
        nominatum.reset();
    }

    return nominatum;
};
