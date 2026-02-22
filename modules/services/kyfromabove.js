import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';
import RBush from 'rbush';

import { geoExtent } from '../geo';
import { utilQsString, utilRebind, utilTiler } from '../util';
import { uiKyObliqueViewer } from '../ui/ky_oblique_viewer';

const featureServer = 'https://services.arcgis.com/p3e6s1qwiHne8T2h/ArcGIS/rest/services/KyFromAbove_Phase3_Oblique_Imagery_Centroids/FeatureServer/0';
const tileZoom = 14;
const tiler = utilTiler().zoomExtent([tileZoom, tileZoom]).skipNullIsland(true);
const dispatch = d3_dispatch('loadedImages');

let _kyCache;
let _viewer;

function abortRequest(controller) {
  controller.abort();
}

async function loadTile(tile) {
  if (_kyCache.loaded[tile.id] || _kyCache.inflight[tile.id]) return;

  const bbox = tile.extent.bbox();
  const params = {
    f: 'geojson',
    geometryType: 'esriGeometryEnvelope',
    geometry: [bbox.minX, bbox.minY, bbox.maxX, bbox.maxY].join(','),
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: true,
    inSR: 4326,
    outSR: 4326
  };

  const controller = new AbortController();
  _kyCache.inflight[tile.id] = controller;

  const url = `${featureServer}/query?${utilQsString(params)}`;

  try {
    const data = await d3_json(url, { signal: controller.signal });
    _kyCache.loaded[tile.id] = true;
    delete _kyCache.inflight[tile.id];

    if (!data || !data.features) return;

    const features = data.features.map(feature => {
      const loc = feature.geometry.coordinates;
      const props = feature.properties;
      const key = props.ShotID || props.OBJECTID;

      const d = {
        service: 'kyfromabove',
        loc: loc,
        key: key,
        ca: props.CameraBearing || 0,
        captured_at: props.FlightDate ? new Date(props.FlightDate) : null,
        shots: {
          nadir: props.Nadir_URL,
          forward: props.Forward_URL,
          backward: props.Backward_URL,
          left: props.Left_URL,
          right: props.Right_URL
        }
      };

      _kyCache.points.set(key, d);

      return {
        minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
      };
    });

    _kyCache.rtree.load(features);
    dispatch.call('loadedImages');
  } catch (err) {
    if (err.name !== 'AbortError') {
      _kyCache.loaded[tile.id] = true;
      delete _kyCache.inflight[tile.id];
    }
  }
}

export default {
  init: function() {
    this.event = utilRebind(this, dispatch, 'on');
    this.reset();
  },

  reset: function() {
    if (_kyCache) {
      Object.values(_kyCache.inflight).forEach(abortRequest);
    }
    _kyCache = {
      points: new Map(),
      rtree: new RBush(),
      loaded: {},
      inflight: {}
    };
  },

  images: function(projection) {
    const viewport = projection.clipExtent();
    const min = [viewport[0][0], viewport[1][1]];
    const max = [viewport[1][0], viewport[0][1]];
    const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();

    return _kyCache.rtree.search(bbox).map(d => d.data);
  },

  loadImages: function(projection) {
    const tiles = tiler.getTiles(projection);

    // abort inflight requests that are no longer needed
    Object.keys(_kyCache.inflight).forEach(k => {
      const wanted = tiles.find(tile => k === tile.id);
      if (!wanted) {
        abortRequest(_kyCache.inflight[k]);
        delete _kyCache.inflight[k];
      }
    });

    tiles.forEach(tile => loadTile(tile));
  },

  ensureViewerLoaded: function(context) {
    if (!_viewer) {
      _viewer = uiKyObliqueViewer(context);
      const photoviewer = context.container().select('.photoviewer');
      photoviewer.call(_viewer);
    }
    return Promise.resolve();
  },

  selectImage: function(_, key) {
    const d = this.cachedImage(key);
    if (_viewer) {
      _viewer.image(d);
    }
    return this;
  },

  showViewer: function() {
    if (_viewer) {
      _viewer.show();
    }
    return this;
  },

  hideViewer: function() {
    if (_viewer) {
      _viewer.hide();
    }
    return this;
  },

  cachedImage: function(key) {
    return _kyCache.points.get(key);
  },

  cache: function() {
    return _kyCache;
  }
};
