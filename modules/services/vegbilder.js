import { json as d3_json } from 'd3-fetch';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { zoom as d3_zoom, zoomIdentity as d3_zoomIdentity } from 'd3-zoom';
import { utilQsString, utilTiler, utilRebind, utilArrayUnion, utilStringQs, utilSetTransform} from '../util';
import { geoExtent, geoScaleToZoom } from '../geo';
import RBush from 'rbush';

const owsEndpoint = 'https://www.vegvesen.no/kart/ogc/vegbilder_1_0/ows?';
const pannellumViewerCSS = 'pannellum/pannellum.css';
const pannellumViewerJS = 'pannellum/pannellum.js';
const tileZoom = 14;
const tiler = utilTiler().zoomExtent([tileZoom, tileZoom]).skipNullIsland(true);
const dispatch = d3_dispatch('loadedImages', 'viewerChanged');

let imgZoom = d3_zoom()
    .extent([[0, 0], [320, 240]])
    .translateExtent([[0, 0], [320, 240]])
    .scaleExtent([1, 15]);
let _sceneOptions = {
  showFullscreenCtrl: false,
  autoLoad: true,
  compass: true,
  yaw: 0,
  type: 'equirectangular',
};
let _vegbilderCache;
let _loadViewerPromise;
let _pannellumViewer;


function abortRequest(controller) {
  controller.abort();
}

/**
* loadTiles() wraps the process of generating tiles and then fetching image points for each tile.
*/
function loadTiles(which, url, projection, margin) {
  const tiles = tiler.margin(margin).getTiles(projection);

  // abort inflight requests that are no longer needed
  const cache = _vegbilderCache[which];
  Object.keys(cache.inflight).forEach(k => {
    const wanted = tiles.find(tile => k.indexOf(tile.id + ',') === 0);
    if (!wanted) {
      abortRequest(cache.inflight[k]);
      delete cache.inflight[k];
    }
  });

  tiles.forEach(tile => loadNextTilePage(which, url, tile));
}


/**
* loadNextTilePage() load data for the next tile page in line.
*/
function loadNextTilePage(which, url, tile) {
  const cache = _vegbilderCache[which];
  const bbox = tile.extent.bbox();
  const years = [2019, 2020, 2021];
  const typenames = years.map(year => `vegbilder_1_0:Vegbilder_360_${year}`);
  const id = tile.id;
  if (cache.loaded[id] || cache.inflight[id]) return;


  const params = {
    service: 'WFS',
    request: 'GetFeature',
    version: '2.0.0',
    typenames: typenames[2],
    bbox: [bbox.minY, bbox.minX, bbox.maxY, bbox.maxX].join(','),
    outputFormat: 'json'
  };

  const controller = new AbortController();
  cache.inflight[id] = controller;

  const options = {
    method: 'GET',
    signal: controller.signal,
};

  let urlForRequest = url + utilQsString(params);

  d3_json(urlForRequest, options)
    .then(featureCollection => {
      cache.loaded[id] = true;
      delete cache.inflight[id];

      if (featureCollection.features.length === 0) { return; }

      const features = featureCollection.features.map(feature => {
        const loc = feature.geometry.coordinates;
        const key = feature.id;
        const properties = feature.properties;
        const {
          RETNING: ca,
          TIDSPUNKT: captured_at,
          URL: image_path,
          BILDETYPE: image_type,
          METER: metering,
          FELTKODE: lane_kode
        } = properties;
        const sequence_reference = roadReference(properties);
        const d = {
          loc,
          key,
          ca,
          image_path,
          metering,
          sequence_reference,
          captured_at: new Date(captured_at),
          is_pano: image_type === '360'
        };

        cache.points.set(key, d);

        const lane_number = Number(lane_kode.match(/^[0-9]+/)[0]);
        const direction = lane_number % 2 === 0;
        let sequence = _vegbilderCache.sequences.get(sequence_reference);

        if (!sequence) { sequence = { direction, images: [], geometry: {type: 'LineString', coordinates: [] }}; }
          _vegbilderCache.sequences.set(sequence_reference, sequence);

        sequence.images.push(d);

        return {
          minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
        };
      });

      cache.rtree.load(features);

      if (which === 'images') {
        dispatch.call('loadedImages');
      }

    })
    .catch(() => {
      cache.loaded[id] = true;
      delete cache.inflight[id];
    });
}


function OrderSequences() {
  for (let [_, sequence] of _vegbilderCache.sequences) {
    const {images, direction, geometry} = sequence;
    if (direction) {
      images.sort((a, b) => b.metering - a.metering);
    } else {
      images.sort((a, b) => a.metering - b.metering);
    }
    geometry.coordinates = images.map(d => d.loc);
  }
}

function roadReference(properties) {
  let {
    FYLKENUMMER: county_number,
    VEGKATEGORI: road_class,
    VEGSTATUS: road_status,
    VEGNUMMER: road_number,
    STREKNING: section,
    DELSTREKNING: subsection,
    HP: parcel,
    KRYSSDEL: junction_part,
    SIDEANLEGGSDEL: services_part,
    ANKERPUNKT: anker_point,
    FELTKODE: lane,
    AAR: year,
    BILDETYPE: image_type
  } = properties;

  if (image_type === undefined) { image_type = 'Planar'; }

  let reference = `${year} ${image_type}`;

  if (year >= 2020) {
    reference = `${reference}:${road_class}${road_status}${road_number} S${section}D${subsection}`;
    if (junction_part) {
      reference = `${reference} M${anker_point} KD${junction_part}`;
    } else if (services_part) {
      reference = `${reference} M${anker_point} SD${services_part}`;
    }
  } else {
    reference = `${reference} ${county_number}${road_class}${road_status}${road_number} HP${parcel}`;
  }

  reference = `${reference} F${lane}`;
  return reference;
}

function partitionViewport(projection) {
  let z = geoScaleToZoom(projection.scale());
  let z2 = (Math.ceil(z * 2) / 2) + 2.5;   // round to next 0.5 and add 2.5
  let tiler = utilTiler().zoomExtent([z2, z2]);

  return tiler.getTiles(projection)
    .map(tile => tile.extent);
}

function searchLimited(limit, projection, rtree) {
  limit = limit || 5;

  return partitionViewport(projection)
    .reduce((result, extent) => {
      let found = rtree.search(extent.bbox())
        .slice(0, limit)
        .map(d => d.data);

      return (found.length ? result.concat(found) : result);
    }, []);
}


export default {

  init: function () {
    if (!_vegbilderCache) {
      this.reset();
    }

    this.event = utilRebind(this, dispatch, 'on');
  },

  reset: function () {
    if (_vegbilderCache) {
      Object.values(_vegbilderCache.images.inflight).forEach(abortRequest);
    }

    _vegbilderCache = {
      images: { inflight: {}, loaded: {}, rtree: new RBush(), points: new Map()},
      sequences: new Map()
    };
  },


  images: function (projection) {
    const limit = 5;
    return searchLimited(limit, projection, _vegbilderCache.images.rtree);
  },


  sequences: function (projection) {
    OrderSequences();
    const viewport = projection.clipExtent();
    const min = [viewport[0][0], viewport[1][1]];
    const max = [viewport[1][0], viewport[0][1]];
    const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
    let seen = new Set();
    let line_strings = [];

    for (let d of _vegbilderCache.images.rtree.search(bbox)) {
      const key = d.data.sequence_reference;
      if (!seen.has(key)) {
          seen.add(key);
          let sequence = _vegbilderCache.sequences.get(key);
          let geometry = {
            type: 'LineString',
            coordinates: sequence.geometry.coordinates,
            properties: {key}
          };
          line_strings.push(geometry);
      }
    }
    return line_strings;
  },


  cachedImage: function (key) {
    return _vegbilderCache.images.points.get(key);
  },


  getSequenceKeyForImage: function (d) {
    return d && d.sequence_reference;
  },


  loadImages: function (projection) {
    const margin = 1;
    loadTiles('images', owsEndpoint, projection, margin);
  },

  viewer: function() {
    return _pannellumViewer;
  },

  initViewer: function () {
    if (!window.pannellum) return;
    if (_pannellumViewer) return;

    _currScene += 1;
    const sceneID = _currScene.toString();
    const options = {
      'default': { firstScene: sceneID },
      scenes: {}
    };
    options.scenes[sceneID] = _sceneOptions;

    _pannellumViewer = window.pannellum.viewer('ideditor-viewer-streetside', options);
  },

  ensureViewerLoaded: function(context) {

    if (_loadViewerPromise) return _loadViewerPromise;

    const wrap = context.container().select('.photoviewer')
      .selectAll('.vegbilder-wrapper')
      .data([0]);

    const wrapEnter = wrap.enter()
      .append('div')
      .attr('class', 'photo-wrapper vegbilder-wrapper')
      .classed('hide', true);

    wrapEnter
      .append('div')
      .attr('class', 'photo-attribution fillD');

    const controlsEnter = wrapEnter
      .append('div')
      .attr('class', 'photo-controls-wrap')
      .append('div')
      .attr('class', 'photo-controls');

    controlsEnter
      .append('button')
      .on('click.back', step(-1))
      .text('◄');

    controlsEnter
      .append('button')
      .on('click.forward', step(1))
      .text('►');

    wrapEnter
      .append('div')
      .attr('class', 'vegbilder-image-wrap');


    context.ui().photoviewer.on('resize.vegbilder', dimensions => {
      if (_pannellumViewer) {
        _pannellumViewer.resize();
      } else {
        imgZoom = d3_zoom()
        .extent([[0, 0], dimensions])
        .translateExtent([[0, 0], dimensions])
        .scaleExtent([1, 15])
        .on('zoom', zoomPan);
      }
    });


    _loadViewerPromise = new Promise((resolve, reject) => {

      let loadedCount = 0;
      function loaded() {
        loadedCount += 1;
        // wait until both files are loaded
        if (loadedCount === 2) resolve();
      }

      const head = d3_select('head');

      // load streetside pannellum viewer css
      head.selectAll('#ideditor-vegbilder-viewercss')
        .data([0])
        .enter()
        .append('link')
        .attr('id', 'ideditor-vegbilder-viewercss')
        .attr('rel', 'stylesheet')
        .attr('crossorigin', 'anonymous')
        .attr('href', context.asset(pannellumViewerCSS))
        .on('load.serviceVegbilder', loaded)
        .on('error.serviceVegbilder', function() {
            reject();
        });

      // load streetside pannellum viewer js
      head.selectAll('#ideditor-vegbilder-viewerjs')
        .data([0])
        .enter()
        .append('script')
        .attr('id', 'ideditor-vegbilder-viewerjs')
        .attr('crossorigin', 'anonymous')
        .attr('src', context.asset(pannellumViewerJS))
        .on('load.serviceVegbilder', loaded)
        .on('error.serviceVegbilder', function() {
            reject();
        });
    })
      .catch(() => {
        _loadViewerPromise = null;
    });

    const that = this;

    return _loadViewerPromise;

    function zoomPan(d3_event) {
      const t = d3_event.transform;
      context.container().select('.photoviewer .vegbilder-image-wrap')
        .call(utilSetTransform, t.x, t.y, t.k);
  }

    function step(stepBy) {
      return () => {
        const viewer = context.container().select('.photoviewer');
        const selected = viewer.empty() ? undefined : viewer.datum();
        if (!selected) return;

        const sequence = _vegbilderCache.sequences.get(that.getSequenceKeyForImage(selected));
        const nextIndex = sequence.images.indexOf(selected) + stepBy;
        const nextImage = sequence.images[nextIndex];

        if (!nextImage) return;
        // TODO jump to a spatial and temporal close sequence when reaching the start or end.
        that.selectImage(context, nextImage.key);
      };
    }

  },

  selectImage: function(context, key) {
    const d = this.cachedImage(key);
    this.updateUrlImage(key);

    const viewer = context.container().select('.photoviewer');
    if (!viewer.empty()) viewer.datum(d);

    this.setStyles(context, null, true);

    context.container().selectAll('.icon-sign')
      .classed('currentView', false);

    if (!d) return this;

    const wrap = context.container().select('.photoviewer .vegbilder-wrapper');
    const imageWrap = wrap.selectAll('.vegbilder-image-wrap');
    const attribution = wrap.selectAll('.photo-attribution').text('');

    wrap
      .transition()
      .duration(100)
      .call(imgZoom.transform, d3_zoomIdentity);

    imageWrap
      .selectAll('.vegbilder-image')
      .remove();

    if (!d.is_pano) {
      imageWrap
        .append('img')
        .attr('class', 'vegbilder-image')
        .attr('src', d.image_path);
    } else {
      imageWrap
        .append('div')
        .attr('class', 'vegbilder-panorama')
        .attr('id', 'vegbilder-panorama')
        .on();

      _sceneOptions.panorama = d.image_path;
      _sceneOptions.northOffset = d.ca;
      _pannellumViewer = window.pannellum.viewer('vegbilder-panorama', _sceneOptions);
      _pannellumViewer
        .on('mousedown', () => {
          d3_select(window)
            .on('mousemove', () => {
              dispatch.call('viewerChanged');
            });
        })
        .on('animatefinished', () => {
          d3_select(window)
          .on('mousemove', null);
          dispatch.call('viewerChanged');
        });
    }

    if (d.captured_at) {
      attribution
        .append('span')
        .attr('class', 'year')
        .text(d.captured_at.getFullYear());
    }

    attribution
      .append('a')
      .attr('target', '_blank')
      .attr('href', 'https://vegvesen.no')
      .text('Norwegian Public Roads Administration');

    return this;
  },

  showViewer: function (context) {
  const viewer = context.container().select('.photoviewer')
  .classed('hide', false);

  const isHidden = viewer.selectAll('.photo-wrapper.vegbilder-wrapper.hide').size();

  if (isHidden) {
    viewer
      .selectAll('.photo-wrapper:not(.vegbilder-wrapper)')
      .classed('hide', true);

    viewer
      .selectAll('.photo-wrapper.vegbilder-wrapper')
      .classed('hide', false);
    }
    return this;
  },

  hideViewer: function(context) {
    this.updateUrlImage(null);

    const viewer = context.container().select('.photoviewer');
    if (!viewer.empty()) viewer.datum(null);

    viewer
        .classed('hide', true)
        .selectAll('.photo-wrapper')
        .classed('hide', true);

    context.container().selectAll('.viewfield-group, .sequence, .icon-sign')
        .classed('currentView', false);

    return this.setStyles(context, null, true);
},


  // Updates the currently highlighted sequence and selected bubble.
  // Reset is only necessary when interacting with the viewport because
  // this implicitly changes the currently selected bubble/sequence
  setStyles: function (context, hovered, reset) {
    if (reset) {  // reset all layers
      context.container().selectAll('.viewfield-group')
        .classed('highlighted', false)
        .classed('hovered', false)
        .classed('currentView', false);

      context.container().selectAll('.sequence')
        .classed('highlighted', false)
        .classed('currentView', false);
    }

    const hoveredImageKey = hovered && hovered.key;
    const hoveredSequenceKey = this.getSequenceKeyForImage(hovered);
    const hoveredSequence = hoveredSequenceKey && _vegbilderCache.sequences.get(hoveredSequenceKey);
    const hoveredImageKeys = (hoveredSequence && hoveredSequence.images.map(d => d.key)) || [];

    const viewer = context.container().select('.photoviewer');
    const selected = viewer.empty() ? undefined : viewer.datum();
    const selectedImageKey = selected && selected.key;
    const selectedSequenceKey = this.getSequenceKeyForImage(selected);
    const selectedSequence = selectedSequenceKey && _vegbilderCache.sequences.get(selectedSequenceKey);
    const selectedImageKeys = (selectedSequence && selectedSequence.images.map(d => d.key)) || [];

    // highlight sibling viewfields on either the selected or the hovered sequences
    const highlightedImageKeys = utilArrayUnion(hoveredImageKeys, selectedImageKeys);

    context.container().selectAll('.layer-vegbilder .viewfield-group')
      .classed('highlighted', d => highlightedImageKeys.indexOf(d.key) !== -1)
      .classed('hovered', d => d.key === hoveredImageKey)
      .classed('currentView', d => d.key === selectedImageKey);

    context.container().selectAll('.layer-vegbilder .sequence')
      .classed('highlighted', d => d.properties.key === hoveredSequenceKey)
      .classed('currentView', d => d.properties.key === selectedSequenceKey);

    // update viewfields if needed
    context.container().selectAll('.layer-vegbilder .viewfield-group .viewfield')
      .attr('d', viewfieldPath);

    function viewfieldPath() {
      const d = this.parentNode.__data__;
      if (d.is_pano && d.key !== selectedImageKey) {
        return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
      } else {
        return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
      }
    }

    return this;
  },


  updateUrlImage: function (key) {
    if (!window.mocha) {
      const hash = utilStringQs(window.location.hash);
      if (key) {
        hash.photo = 'vegbilder/' + key;
      } else {
        delete hash.photo;
      }
      window.location.replace('#' + utilQsString(hash, true));
    }
  },


  cache: function () {
    return _vegbilderCache;
  }

};
