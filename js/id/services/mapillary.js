iD.services.mapillary  = function() {
    var mapillary = {},
        apiBase = 'https://a.mapillary.com/v2/',
        urlSearch = 'search/s/geojson',
        urlImage = 'https://www.mapillary.com/map/im/',
        urlThumb = 'https://d1cuyjsrcm0gby.cloudfront.net/',
        clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi';


    mapillary.images = function(location, callback) {
        var cache = iD.services.mapillary.cache;
    };

    mapillary.reset = function() {
        iD.services.mapillary.cache = rbush();
        return mapillary;
    };


    if (!iD.services.mapillary.cache) {
        mapillary.reset();
    }

    return mapillary;
};
