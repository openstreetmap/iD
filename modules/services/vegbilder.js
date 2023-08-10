import { json as d3_json, xml as d3_xml} from 'd3-fetch';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { pairs as d3_pairs } from 'd3-array';
import RBush from 'rbush';
import { iso1A2Codes } from '@rapideditor/country-coder';
import { t, localizer } from '../core/localizer';
import { utilQsString, utilTiler, utilRebind, utilArrayUnion, utilStringQs} from '../util';
import {geoExtent, geoScaleToZoom, geoVecAngle, geoVecEqual} from '../geo';
import pannellumPhotoFrame from './pannellum_photo';
import planePhotoFrame from './plane_photo';


const owsEndpoint = 'https://www.vegvesen.no/kart/ogc/vegbilder_1_0/ows?';
const tileZoom = 14;
const tiler = utilTiler().zoomExtent([tileZoom, tileZoom]).skipNullIsland(true);
const dispatch = d3_dispatch('loadedImages', 'viewerChanged');
const directionEnum = Object.freeze({
  forward: Symbol(0),
  backward: Symbol(1)
});

let _planeFrame;
let _pannellumFrame;
let _currentFrame;
let _loadViewerPromise;
let _vegbilderCache;

async function fetchAvailableLayers() {
  const params = {
    service: 'WFS',
    request: 'GetCapabilities',
    version: '2.0.0',
  };

  const urlForRequest = owsEndpoint + utilQsString(params);
  const response = await d3_xml(urlForRequest);
  const xPathSelector = '/wfs:WFS_Capabilities/wfs:FeatureTypeList/wfs:FeatureType/wfs:Name';
  const regexMatcher = /^vegbilder_1_0:Vegbilder(?<image_type>_360)?_(?<year>\d{4})$/;
  const NSResolver = response.createNSResolver(response);
  const l = response.evaluate(
    xPathSelector,
    response,
    NSResolver,
    XPathResult.ANY_TYPE
    );
  let node;
  const availableLayers = [];
  while ( (node = l.iterateNext()) !== null ) {
    const match = node.textContent?.match(regexMatcher);
    if (match) {
      availableLayers.push({
        name: match[0],
        is_sphere: !!match.groups?.image_type,
        year: parseInt(match.groups?.year, 10)
      });
    }
  }
  return availableLayers;
}

function filterAvailableLayers(photoContex) {
  const fromDateString = photoContex.fromDate();
  const toDateString = photoContex.toDate();
  const fromYear = fromDateString ? new Date(fromDateString).getFullYear() : 2016;
  const toYear = toDateString ? new Date(toDateString).getFullYear() : null;
  const showsFlat = photoContex.showsFlat();
  const showsPano = photoContex.showsPanoramic();
  return Array.from(_vegbilderCache.wfslayers.values()).filter(({layerInfo}) => (
    (layerInfo.year >= fromYear) &&
    (!toYear || (layerInfo.year <= toYear)) &&
    ((!layerInfo.is_sphere && showsFlat) || (layerInfo.is_sphere && showsPano))
  ));
}

function loadWFSLayers(projection, margin, wfslayers) {
  const tiles = tiler.margin(margin).getTiles(projection);
  for (const cache of wfslayers) {
    loadWFSLayer(projection, cache, tiles);
  }
}

function loadWFSLayer(projection, cache, tiles) {
  // abort inflight requests that are no longer needed
  for (const [key, controller] of cache.inflight.entries()) {
    const wanted = tiles.some(tile => key === tile.id);
    if (!wanted) {
      controller.abort();
      cache.inflight.delete(key);
    }
  }

  Promise.all(tiles.map(
          tile => loadTile(cache, cache.layerInfo.name, tile)
          )).then(() => orderSequences(projection, cache));
}

/**
* loadNextTilePage() load data for the next tile page in line.
*/
async function loadTile(cache, typename, tile) {
  const bbox = tile.extent.bbox();
  const tileid = tile.id;
  if ((cache.loaded.get(tileid) === true) || cache.inflight.has(tileid)) return;

  const params = {
    service: 'WFS',
    request: 'GetFeature',
    version: '2.0.0',
    typenames: typename,
    bbox: [bbox.minY, bbox.minX, bbox.maxY, bbox.maxX].join(','),
    outputFormat: 'json'
  };

  const controller = new AbortController();
  cache.inflight.set(tileid, controller);

  const options = {
    method: 'GET',
    signal: controller.signal,
  };

  const urlForRequest = owsEndpoint + utilQsString(params);

  let featureCollection;
  try {
    featureCollection = await d3_json(urlForRequest, options);
  } catch {
    cache.loaded.set(tileid, false);
    return;
  } finally {
    cache.inflight.delete(tileid);
  }

  cache.loaded.set(tileid, true);

  if (featureCollection.features.length === 0) { return; }

  const features = featureCollection.features.map(feature => {
    const loc = feature.geometry.coordinates;
    const key = feature.id;
    const properties = feature.properties;
    const {
      RETNING: ca,
      TIDSPUNKT: captured_at,
      URL: image_path,
      URLPREVIEW : preview_path,
      BILDETYPE: image_type,
      METER: metering,
      FELTKODE: lane_code
    } = properties;
    const lane_number = parseInt(lane_code.match(/^[0-9]+/)[0], 10);
    const direction = lane_number % 2 === 0 ? directionEnum.backward : directionEnum.forward;
    const data = {
      loc,
      key,
      ca,
      image_path,
      preview_path,
      road_reference: roadReference(properties),
      metering,
      lane_code,
      direction,
      captured_at: new Date(captured_at),
      is_sphere: image_type === '360'
    };

    cache.points.set(key, data);

    return {
      minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data
    };
  });

  _vegbilderCache.rtree.load(features);
  dispatch.call('loadedImages');
}

function orderSequences(projection, cache) {
  const {points} = cache;

  const grouped = Array.from(points.values()).reduce((grouped, image) => {
    const key = image.road_reference;
    if (grouped.has(key)) {
      grouped.get(key).push(image);
    } else {
      grouped.set(key, [image]);
    }
    return grouped;
  }, new Map());

  const imageSequences = Array.from(grouped.values()).reduce((imageSequences, imageGroup) => {
    imageGroup.sort((a, b) => {
      if (a.captured_at.valueOf() > b.captured_at.valueOf()) {
        return 1;
      } else if (a.captured_at.valueOf() < b.captured_at.valueOf()) {
        return -1;
      } else {
        const {direction} = a;
        if (direction === directionEnum.forward) {
          return a.metering - b.metering;
        } else {
          return b.metering - a.metering;
        }
      }
    });
    let imageSequence = [imageGroup[0]];
    let angle = null;
    for (const [lastImage, image] of d3_pairs(imageGroup)) {
      if (lastImage.ca === null) {
        const b = projection(lastImage.loc);
        const a = projection(image.loc);
        if (!geoVecEqual(a, b)) {
          angle = geoVecAngle(a, b);
          angle *= (180 / Math.PI);
          angle -= 90;
          angle = angle >= 0 ? angle : angle + 360;
        }
        lastImage.ca = angle;
      }
      if (
              image.direction === lastImage.direction &&
              image.captured_at.valueOf() - lastImage.captured_at.valueOf() <= 20000
              ) {
        imageSequence.push(image);
      } else {
        imageSequences.push(imageSequence);
        imageSequence = [image];
      }
    }
    imageSequences.push(imageSequence);
    return imageSequences;
  }, []);

  cache.sequences = imageSequences.map(images => {
    const sequence = {
      images,
      key: images[0].key,
      geometry : {
        type : 'LineString',
        coordinates : images.map(image => image.loc)
      }
    };
    for (const image of images) {
      _vegbilderCache.image2sequence_map.set(image.key, sequence);
    }
    return sequence;
  });
}

function roadReference(properties) {
  const {
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
    AAR: year,
  } = properties;

  let reference;

  if (year >= 2020) {
    reference = `${road_class}${road_status}${road_number} S${section}D${subsection}`;
    if (junction_part) {
      reference = `${reference} M${anker_point} KD${junction_part}`;
    } else if (services_part) {
      reference = `${reference} M${anker_point} SD${services_part}`;
    }
  } else {
    reference = `${county_number}${road_class}${road_status}${road_number} HP${parcel}`;
  }

  return reference;
}

function localeTimestamp(date) {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric' };
  return date.toLocaleString(localizer.localeCode(), options);
}

function partitionViewport(projection) {
  const zoom = geoScaleToZoom(projection.scale());
  const roundZoom = (Math.ceil(zoom * 2) / 2) + 2.5;   // round to next 0.5 and add 2.5
  const tiler = utilTiler().zoomExtent([roundZoom, roundZoom]);

  return tiler.getTiles(projection)
    .map(tile => tile.extent);
}

function searchLimited(limit, projection, rtree) {
  limit ??= 5;

  return partitionViewport(projection)
    .reduce((result, extent) => {
      const found = rtree.search(extent.bbox())
        .slice(0, limit)
        .map(d => d.data);

      return result.concat(found);
    }, []);
}


export default {

  init: function () {
    this.event = utilRebind(this, dispatch, 'on');
  },

  reset: async function () {
    if (_vegbilderCache) {
      for (const layer of _vegbilderCache.wfslayers.values()) {
        for (const controller of layer.inflight.values()) {
          controller.abort();
        }
      }
    }

    _vegbilderCache = {
      wfslayers: new Map(),
      rtree: new RBush(),
      image2sequence_map: new Map()
    };

    const availableLayers = await fetchAvailableLayers();
    const {wfslayers} = _vegbilderCache;

    for (const layerInfo of availableLayers) {
      const cache = {
        layerInfo,
        loaded: new Map(),
        inflight: new Map(),
        points: new Map(),
        sequences: []
      };
      wfslayers.set(layerInfo.name, cache);
    }
  },

  images: function (projection) {
    const limit = 5;
    return searchLimited(limit, projection, _vegbilderCache.rtree);
  },


  sequences: function (projection) {
    const viewport = projection.clipExtent();
    const min = [viewport[0][0], viewport[1][1]];
    const max = [viewport[1][0], viewport[0][1]];
    const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
    const seen = new Set();
    const line_strings = [];

    for (const {data} of _vegbilderCache.rtree.search(bbox)) {
      const sequence = _vegbilderCache.image2sequence_map.get(data.key);
      if (!sequence) continue;
      const {key, geometry, images} = sequence;
      if (seen.has(key)) continue;
      seen.add(key);
      const line = {
        type: 'LineString',
        coordinates: geometry.coordinates,
        key,
        images
      };
      line_strings.push(line);
  }
    return line_strings;
  },

  cachedImage: function (key) {
    for (const {points} of _vegbilderCache.wfslayers.values()) {
      if (points.has(key)) return points.get(key);
    }
  },

  getSequenceForImage: function (image) {
    return _vegbilderCache?.image2sequence_map.get(image?.key);
  },

  loadImages: async function (context, margin) {
    if (!_vegbilderCache) {
      await this.reset();
    }
    margin ??= 1;
    const wfslayers = filterAvailableLayers(context.photos());
    loadWFSLayers(context.projection, margin, wfslayers);
  },

  photoFrame: function() {
    return _currentFrame;
  },

  ensureViewerLoaded: function(context) {

    if (_loadViewerPromise) return _loadViewerPromise;

    const step = (stepBy) => () => {
      const viewer = context.container().select('.photoviewer');
      const selected = viewer.empty() ? undefined : viewer.datum();
      if (!selected) return;

      const sequence = this.getSequenceForImage(selected);
      const nextIndex = sequence.images.indexOf(selected) + stepBy;
      const nextImage = sequence.images[nextIndex];

      if (!nextImage) return;

      context.map().centerEase(nextImage.loc);
      this.selectImage(context, nextImage.key, true);
    };

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

    _loadViewerPromise = Promise.all([
      pannellumPhotoFrame.init(context, wrapEnter),
      planePhotoFrame.init(context, wrapEnter)
    ]).then(([pannellumPhotoFrame, planePhotoFrame]) => {
      _pannellumFrame = pannellumPhotoFrame;
      _pannellumFrame.event.on('viewerChanged', () => dispatch.call('viewerChanged'));
      _planeFrame = planePhotoFrame;
      _planeFrame.event.on('viewerChanged', () => dispatch.call('viewerChanged'));
    });

    return _loadViewerPromise;
  },

  selectImage: function(context, key, keepOrientation) {
    const d = this.cachedImage(key);
    this.updateUrlImage(key);

    const viewer = context.container().select('.photoviewer');
    if (!viewer.empty()) { viewer.datum(d); }

    this.setStyles(context, null, true);

    if (!d) return this;

    const wrap = context.container().select('.photoviewer .vegbilder-wrapper');
    const attribution = wrap.selectAll('.photo-attribution').text('');

    if (d.captured_at) {
      attribution
        .append('span')
        .attr('class', 'captured_at')
        .text(localeTimestamp(d.captured_at));
    }

    attribution
      .append('a')
      .attr('target', '_blank')
      .attr('href', 'https://vegvesen.no')
      .call(t.append('vegbilder.publisher'));

    attribution
      .append('a')
      .attr('target', '_blank')
      .attr('href', `https://vegbilder.atlas.vegvesen.no/?year=${d.captured_at.getFullYear()}&lat=${d.loc[1]}&lng=${d.loc[0]}&view=image&imageId=${d.key}`)
      .call(t.append('vegbilder.view_on'));

    _currentFrame = d.is_sphere? _pannellumFrame : _planeFrame;

    _currentFrame
      .selectPhoto(d, keepOrientation)
      .showPhotoFrame(wrap);

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

    context.container().selectAll('.viewfield-group, .sequence')
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

    const hoveredImageKey = hovered?.key;
    const hoveredSequence = this.getSequenceForImage(hovered);
    const hoveredSequenceKey = hoveredSequence?.key;
    const hoveredImageKeys = hoveredSequence?.images.map(d => d.key) ?? [];

    const viewer = context.container().select('.photoviewer');
    const selected = viewer.empty() ? undefined : viewer.datum();
    const selectedImageKey = selected?.key;
    const selectedSequence = this.getSequenceForImage(selected);
    const selectedSequenceKey = selectedSequence?.key;
    const selectedImageKeys = selectedSequence?.images.map(d => d.key) ?? [];

    // highlight sibling viewfields on either the selected or the hovered sequences
    const highlightedImageKeys = utilArrayUnion(hoveredImageKeys, selectedImageKeys);

    context.container().selectAll('.layer-vegbilder .viewfield-group')
      .classed('highlighted', d => highlightedImageKeys.indexOf(d.key) !== -1)
      .classed('hovered', d => d.key === hoveredImageKey)
      .classed('currentView', d => d.key === selectedImageKey);

    context.container().selectAll('.layer-vegbilder .sequence')
      .classed('highlighted', d => d.key === hoveredSequenceKey)
      .classed('currentView', d => d.key === selectedSequenceKey);

    // update viewfields if needed
    context.container().selectAll('.layer-vegbilder .viewfield-group .viewfield')
      .attr('d', viewfieldPath);

    function viewfieldPath() {
      const d = this.parentNode.__data__;
      if (d.is_sphere && d.key !== selectedImageKey) {
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

  validHere: function(extent) {
    const bbox = Object.values(extent.bbox());
    return iso1A2Codes(bbox).includes('NO');
  },


  cache: function () {
    return _vegbilderCache;
  }

};
