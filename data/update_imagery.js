var fs = require('fs');
var sources = require('editor-layer-index/imagery.json');
var imagery = [];

// ignore imagery more than 20 years old..
var cutoffDate = new Date();
cutoffDate.setFullYear(cutoffDate.getFullYear() - 20);

var blacklist = {
    'hike_n_bike': true,                  // 'Hike & Bike'
    'osm-mapnik-german_style': true,      // 'OpenStreetMap (German Style)'
    'osm-mapnik-black_and_white': true,   // 'OpenStreetMap (Standard Black & White)'
    'skobbler': true,                     // 'Skobbler'
    'openpt_map': true,                   // 'OpenPT Map (overlay)'
    'tf-cycle': true,                     // 'Thunderforest OpenCycleMap'
    'qa_no_address': true,                // 'QA No Address'

    'OSM-US-TIGER-Roads_Overlay-2012': true,

    'Waymarked_Trails-Cycling': true,
    'Waymarked_Trails-Hiking': true,
    'Waymarked_Trails-MTB': true,
    'Waymarked_Trails-Skating': true,
    'Waymarked_Trails-Winter_Sports': true,

    'OSM_Inspector-Addresses': true,
    'OSM_Inspector-Geometry': true,
    'OSM_Inspector-Highways': true,
    'OSM_Inspector-Multipolygon': true,
    'OSM_Inspector-Places': true,
    'OSM_Inspector-Routing': true,
    'OSM_Inspector-Tagging': true
};

var whitelist = [
    // Add custom sources here if needed.
];

var descriptions = {
    'Bing': 'Satellite and aerial imagery.',
    'Mapbox': 'Satellite and aerial imagery.',
    'MAPNIK': 'The default OpenStreetMap layer.'
};

sources.concat(whitelist).forEach(function(source) {
    if (source.type !== 'tms' && source.type !== 'bing') return;
    if (source.id in blacklist) return;

    if (source.end_date) {
        var endDate = new Date(source.end_date),
            isValid = !isNaN(endDate.getTime());
        if (isValid && endDate <= cutoffDate) return;
    }

    var im = {
        id: source.id,
        name: source.name,
        type: source.type,
        template: source.url
    };

    var description = source.description || descriptions[im.id];
    if (description) im.description = description;

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

    if (source.id === 'mapbox_locator_overlay') {
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

    ['default', 'overlay', 'best'].forEach(function(a) {
        if (source[a]) {
            im[a] = source[a];
        }
    });

    imagery.push(im);
});

imagery.sort(function(a, b) {
    return a.name.localeCompare(b.name);
});

fs.writeFileSync('data/imagery.json', JSON.stringify({ dataImagery: imagery }, null, 4));
