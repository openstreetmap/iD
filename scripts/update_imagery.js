/* eslint-disable no-console */
const fs = require('fs');
const prettyStringify = require('json-stringify-pretty-compact');

/** @type {import("geojson").FeatureCollection} */
const sources = JSON.parse(
  fs.readFileSync(require.resolve('editor-layer-index/imagery.geojson'), 'utf8')
);

if (fs.existsSync('./data/manual_imagery.json')) {
  /** @type {any[]} */
  const manualImagery = JSON.parse(fs.readFileSync('./data/manual_imagery.json', 'utf8'));
  // we can include additional imagery sources that aren't in the index
  sources.features = sources.features
    .filter(source => !manualImagery.find(manualSource => manualSource.id === source.properties?.id));

  sources.features.push(
    ...manualImagery.map(source => {
      /** @type {import("geojson").Feature} */
      const feature = {
        type: 'Feature',
        properties: { ...source, ...source.extent },
        geometry: null,
        bbox: source.bbox,
      };
      return feature;
    })
  );
}

let imagery = [];

// ignore imagery more than 20 years old..
let cutoffDate = new Date();
cutoffDate.setFullYear(cutoffDate.getFullYear() - 20);

const discard = [
  /^osmbe$/,                              // 'OpenStreetMap (Belgian Style)'
  /^osmfr(-(basque|breton|occitan))?$/,   // 'OpenStreetMap (French, Basque, Breton, Occitan Style)'
  /^osm-mapnik-german_style$/,            // 'OpenStreetMap (German Style)'
  /^HDM_HOT$/,                            // 'OpenStreetMap (HOT Style)'
  /^osm-mapnik-black_and_white$/,         // 'OpenStreetMap (Standard Black & White)'
  /^osm-mapnik-no_labels$/,               // 'OpenStreetMap (Mapnik, no labels)'
  /^OpenStreetMap-turistautak$/,          // 'OpenStreetMap (turistautak)'

  /^cyclosm$/,                            // 'CyclOSM'
  /^hike_n_bike$/,                        // 'Hike & Bike'
  /^landsat$/,                            // 'Landsat'
  /^skobbler$/,                           // 'Skobbler'
  /^stamen-terrain-background$/,          // 'Stamen Terrain'
  /^public_transport_oepnv$/,             // 'Public Transport (ÖPNV)'
  /^tf-(cycle|landscape|outdoors)$/,      // 'Thunderforest OpenCycleMap, Landscape, Outdoors'
  /^qa_no_address$/,                      // 'QA No Address'
  /^wikimedia-map$/,                      // 'Wikimedia Map'

  /^openinframap-(petroleum|power|telecoms)$/,
  /^openpt_map$/,
  /^openrailwaymap$/,
  /^openseamap$/,
  /^opensnowmap-overlay$/,

  /^US-TIGER-Roads-201\d/,
  /^Waymarked_Trails/,
  /^OSM_Inspector/,
  /^EOXAT/
];

const supportedWMSProjections = [
  // Web Mercator
  'EPSG:3857',
  // alternate codes used for Web Mercator
  'EPSG:900913',
  'EPSG:3587',
  'EPSG:54004',
  'EPSG:41001',
  'EPSG:102113',
  'EPSG:102100',
  'EPSG:3785',
  // WGS 84 (Equirectangular)
  'EPSG:4326'
];

sources.features.forEach(feature => {
  const source = feature.properties;

  if (!source) return;
  if (source.type !== 'tms' && source.type !== 'wms' && source.type !== 'bing') return;
  if (discard.some(regex => regex.test(source.id))) return;

  let im = {
    id: source.id,
    name: source.name,
    type: source.type,
    template: source.url,
    category: source.category,
  };

  // Some sources support 512px tiles
  if (source.id === 'Mapbox') {
    im.template = im.template.replace('.jpg', '@2x.jpg');
    im.tileSize = 512;
  } else if (source.id === 'mtbmap-no') {
    im.tileSize = 512;
  } else if (source.id === 'mapbox_locator_overlay') {
    im.template = im.template.replace('{y}', '{y}{@2x}');
  }

  // Some WMS sources are supported, check projection
  if (source.type === 'wms') {
    const projection = source.available_projections && supportedWMSProjections.find(p => source.available_projections.indexOf(p) !== -1);
    if (!projection) return;
    if (sources.features.some(other => other.properties?.name === source.name && other.properties?.type !== source.type)) return;
    im.projection = projection;
  }


  let startDate, endDate, isValid;

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

  let extent = source;
  if (extent.min_zoom || extent.max_zoom) {
    im.zoomExtent = [
      extent.min_zoom || 0,
      extent.max_zoom || 22
    ];
  }

  if (feature.geometry) {
    if (feature.geometry.type === 'Polygon') {
      im.polygon = [feature.geometry.coordinates?.[0]];
    } else if (feature.geometry.type === 'MultiPolygon') {
      im.polygon = feature.geometry.coordinates.map(ring => ring[0]);
    }
  } else if (feature.bbox) {
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

  const attribution = source.attribution || {};
  if (attribution.url) {
    im.terms_url = attribution.url;
  }
  if (attribution.text) {
    im.terms_text = attribution.text;
  }
  if (attribution.html) {
    im.terms_html = attribution.html;
  }

  ['best', 'default', 'description', 'encrypted', 'icon', 'overlay', 'tileSize'].forEach(prop => {
    if (source[prop]) {
      im[prop] = source[prop];
    }
  });

  imagery.push(im);
});


imagery.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync('data/imagery.json', prettyStringify(imagery));
fs.writeFileSync('dist/data/imagery.min.json', JSON.stringify(imagery));
