const fs = require('fs');
const sources = require('editor-layer-index/imagery.json');
const prettyStringify = require('json-stringify-pretty-compact');
var imagery = [];

// ignore imagery more than 20 years old..
var cutoffDate = new Date();
cutoffDate.setFullYear(cutoffDate.getFullYear() - 20);

const blacklist = {
    'osmbe': true,                        // 'OpenStreetMap (Belgian Style)'
    'osmfr': true,                        // 'OpenStreetMap (French Style)'
    'osm-mapnik-german_style': true,      // 'OpenStreetMap (German Style)'
    'HDM_HOT': true,                      // 'OpenStreetMap (HOT Style)'
    'osm-mapnik-black_and_white': true,   // 'OpenStreetMap (Standard Black & White)'
    'osm-mapnik-no_labels': true,         // 'OpenStreetMap (Mapnik, no labels)'
    'OpenStreetMap-turistautak': true,    // 'OpenStreetMap (turistautak)'

    'hike_n_bike': true,                  // 'Hike & Bike'
    'landsat': true,                      // 'Landsat'
    'skobbler': true,                     // 'Skobbler'
    'public_transport_oepnv': true,       // 'Public Transport (ÖPNV)'
    'tf-cycle': true,                     // 'Thunderforest OpenCycleMap'
    'tf-landscape': true,                 // 'Thunderforest Landscape'
    'qa_no_address': true,                // 'QA No Address'
    'wikimedia-map': true,                // 'Wikimedia Map'

    'openinframap-petroleum': true,
    'openinframap-power': true,
    'openinframap-telecoms': true,
    'openpt_map': true,
    'openrailwaymap': true,
    'openseamap': true,
    'opensnowmap-overlay': true,

    'US-TIGER-Roads-2012': true,
    'US-TIGER-Roads-2014': true,

    'Waymarked_Trails-Cycling': true,
    'Waymarked_Trails-Hiking': true,
    'Waymarked_Trails-Horse_Riding': true,
    'Waymarked_Trails-MTB': true,
    'Waymarked_Trails-Skating': true,
    'Waymarked_Trails-Winter_Sports': true,

    'OSM_Inspector-Addresses': true,
    'OSM_Inspector-Geometry': true,
    'OSM_Inspector-Highways': true,
    'OSM_Inspector-Multipolygon': true,
    'OSM_Inspector-Places': true,
    'OSM_Inspector-Routing': true,
    'OSM_Inspector-Tagging': true,

    'EOXAT2018CLOUDLESS': true
};

const supportedWMSProjections = [
    'EPSG:3857',
    'EPSG:4326',
    'EPSG:900913', // EPSG:3857 alternatives codes
    'EPSG:3587',
    'EPSG:54004',
    'EPSG:41001',
    'EPSG:102113',
    'EPSG:102100',
    'EPSG:3785'
];

const whitelist = [
    // Add custom sources here if needed.
    {
        id: 'Maxar-Premium',
        name: 'Maxar Premium Imagery (Beta)',
        type: 'tms',
        default: true,
        attribution: {
            required: true,
            text: 'Terms & Feedback',
            url: 'https://wiki.openstreetmap.org/wiki/DigitalGlobe'
        },
        description: 'Maxar Premium is a mosaic composed of Maxar basemap with select regions filled with +Vivid or custom area of interest imagery, 50cm resolution or better, and refreshed more frequently with ongoing updates.',
        icon: 'https://osmlab.github.io/editor-layer-index/sources/world/Maxar.png',
        max_zoom: 22,
        url: '7586487389962e3f6e31ab2ed8ca321f2f3fe2cf87f1dedce8fc918b4692efd86fcd816ab8a35303effb1be9abe39b1cce3fe6db2c740044364ae68560822c88373d2c784325baf4e1fa007c6dbedab4cea3fa0dd86ee0ae4feeef032d33dcac28e4b16c90d55a42087c6b66526423ea1b4cc7e63c613940eb1c60f48270060bf41c5fcb6a628985ebe6801e9e71f041cc9f8df06b0345600376663e7dc1cdbc7df16876d8b5d006ed5782e6af4bfe2ff5a292',
        encrypted: true
    }, {
        id: 'Maxar-Standard',
        name: 'Maxar Standard Imagery (Beta)',
        type: 'tms',
        default: true,
        attribution: {
            required: true,
            text: 'Terms & Feedback',
            url: 'https://wiki.openstreetmap.org/wiki/DigitalGlobe'
        },
        description: 'Maxar Standard is a curated set of imagery covering 86% of the earth’s landmass, with 30-60cm resolution where available, backfilled by Landsat. Average age is 2.31 years, with some areas updated 2x per year.',
        icon: 'https://osmlab.github.io/editor-layer-index/sources/world/Maxar.png',
        max_zoom: 22,
        url: '7586487389962e3f6e31ab2ed8ca321f2f3fe2cf87f1dedce8fc918b4692efd86fcd816ab8a35303effb1be9abe39b1cce3fe6db2c740044364ae68560822c88373d2c784325baf4e1fa007c6dbedab4cea3fa0dd86ee0ae4feeef032d33dcac28e4b16c90d55a42087c6b66526423ea1b4cc7e63c613940eb1c60f48270060bf41c5fcb6a628985ebe6801e9e71f010c8c9d7fb6b534560012461377dc1cdb672f16827dfe0d005bf5685b7ac4ea97cf5f795',
        encrypted: true
    }
];


sources.concat(whitelist).forEach(function(source) {
    if (source.type !== 'tms' && source.type !== 'wms' && source.type !== 'bing') return;
    if (source.id in blacklist) return;
    var supportedProjection = source.available_projections &&
        supportedWMSProjections.find(function(supportedProjection) {
            return source.available_projections.some(function(projection) {
                return supportedProjection === projection;
            })
        });
    if (source.type === 'wms' && supportedProjection === undefined) return;
    if (source.type === 'wms' && sources.some(function(otherSource) {
        return otherSource.name === source.name && otherSource.type !== source.type;
    })) return;

    var im = {
        id: source.id,
        name: source.name,
        type: source.type,
        template: source.url
    };


    // supports 512px tiles
    if (source.id === 'Mapbox') {
        im.template = im.template.replace('.jpg', '@2x.jpg');
        im.tileSize = 512;
    } else if (source.id === 'mtbmap-no') {
        im.tileSize = 512;
    }

    if (source.type === 'wms') {
        im.projection = supportedProjection;
    }

    var startDate, endDate, isValid;

    if (source.end_date) {
        endDate = new Date(source.end_date);
        isValid = !isNaN(endDate.getTime());
        if (isValid) {
            if (endDate <= cutoffDate) return;  // too old
            im.endDate = endDate;
        }
    }

    if (source.start_date) {
        startDate = new Date(source.start_date);
        isValid = !isNaN(startDate.getTime());
        if (isValid) {
            im.startDate = startDate;
        }
    }

    var extent = source.extent || {};
    if (extent.min_zoom || extent.max_zoom) {
        im.zoomExtent = [
            extent.min_zoom || 0,
            extent.max_zoom || 22
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

    ['best', 'default', 'description', 'encrypted', 'icon', 'overlay', 'tileSize'].forEach(function(a) {
        if (source[a]) {
            im[a] = source[a];
        }
    });

    imagery.push(im);
});

imagery.sort(function(a, b) {
    return a.name.localeCompare(b.name);
});

fs.writeFileSync('data/imagery.json', prettyStringify({ dataImagery: imagery }));
