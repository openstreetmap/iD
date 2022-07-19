import { dispatch as d3_dispatch } from 'd3-dispatch';
import { interpolateNumber as d3_interpolateNumber } from 'd3-interpolate';
import { select as d3_select } from 'd3-selection';

import whichPolygon from 'which-polygon';

import { prefs } from '../core/preferences';
import { fileFetcher } from '../core/file_fetcher';
import { geoMetersToOffset, geoOffsetToMeters} from '../geo';
import { rendererBackgroundSource } from './background_source';
import { rendererTileLayer } from './tile_layer';
import { utilQsString, utilStringQs } from '../util';
import { utilRebind } from '../util/rebind';


let _imageryIndex = null;

export function rendererBackground(context) {
  const dispatch = d3_dispatch('change');
  const baseLayer = rendererTileLayer(context).projection(context.projection);
  let _checkedBlocklists = [];
  let _isValid = true;
  let _overlayLayers = [];
  let _brightness = 1;
  let _contrast = 1;
  let _saturation = 1;
  let _sharpness = 1;


  function ensureImageryIndex() {
    return fileFetcher.get('imagery')
      .then(sources => {
        if (_imageryIndex) return _imageryIndex;

        _imageryIndex = {
          imagery: sources,
          features: {}
        };

        // use which-polygon to support efficient index and querying for imagery
        const features = sources.map(source => {
          if (!source.polygon) return null;
          // workaround for editor-layer-index weirdness..
          // Add an extra array nest to each element in `source.polygon`
          // so the rings are not treated as a bunch of holes:
          // what we have: [ [[outer],[hole],[hole]] ]
          // what we want: [ [[outer]],[[outer]],[[outer]] ]
          const rings = source.polygon.map(ring => [ring]);

          const feature = {
            type: 'Feature',
            properties: { id: source.id },
            geometry: { type: 'MultiPolygon', coordinates: rings }
          };

          _imageryIndex.features[source.id] = feature;
          return feature;

        }).filter(Boolean);

        _imageryIndex.query = whichPolygon({ type: 'FeatureCollection', features: features });


        // Instantiate `rendererBackgroundSource` objects for each source
        _imageryIndex.backgrounds = sources.map(source => {
          if (source.type === 'bing') {
            return rendererBackgroundSource.Bing(source, dispatch);
          } else if (/^EsriWorldImagery/.test(source.id)) {
            return rendererBackgroundSource.Esri(source);
          } else {
            return rendererBackgroundSource(source);
          }
        });

        // Add 'None'
        _imageryIndex.backgrounds.unshift(rendererBackgroundSource.None());

        // Add 'Custom'
        let template = prefs('background-custom-template') || '';
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

    let base = selection.selectAll('.layer-background')
      .data([0]);

    base = base.enter()
      .insert('div', '.layer-data')
      .attr('class', 'layer layer-background')
      .merge(base);

    base.style('filter', baseFilter || null);


    let imagery = base.selectAll('.layer-imagery')
      .data([0]);

    imagery.enter()
      .append('div')
      .attr('class', 'layer layer-imagery')
      .merge(imagery)
      .call(baseLayer);


    let maskFilter = '';
    let mixBlendMode = '';
    if (_sharpness > 1) {  // apply unsharp mask
      mixBlendMode = 'overlay';
      maskFilter = 'saturate(0) blur(3px) invert(1)';

      let contrast = _sharpness - 1;
      maskFilter += ` contrast(${contrast})`;

      let brightness = d3_interpolateNumber(1, 0.85)(_sharpness - 1);
      maskFilter += ` brightness(${brightness})`;
    }

    let mask = base.selectAll('.layer-unsharp-mask')
      .data(_sharpness > 1 ? [0] : []);

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
      kartaview: 'KartaView Images'
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

    let visible = {};
    (_imageryIndex.query.bbox(extent.rectangle(), true) || [])
      .forEach(d => visible[d.id] = true);

    const currSource = baseLayer.source();

    // Recheck blocked sources only if we detect new blocklists pulled from the OSM API.
    const osm = context.connection();
    const blocklists = (osm && osm.imageryBlocklists()) || [];
    const blocklistChanged = (blocklists.length !== _checkedBlocklists.length) ||
      blocklists.some((regex, index) => String(regex) !== _checkedBlocklists[index]);

    if (blocklistChanged) {
      _imageryIndex.backgrounds.forEach(source => {
        source.isBlocked = blocklists.some(regex => regex.test(source.template()));
      });
      _checkedBlocklists = blocklists.map(regex => String(regex));
    }

    return _imageryIndex.backgrounds.filter(source => {
      if (includeCurrent && currSource === source) return true;  // optionally always include the current imagery
      if (source.isBlocked) return false;                        // even bundled sources may be blocked - #7905
      if (!source.polygon) return true;                          // always include imagery with worldwide coverage
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

    // test source against OSM imagery blocklists..
    const osm = context.connection();
    if (!osm) return background;

    const blocklists = osm.imageryBlocklists();
    const template = d.template();
    let fail = false;
    let tested = 0;
    let regex;

    for (let i = 0; i < blocklists.length; i++) {
      regex = blocklists[i];
      fail = regex.test(template);
      tested++;
      if (fail) break;
    }

    // ensure at least one test was run.
    if (!tested) {
      regex = /.*\.google(apis)?\..*\/(vt|kh)[\?\/].*([xyz]=.*){3}.*/;
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

  let _loadPromise;

  background.ensureLoaded = () => {
    if (_loadPromise) return _loadPromise;

    return _loadPromise = ensureImageryIndex();
  };

  background.init = () => {
    const loadPromise = background.ensureLoaded();

    const hash = utilStringQs(window.location.hash);
    const requestedBackground = hash.background || hash.layer;
    const lastUsedBackground = prefs('background-last-used');

    return loadPromise.then(imageryIndex => {
      const extent = context.map().extent();
      const validBackgrounds = background.sources(extent).filter(d => d.id !== 'none' && d.id !== 'custom');
      const first = validBackgrounds.length && validBackgrounds[0];
      const isLastUsedValid = !!validBackgrounds.find(d => d.id && d.id === lastUsedBackground);

      let best;
      if (!requestedBackground && extent) {
        best = validBackgrounds.find(s => s.best());
      }

      // Decide which background layer to display
      if (requestedBackground && requestedBackground.indexOf('custom:') === 0) {
        const template = requestedBackground.replace(/^custom:/, '');
        const custom = background.findSource('custom');
        background.baseLayerSource(custom.template(template));
        prefs('background-custom-template', template);
      } else {
        background.baseLayerSource(
          background.findSource(requestedBackground) ||
          best ||
          isLastUsedValid && background.findSource(lastUsedBackground) ||
          background.findSource('Bing') ||
          first ||
          background.findSource('none')
        );
      }

      const locator = imageryIndex.backgrounds.find(d => d.overlay && d.default);
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

      if (hash.gpx) {
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
    })
    .catch(err => {
      /* eslint-disable no-console */
      console.error(err);
      /* eslint-enable no-console */
    });
  };


  return utilRebind(background, dispatch, 'on');
}
