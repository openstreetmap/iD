iD.countryCode  = function() {
    var countryCode = {},
        endpoint = 'http://countrycode.refactory.at/?';

    if (!iD.countryCode.cache) {
        iD.countryCode.cache = [];
    }

    var cache = iD.countryCode.cache;

    countryCode.search = function(location, callback) {
        var country = _.find(cache, function (country) {
            return iD.geo.pointInFeature(location, country);
        });

        if (country)
            return callback(null, country);

        d3.json(endpoint +
            iD.util.qsString({
                lat: location[1],
                lon: location[0],
                geometry: 1
            }), function(err, country) {
                if (err)
                    return callback(err);
                else if (country && country.error)
                    return callback(country.error);

                cache.push(country);

                callback(null, country);
            });
    };

    return countryCode;
};
