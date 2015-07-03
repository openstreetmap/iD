iD.services.nominatim  = function() {
    var nominatim = {},
        endpoint = 'https://nominatim.openstreetmap.org/reverse?';


    nominatim.countryCode = function(location, callback) {
        var cache = iD.services.nominatim.cache,
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

                cache.insert(extent.rectangle().concat(result.address.country_code));

                callback(null, result.address.country_code);
            });
    };

    nominatim.reset = function() {
        iD.services.nominatim.cache = rbush();
        return nominatim;
    };


    if (!iD.services.nominatim.cache) {
        nominatim.reset();
    }

    return nominatim;
};
