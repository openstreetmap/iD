var fs = require('fs');
var sources = require('editor-imagery-index/imagery.json');
var imagery = [];

// CENSORSHIP! No, these are just layers that essentially duplicate other layers
// or which have no clear use case.
var censor = {
    "2u": true,
    "Hike & Bike": true,
    "OpenCycleMap": true,
    "OpenStreetMap (German Language)": true,
    "OpenStreetMap (German Style)": true,
    "OpenStreetMap (Sorbian Language)": true,
    "MapQuest OSM": true,
    "OpenStreetMap (Mapnik Black & White)": true,
    "Skobbler": true,

    "Stadtplan Z\u00fcrich": true, // https://github.com/osmlab/editor-imagery-index/issues/14
    "Public Transport (\u00d6PNV)": true // https://github.com/osmlab/editor-imagery-index/issues/15
};

var descriptions = {
    'MapBox Satellite': 'Satellite and aerial imagery.',
    'OpenStreetMap (Mapnik)': 'The default OpenStreetMap layer.',
    'TIGER 2012 Roads Overlay': 'Public domain road data from the US Government.',
    'Bing aerial imagery': 'Satellite and aerial imagery.',
    'NAIP': 'National Agriculture Imagery Program'
};

sources.forEach(function(source) {
    if (source.type !== 'tms' && source.type !== 'bing')
        return;
    if (source.name in censor)
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

    var attribution = source.attribution || {};
    if (attribution.url) {
        im.terms_url = attribution.url;
    }
    if (attribution.text) {
        im.terms_text = attribution.text;
    }

    ['id', 'default', 'overlay'].forEach(function(a) {
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
