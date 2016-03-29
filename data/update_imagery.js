var fs = require('fs');
var sources = require('editor-layer-index/imagery.json');
var imagery = [];

var blacklist = {
    "2u": true,
    "Hike & Bike": true,
    "OpenCycleMap": true,
    "OpenStreetMap (German Language)": true,
    "OpenStreetMap (German Style)": true,
    "OpenStreetMap (Sorbian Language)": true,
    "MapQuest OSM": true,
    "OpenStreetMap (Standard Black & White)": true,
    "Skobbler": true,

    "Stadtplan Z\u00fcrich": true, // https://github.com/osmlab/editor-imagery-index/issues/14
    "Public Transport (\u00d6PNV)": true, // https://github.com/osmlab/editor-imagery-index/issues/15

    "TIGER 2012 Roads Overlay": true, // https://github.com/openstreetmap/iD/pull/2010,

    "Waymarked Trails: Cycling": true,
    "Waymarked Trails: Hiking": true,
    "Waymarked Trails: MTB": true,
    "Waymarked Trails: Skating": true,
    "Waymarked Trails: Winter Sports": true,

    "OSM Inspector: Geometry": true,
    "OSM Inspector: Highways": true,
    "OSM Inspector: Multipolygon": true,
    "OSM Inspector: Places": true,
    "OSM Inspector: Tagging": true,
    "OSM Inspector: Addresses (EU)": true,
    "OSM Inspector: Boundaries (EU)": true,
    "OSM Inspector: Routing (EU)": true,

    "QA No Address": true
};

var whitelist = [
    // Add custom sources here if needed.
];

var descriptions = {
    'Mapbox Satellite': 'Satellite and aerial imagery.',
    'Bing aerial imagery': 'Satellite and aerial imagery.',
    'OpenStreetMap (Standard)': 'The default OpenStreetMap layer.'
};

sources.concat(whitelist).forEach(function(source) {
    if (source.type !== 'tms' && source.type !== 'bing') return;
    if (source.name in blacklist) return;

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

    if (source.name === 'Locator Overlay') {
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
