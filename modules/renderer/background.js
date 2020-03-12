import { dispatch as d3_dispatch } from 'd3-dispatch';
import { interpolateNumber as d3_interpolateNumber } from 'd3-interpolate';
import { select as d3_select } from 'd3-selection';

import LocationConflation from '@ideditor/location-conflation';
import whichPolygon from 'which-polygon';

import { geoExtent, geoMetersToOffset, geoOffsetToMeters} from '../geo';
import { rendererBackgroundSource } from './background_source';
import { rendererTileLayer } from './tile_layer';
import { utilAesDecrypt, utilDetect, utilQsString, utilStringQs, utilRebind } from '../util';


let _imageryIndex = null;

export function rendererBackground(context) {
  const dispatch = d3_dispatch('change');
  const detected = utilDetect();
  const baseLayer = rendererTileLayer(context).projection(context.projection);
  let _isValid = true;
  let _overlayLayers = [];
  let _brightness = 1;
  let _contrast = 1;
  let _saturation = 1;
  let _sharpness = 1;


  function ensureImageryIndex() {
    const data = context.data();
    return Promise.all([ data.get('imagery_sources'), data.get('imagery_features') ])
      .then(vals => {
        if (_imageryIndex) return _imageryIndex;

        const sources = preprocessSources(Object.values(vals[0]));
        const loco = new LocationConflation(vals[1]);
        let features = {};
        let backgrounds = [];

        // process all sources
        sources.forEach(source => {
          // Resolve the locationSet to a GeoJSON feature..
          const resolvedFeature = loco.resolveLocationSet(source.locationSet);
          let feature = features[resolvedFeature.id];
          if (!feature) {
            feature = JSON.parse(JSON.stringify(resolvedFeature));  // deep clone
            feature.properties.sourceIDs = new Set();
            features[resolvedFeature.id] = feature;
          }
          feature.properties.sourceIDs.add(source.id);

          // Features resolved from loco should have area precalculated.
          source.area = feature.properties.area || Infinity;


          // Instantiate a `rendererBackgroundSource`
          let background;
          if (source.type === 'bing') {
            background = rendererBackgroundSource.Bing(source, dispatch);
          } else if (/^EsriWorldImagery/.test(source.id)) {
            background = rendererBackgroundSource.Esri(source);
          } else {
            background = rendererBackgroundSource(source);
          }
          backgrounds.push(background);
        });

        _imageryIndex = {
          features: features,
          backgrounds: backgrounds,
          query: whichPolygon({ type: 'FeatureCollection', features: Object.values(features) })
        };

        // Add 'None'
        _imageryIndex.backgrounds.unshift(rendererBackgroundSource.None());

        // Add 'Custom'
        let template = context.storage('background-custom-template') || '';
        const custom = rendererBackgroundSource.Custom(template);
        _imageryIndex.backgrounds.unshift(custom);

        return _imageryIndex;
      });
  }


  function background(selection) {
    const currSource = baseLayer.source();

    // If we are displaying an Esri basemap at high zoom,
    // check its tilemap to see how high the zoom can go
    if (context.map().zoom() > 18) {
      if (currSource && /^EsriWorldImagery/.test(currSource.id)) {
        const center = context.map().center();
        currSource.fetchTilemap(center);
      }
    }

    // Is the imagery valid here? - #4827
    const sources = background.sources(context.map().extent());
    const wasValid = _isValid;
    _isValid = !!sources.filter(d => d === currSource).length;

    if (wasValid !== _isValid) {      // change in valid status
      background.updateImagery();
    }


    let baseFilter = '';
    if (detected.cssfilters) {
      if (_brightness !== 1) {
        baseFilter += ` brightness(${_brightness})`;
      }
      if (_contrast !== 1) {
        baseFilter += ` contrast(${_contrast})`;
      }
      if (_saturation !== 1) {
        baseFilter += ` saturate(${_saturation})`;
      }
      if (_sharpness < 1) {  // gaussian blur
        const blur = d3_interpolateNumber(0.5, 5)(1 - _sharpness);
        baseFilter += ` blur(${blur}px)`;
      }
    }

    let base = selection.selectAll('.layer-background')
      .data([0]);

    base = base.enter()
      .insert('div', '.layer-data')
      .attr('class', 'layer layer-background')
      .merge(base);

    if (detected.cssfilters) {
      base.style('filter', baseFilter || null);
    } else {
      base.style('opacity', _brightness);
    }


    let imagery = base.selectAll('.layer-imagery')
      .data([0]);

    imagery.enter()
      .append('div')
      .attr('class', 'layer layer-imagery')
      .merge(imagery)
      .call(baseLayer);


    let maskFilter = '';
    let mixBlendMode = '';
    if (detected.cssfilters && _sharpness > 1) {  // apply unsharp mask
      mixBlendMode = 'overlay';
      maskFilter = 'saturate(0) blur(3px) invert(1)';

      let contrast = _sharpness - 1;
      maskFilter += ` contrast(${contrast})`;

      let brightness = d3_interpolateNumber(1, 0.85)(_sharpness - 1);
      maskFilter += ` brightness(${brightness})`;
    }

    let mask = base.selectAll('.layer-unsharp-mask')
      .data(detected.cssfilters && _sharpness > 1 ? [0] : []);

    mask.exit()
      .remove();

    mask.enter()
      .append('div')
      .attr('class', 'layer layer-mask layer-unsharp-mask')
      .merge(mask)
      .call(baseLayer)
      .style('filter', maskFilter || null)
      .style('mix-blend-mode', mixBlendMode || null);


    let overlays = selection.selectAll('.layer-overlay')
      .data(_overlayLayers, d => d.source().name());

    overlays.exit()
      .remove();

    overlays.enter()
      .insert('div', '.layer-data')
      .attr('class', 'layer layer-overlay')
      .merge(overlays)
      .each((layer, i, nodes) => d3_select(nodes[i]).call(layer));
  }


  background.updateImagery = function() {
    let currSource = baseLayer.source();
    if (context.inIntro() || !currSource) return;

    let o = _overlayLayers
      .filter(d => !d.source().isLocatorOverlay() && !d.source().isHidden())
      .map(d => d.source().id)
      .join(',');

    const meters = geoOffsetToMeters(currSource.offset());
    const EPSILON = 0.01;
    const x = +meters[0].toFixed(2);
    const y = +meters[1].toFixed(2);
    let hash = utilStringQs(window.location.hash);

    let id = currSource.id;
    if (id === 'custom') {
      id = `custom:${currSource.template()}`;
    }

    if (id) {
      hash.background = id;
    } else {
      delete hash.background;
    }

    if (o) {
      hash.overlays = o;
    } else {
      delete hash.overlays;
    }

    if (Math.abs(x) > EPSILON || Math.abs(y) > EPSILON) {
      hash.offset = `${x},${y}`;
    } else {
      delete hash.offset;
    }

    if (!window.mocha) {
      window.location.replace('#' + utilQsString(hash, true));
    }

    let imageryUsed = [];
    let photoOverlaysUsed = [];

    const currUsed = currSource.imageryUsed();
    if (currUsed && _isValid) {
      imageryUsed.push(currUsed);
    }

    _overlayLayers
      .filter(d => !d.source().isLocatorOverlay() && !d.source().isHidden())
      .forEach(d => imageryUsed.push(d.source().imageryUsed()));

    const dataLayer = context.layers().layer('data');
    if (dataLayer && dataLayer.enabled() && dataLayer.hasData()) {
      imageryUsed.push(dataLayer.getSrc());
    }

    const photoOverlayLayers = {
      streetside: 'Bing Streetside',
      mapillary: 'Mapillary Images',
      'mapillary-map-features': 'Mapillary Map Features',
      'mapillary-signs': 'Mapillary Signs',
      openstreetcam: 'OpenStreetCam Images'
    };

    for (let layerID in photoOverlayLayers) {
      const layer = context.layers().layer(layerID);
      if (layer && layer.enabled()) {
        photoOverlaysUsed.push(layerID);
        imageryUsed.push(photoOverlayLayers[layerID]);
      }
    }

    context.history().imageryUsed(imageryUsed);
    context.history().photoOverlaysUsed(photoOverlaysUsed);
  };


  background.sources = (extent, zoom, includeCurrent) => {
    if (!_imageryIndex) return [];   // called before init()?

    // Gather the source ids visible in the given extent
    let visible = {};
    let hits = _imageryIndex.query.bbox(extent.rectangle(), true) || [];
    hits.forEach(properties => {
      Array.from(properties.sourceIDs).forEach(sourceID => visible[sourceID] = true);
    });

    const currSource = baseLayer.source();

    return _imageryIndex.backgrounds.filter(source => {
      if (includeCurrent && currSource === source) return true;  // optionally include the current imagery
      if (zoom && zoom < 6) return false;                        // optionally exclude local imagery at low zooms
      return visible[source.id];                                 // include imagery visible in given extent
    });
  };


  background.dimensions = (val) => {
    if (!val) return;
    baseLayer.dimensions(val);
    _overlayLayers.forEach(layer => layer.dimensions(val));
  };


  background.baseLayerSource = function(d) {
    if (!arguments.length) return baseLayer.source();

    // test source against OSM imagery blacklists..
    const osm = context.connection();
    if (!osm) return background;

    const blacklists = osm.imageryBlacklists();
    const template = d.template();
    let fail = false;
    let tested = 0;
    let regex;

    for (let i = 0; i < blacklists.length; i++) {
      try {
        regex = new RegExp(blacklists[i]);
        fail = regex.test(template);
        tested++;
        if (fail) break;
      } catch (e) {
        /* noop */
      }
    }

    // ensure at least one test was run.
    if (!tested) {
      regex = new RegExp('.*\.google(apis)?\..*/(vt|kh)[\?/].*([xyz]=.*){3}.*');
      fail = regex.test(template);
    }

    baseLayer.source(!fail ? d : background.findSource('none'));
    dispatch.call('change');
    background.updateImagery();
    return background;
  };


  background.findSource = (id) => {
    if (!id || !_imageryIndex) return null;   // called before init()?
    return _imageryIndex.backgrounds.find(d => d.id && d.id === id);
  };


  background.bing = () => {
    background.baseLayerSource(background.findSource('Bing'));
  };


  background.showsLayer = (d) => {
    const currSource = baseLayer.source();
    if (!d || !currSource) return false;
    return d.id === currSource.id || _overlayLayers.some(layer => d.id === layer.source().id);
  };


  background.overlayLayerSources = () => {
    return _overlayLayers.map(layer => layer.source());
  };


  background.toggleOverlayLayer = (d) => {
    let layer;
    for (let i = 0; i < _overlayLayers.length; i++) {
      layer = _overlayLayers[i];
      if (layer.source() === d) {
        _overlayLayers.splice(i, 1);
        dispatch.call('change');
        background.updateImagery();
        return;
      }
    }

    layer = rendererTileLayer(context)
      .source(d)
      .projection(context.projection)
      .dimensions(baseLayer.dimensions()
    );

    _overlayLayers.push(layer);
    dispatch.call('change');
    background.updateImagery();
  };


  background.nudge = (d, zoom) => {
    const currSource = baseLayer.source();
    if (currSource) {
      currSource.nudge(d, zoom);
      dispatch.call('change');
      background.updateImagery();
    }
    return background;
  };


  background.offset = function(d) {
    const currSource = baseLayer.source();
    if (!arguments.length) {
      return (currSource && currSource.offset()) || [0, 0];
    }
    if (currSource) {
      currSource.offset(d);
      dispatch.call('change');
      background.updateImagery();
    }
    return background;
  };


  background.brightness = function(d) {
    if (!arguments.length) return _brightness;
    _brightness = d;
    if (context.mode()) dispatch.call('change');
    return background;
  };


  background.contrast = function(d) {
    if (!arguments.length) return _contrast;
    _contrast = d;
    if (context.mode()) dispatch.call('change');
    return background;
  };


  background.saturation = function(d) {
    if (!arguments.length) return _saturation;
    _saturation = d;
    if (context.mode()) dispatch.call('change');
    return background;
  };


  background.sharpness = function(d) {
    if (!arguments.length) return _sharpness;
    _sharpness = d;
    if (context.mode()) dispatch.call('change');
    return background;
  };


  background.init = () => {
    function parseMapParams(qmap) {
      if (!qmap) return false;
      const params = qmap.split('/').map(Number);
      if (params.length < 3 || params.some(isNaN)) return false;
      return geoExtent([params[2], params[1]]);  // lon,lat
    }

    const hash = utilStringQs(window.location.hash);
    const requested = hash.background || hash.layer;
    let extent = parseMapParams(hash.map);

    ensureImageryIndex()
      .then(imageryIndex => {
        const first = imageryIndex.backgrounds.length && imageryIndex.backgrounds[0];

        let best;
        if (!requested && extent) {
          best = background.sources(extent).find(s => s.best());
        }

        // Decide which background layer to display
        if (requested && requested.indexOf('custom:') === 0) {
          const template = requested.replace(/^custom:/, '');
          const custom = background.findSource('custom');
          background.baseLayerSource(custom.template(template));
          context.storage('background-custom-template', template);
        } else {
          background.baseLayerSource(
            background.findSource(requested) ||
            best ||
            background.findSource(context.storage('background-last-used')) ||
            background.findSource('Bing') ||
            first ||
            background.findSource('none')
          );
        }

        const locator = imageryIndex.backgrounds.find(d => d.id === 'mapbox_locator_overlay');
        if (locator) {
          background.toggleOverlayLayer(locator);
        }

        const overlays = (hash.overlays || '').split(',');
        overlays.forEach(overlay => {
          overlay = background.findSource(overlay);
          if (overlay) {
            background.toggleOverlayLayer(overlay);
          }
        });

        if (hash.gpx) {   // todo: move elsewhere - this doesn't belong in background
          const gpx = context.layers().layer('data');
          if (gpx) {
            gpx.url(hash.gpx, '.gpx');
          }
        }

        if (hash.offset) {
          const offset = hash.offset
            .replace(/;/g, ',')
            .split(',')
            .map(n => !isNaN(n) && n);

          if (offset.length === 2) {
            background.offset(geoMetersToOffset(offset));
          }
        }
      });
      // .catch(() => { /* ignore */ });
  };


  return utilRebind(background, dispatch, 'on');
}



// Historically, iD has used a different imagery subset than what we pulled
// from the external imagery index.  This remapping previously happened
// in the `update_imagery.js` script before the imagery was bundled with iD.
//
// Now that the client fetches imagery at runtime, it needs to happen here.
// *This code should change to be more flexible.*
//
function preprocessSources(sources) {

  // ignore imagery more than 20 years old..
  let cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 20);

  const discard = {
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

  const supportedWMSProjections = {
    'EPSG:4326': true,
    'EPSG:3857': true,
    'EPSG:900913': true,
    'EPSG:3587': true,
    'EPSG:54004': true,
    'EPSG:41001': true,
    'EPSG:102113': true,
    'EPSG:102100': true,
    'EPSG:3785': true
  };

  const apikeys = {
    'Maxar-Premium': '2ac35d3bc99b64243066ef6888846358386da6cadbe0de9dbaf6ce8c17dae8d532d0d46f',
    'Maxar-Standard': '7bc70b61c29b34243064bd6f818463583262a6ca8ae78b9db9a4cf8b46d9ed8261d08168'
  };


  let keepImagery = [];
  sources.forEach(source => {
    if (source.type !== 'tms' && source.type !== 'wms' && source.type !== 'bing') return;
    if (source.id in discard) return;

    let im = {
      id: source.id,
      type: source.type,
      name: source.name,
      template: source.url,   // this one renamed
      locationSet: source.locationSet
    };

    // decrypt api keys
    if (apikeys[source.id]) {
      im.apikey = utilAesDecrypt(apikeys[source.id]);
    }

    // A few sources support 512px tiles
    if (source.id === 'Mapbox') {
      im.template = im.template.replace('.jpg', '@2x.jpg');
      im.tileSize = 512;
    } else if (source.id === 'mtbmap-no') {
      im.tileSize = 512;
    } else {
      im.tileSize = 256;
    }

    // Some WMS sources are supported, check projection
    if (source.type === 'wms') {
      const projection = (source.available_projections || []).find(p => supportedWMSProjections[p]);
      if (!projection) return;
      if (sources.some(other => other.name === source.name && other.type !== source.type)) return;
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

    im.zoomExtent = [
      source.min_zoom || 0,
      source.max_zoom || 24
    ];

    if (source.id === 'mapbox_locator_overlay') {
      im.overzoom = false;
    }

    const attribution = source.attribution || {};
    if (attribution.url)  { im.terms_url = attribution.url; }
    if (attribution.text) { im.terms_text = attribution.text; }
    if (attribution.html) { im.terms_html = attribution.html; }


    if (source.icon) {
      if (/^http(s)?/i.test(source.icon)) {
        im.icon = source.icon;
      } else {
        im.icon = `https://cdn.jsdelivr.net/npm/@ideditor/imagery-index@0.1/dist/images/${source.icon}`;
      }
    }

    if (source.best)        { im.best = source.best; }
    if (source.overlay)     { im.overlay = source.overlay; }
    if (source.description) { im.description = source.description; }

    keepImagery.push(im);
  });

  return keepImagery;
}
