iD.wiki = function() {
    var wiki = {},
        endpoint = 'http://wiki.openstreetmap.org/w/api.php';
    // ?action=query&prop=imageinfo&titles=Image:Residential.jpg&iiprop=url%7Ccontent&format=json&callback=foo',

    wiki.image = function(img, callback) {
        d3.jsonp(endpoint + '?' +
            iD.util.qsString({
                action: 'query',
                prop: 'imageinfo',
                titles: img,
                iiprop: 'url',
                format: 'json',
                callback: '{callback}'
            }), function(d) {
                try {
                    callback(null,
                        d.query.pages[Object.keys(d.query.pages)[0]].imageinfo[0].url);
                } catch(e) {
                    callback(new Error('Image not found'));
                }
            });
    };

    wiki.endpoint = function(_) {
        if (!arguments.length) return endpoint;
        endpoint = _;
        return wiki;
    };

    return wiki;
};
