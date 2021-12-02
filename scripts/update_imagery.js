/* eslint-disable no-console */
const fs = require('fs');
let sources = JSON.parse(fs.readFileSync('node_modules/editor-layer-index/imagery.geojson'));
const prettyStringify = require('json-stringify-pretty-compact');

if (fs.existsSync('./data/manual_imagery.geojson')) {
  // we can include additional imagery sources that aren't in the index
  sources.features = sources.features.concat(
    JSON.parse(fs.readFileSync('./data/manual_imagery.geojson')).features);
}

let imagery = [];

// ignore imagery more than 20 years old..
let cutoffDate = new Date();
cutoffDate.setFullYear(cutoffDate.getFullYear() - 20);


const discard = {
  'US-TIGER-Roads-2017': true,
  'US-TIGER-Roads-2018': true,
  'US-TIGER-Roads-2019': true,

  'EOXAT2018CLOUDLESS': true
};



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


sources.features.forEach(_source => {
  var source = _source.properties;

  if (source.type !== 'tms' && source.type !== 'wms' && source.type !== 'bing') return;
  if (source.id in discard) return;

  let im = {
    id: source.id,
    name: source.name,
    type: source.type,
    category: source.category,
    template: source.url
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
    if (sources.features.some(other => other.properties.name === source.name && other.properties.type !== source.type)) return;
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

  if (source.min_zoom || source.max_zoom) {
    im.zoomExtent = [
      source.min_zoom || 0,
      source.max_zoom || 22
    ];
  }

  if (_source.geometry !== null) {
    im.polygon = _source.geometry.coordinates;
  } else if (_source.bbox) {
    im.polygon = [[
      [_source.bbox.min_lon, _source.bbox.min_lat],
      [_source.bbox.min_lon, _source.bbox.max_lat],
      [_source.bbox.max_lon, _source.bbox.max_lat],
      [_source.bbox.max_lon, _source.bbox.min_lat],
      [_source.bbox.min_lon, _source.bbox.min_lat]
    ]];
  }

  if (source.id === 'mapbox_locator_overlay') {
    im.overzoom = false;
    // override category to "other imagery"
    // (such that this overlay is displayed alongside OSM's GPS traces overlay)
    im.category = 'other';
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
