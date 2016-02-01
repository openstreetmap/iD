var fs = require('fs');
var sources = require('editor-imagery-index/imagery.json');
var imagery = [];

var blacklist = {
    "TIGER 2012 Roads Overlay": true
};

var whitelist = [{
    "name": "Locator Overlay",
    "url": "http://{switch:a,b,c}.tiles.mapbox.com/v4/openstreetmap.map-inh76ba2/{zoom}/{x}/{y}.png?access_token=pk.eyJ1Ijoib3BlbnN0cmVldG1hcCIsImEiOiJncjlmd0t3In0.DmZsIeOW-3x-C5eX-wAqTw",
    "description": "Shows major features to help orient you.",
    "overlay": true,
    "default": true,
    "extent": { "max_zoom": 16 },
    "type": "tms",
    "attribution": {
        "url": "http://www.mapbox.com/about/maps/",
        "text": "Terms & Feedback"
    }
},{
    "id": "MAPNIK",
    "name": "OpenStreetMap (Standard)",
    "url": "http://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png",
    "description": "The default OpenStreetMap layer.",
    "default": true,
    "extent": { "max_zoom": 19 },
    "type": "tms",
    "attribution": {
        "url": "http://openstreetmap.org/",
        "text": "\u00a9 OpenStreetMap contributors, CC-BY-SA"
    }
}];

var descriptions = {
    'Mapbox Satellite': 'Satellite and aerial imagery.',
    'Bing aerial imagery': 'Satellite and aerial imagery.'
};

sources.concat(whitelist).forEach(function(source) {
    if (source.type !== 'tms' && source.type !== 'bing')
        return;
    if (source.name in blacklist)
        return;

    var im = {
        name: source.name,
        type: source.type
    };

    var description = source.description || descriptions[im.name];
    if (description) im.description = description;

    im.template = source.url;

    var extent = source.extent || {};

    if (extent.min_zoom || extent.max_zoom) {
        im.scaleExtent = [
            extent.min_zoom || 0,
            extent.max_zoom || 20
        ];
    }

    if (extent.polygon) {
        im.polygon = extent.polygon;
    } else if (extent.bbox) {
        im.polygon = [[
            [extent.bbox.min_lon, extent.bbox.min_lat],
            [extent.bbox.min_lon, extent.bbox.max_lat],
            [extent.bbox.max_lon, extent.bbox.max_lat],
            [extent.bbox.max_lon, extent.bbox.min_lat],
            [extent.bbox.min_lon, extent.bbox.min_lat]
        ]];
    }

    if (source.name == 'Locator Overlay') {
        im.overzoom = false;
    }

    var attribution = source.attribution || {};
    if (attribution.url) {
        im.terms_url = attribution.url;
    }
    if (attribution.text) {
        im.terms_text = attribution.text;
    }
    if (attribution.html) {
        im.terms_html = attribution.html;
    }

    ['id', 'default', 'overlay', 'best'].forEach(function(a) {
        if (source[a]) {
            im[a] = source[a];
        }
    });

    imagery.push(im);
});

imagery.sort(function(a, b) {
    return a.name.localeCompare(b.name);
});

fs.writeFileSync('data/imagery.json', JSON.stringify(imagery, null, 4));
