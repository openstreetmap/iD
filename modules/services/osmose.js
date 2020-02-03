import RBush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import { currentLocale } from '../util/locale';
import { geoExtent, geoVecAdd } from '../geo';
import { qaError } from '../osm';
import { utilRebind, utilTiler, utilQsString } from '../util';
import { services as qaServices } from '../../data/qa_errors.json';

const tiler = utilTiler();
const dispatch = d3_dispatch('loaded');
const _osmoseUrlRoot = 'https://osmose.openstreetmap.fr/en/api/0.3beta';
const _osmoseItems =
  Object.keys(qaServices.osmose.errorIcons)
    .map(s => s.split('-')[0])
    .reduce((unique, item) => unique.indexOf(item) !== -1 ? unique : [...unique, item], []);
const _erZoom = 14;
const _stringCache = {};

// This gets reassigned if reset
let _erCache;

function abortRequest(controller) {
  if (controller) {
    controller.abort();
  }
}

function abortUnwantedRequests(cache, tiles) {
  Object.keys(cache.inflightTile).forEach(k => {
    let wanted = tiles.find(tile => k === tile.id);
    if (!wanted) {
      abortRequest(cache.inflightTile[k]);
      delete cache.inflightTile[k];
    }
  });
}

function encodeErrorRtree(d) {
  return { minX: d.loc[0], minY: d.loc[1], maxX: d.loc[0], maxY: d.loc[1], data: d };
}

// replace or remove error from rtree
function updateRtree(item, replace) {
  _erCache.rtree.remove(item, (a, b) => a.data.id === b.data.id);

  if (replace) {
    _erCache.rtree.insert(item);
  }
}

// Errors shouldn't obscure eachother
function preventCoincident(loc) {
  let coincident = false;
  do {
    // first time, move marker up. after that, move marker right.
    let delta = coincident ? [0.00001, 0] : [0, 0.00001];
    loc = geoVecAdd(loc, delta);
    let bbox = geoExtent(loc).bbox();
    coincident = _erCache.rtree.search(bbox).length;
  } while (coincident);

  return loc;
}

export default {
  init() {
    if (!_erCache) {
      this.reset();
    }

    this.event = utilRebind(this, dispatch, 'on');
  },

  reset() {
    if (_erCache) {
      Object.values(_erCache.inflightTile).forEach(abortRequest);
    }
    _erCache = {
      data: {},
      loadedTile: {},
      inflightTile: {},
      inflightPost: {},
      closed: {},
      rtree: new RBush()
    };
  },

  loadErrors(projection) {
    let params = {
      // Tiles return a maximum # of errors
      // So we want to filter our request for only types iD supports
      item: _osmoseItems
    };

    // determine the needed tiles to cover the view
    let tiles = tiler
      .zoomExtent([_erZoom, _erZoom])
      .getTiles(projection);

    // abort inflight requests that are no longer needed
    abortUnwantedRequests(_erCache, tiles);

    // issue new requests..
    tiles.forEach(tile => {
      if (_erCache.loadedTile[tile.id] || _erCache.inflightTile[tile.id]) return;

      let [ x, y, z ] = tile.xyz;
      let url = `${_osmoseUrlRoot}/issues/${z}/${x}/${y}.json?` + utilQsString(params);

      let controller = new AbortController();
      _erCache.inflightTile[tile.id] = controller;

      d3_json(url, { signal: controller.signal })
        .then(data => {
          delete _erCache.inflightTile[tile.id];
          _erCache.loadedTile[tile.id] = true;

          if (data.features) {
            data.features.forEach(issue => {
              const { item, class: error_class, uuid: identifier } = issue.properties;
              // Item is the type of error, w/ class tells us the sub-type
              const error_type = `${item}-${error_class}`;

              // Filter out unsupported error types (some are too specific or advanced)
              if (error_type in qaServices.osmose.errorIcons) {
                let loc = issue.geometry.coordinates; // lon, lat
                loc = preventCoincident(loc);

                let d = new qaError({
                  // Info required for every error
                  loc,
                  service: 'osmose',
                  error_type,
                  // Extra details needed for this service
                  identifier, // needed to query and update the error
                  item // category of the issue for styling
                });

                // Setting elems here prevents UI error detail requests
                if (d.item === 8300 || d.item === 8360) {
                  d.elems = [];
                }

                _erCache.data[d.id] = d;
                _erCache.rtree.insert(encodeErrorRtree(d));
              }
            });
          }

          dispatch.call('loaded');
        })
        .catch(() => {
          delete _erCache.inflightTile[tile.id];
          _erCache.loadedTile[tile.id] = true;
        });
    });
  },

  loadErrorDetail(d, callback) {
    // Error details only need to be fetched once
    if (d.elems !== undefined) {
      if (callback) callback(null, d);
      return;
    }

    let url = `${_osmoseUrlRoot}/issue/${d.identifier}?langs=${currentLocale}`;

    d3_json(url)
      .then(data => {
        // Associated elements used for highlighting
        // Assign directly for immediate use in the callback
        d.elems = data.elems.map(e => e.type.substring(0,1) + e.id);

        // Some issues have instance specific detail in a subtitle
        d.detail = data.subtitle;

        this.replaceError(d);
        if (callback) callback(null, d);
      })
      .catch(err => {
        if (callback) callback(err.message);
      });
  },

  loadStrings(callback, locale=currentLocale) {
    const issueTypes = Object.keys(qaServices.osmose.errorIcons);

    if (
      locale in _stringCache
      && Object.keys(_stringCache[locale]).length === issueTypes.length
    ) {
        if (callback) callback(null, _stringCache[locale]);
        return;
    }

    // May be partially populated already if some requests were successful
    if (!(locale in _stringCache)) {
      _stringCache[locale] = {};
    }

    const format = string => {
      // Some strings contain markdown syntax
      string = string.replace(/\[((?:.|\n)+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
      return string.replace(/`(.+?)`/g, '<code>$1</code>');
    };

    // Only need to cache strings for supported issue types
    // Using multiple individual item + class requests to reduce fetched data size
    const allRequests = issueTypes.map(issueType => {
      // No need to request data we already have
      if (issueType in _stringCache[locale]) return;

      const cacheData = data => {
        // Bunch of nested single value arrays of objects
        const [ cat = {items:[]} ] = data.categories;
        const [ item = {class:[]} ] = cat.items;
        const [ cl = null ] = item.class;

        // If null default value is reached, data wasn't as expected (or was empty)
        if (!cl) {
          /* eslint-disable no-console */
          console.log(`Osmose strings request (${issueType}) had unexpected data`);
          /* eslint-enable no-console */
          return;
        }

        // TODO: Item has 'color' key with hex color code value, automatically style issue markers
        // const { item, color } = item;

        // Value of root key will be null if no string exists
        // If string exists, value is an object with key 'auto' for string
        const { title, detail, fix, trap } = cl;

        let issueStrings = {};
        if (title) issueStrings.title = title.auto;
        if (detail) issueStrings.detail = format(detail.auto);
        if (trap) issueStrings.trap = format(trap.auto);
        if (fix) issueStrings.fix = format(fix.auto);

        _stringCache[locale][issueType] = issueStrings;
      };

      const [ item, cl ] = issueType.split('-');

      // Osmose API falls back to English strings where untranslated or if locale doesn't exist
      const url = `${_osmoseUrlRoot}/items/${item}/class/${cl}?langs=${locale}`;

      return jsonPromise(url, cacheData);
    });

    Promise.all(allRequests)
      .then(() => { if (callback) callback(null, _stringCache[locale]); })
      .catch(err => { if (callback) callback(err); });
  },

  getStrings(issueType, locale=currentLocale) {
    // No need to fallback to English, Osmose API handles this for us
    return (locale in _stringCache) ? _stringCache[locale][issueType] : {};
  },

  postUpdate(d, callback) {
    if (_erCache.inflightPost[d.id]) {
      return callback({ message: 'Error update already inflight', status: -2 }, d);
    }

    // UI sets the status to either 'done' or 'false'
    let url = `${_osmoseUrlRoot}/issue/${d.identifier}/${d.newStatus}`;

    let controller = new AbortController();
    _erCache.inflightPost[d.id] = controller;

    fetch(url, { signal: controller.signal })
      .then(() => {
        delete _erCache.inflightPost[d.id];

        this.removeError(d);
        if (d.newStatus === 'done') {
          // No error identifier, so we give a count of each category
          if (!(d.item in _erCache.closed)) {
            _erCache.closed[d.item] = 0;
          }
          _erCache.closed[d.item] += 1;
        }
        if (callback) callback(null, d);
      })
      .catch(err => {
        delete _erCache.inflightPost[d.id];
        if (callback) callback(err.message);
      });
  },


  // get all cached errors covering the viewport
  getErrors(projection) {
    let viewport = projection.clipExtent();
    let min = [viewport[0][0], viewport[1][1]];
    let max = [viewport[1][0], viewport[0][1]];
    let bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();

    return _erCache.rtree.search(bbox).map(d => {
      return d.data;
    });
  },

  // get a single error from the cache
  getError(id) {
    return _erCache.data[id];
  },

  // replace a single error in the cache
  replaceError(error) {
    if (!(error instanceof qaError) || !error.id) return;

    _erCache.data[error.id] = error;
    updateRtree(encodeErrorRtree(error), true); // true = replace
    return error;
  },

  // remove a single error from the cache
  removeError(error) {
    if (!(error instanceof qaError) || !error.id) return;

    delete _erCache.data[error.id];
    updateRtree(encodeErrorRtree(error), false); // false = remove
  },

  // Used to populate `closed:osmose:*` changeset tags
  getClosedCounts() {
    return _erCache.closed;
  }
};

function jsonPromise(url, then) {
  return new Promise((resolve, reject) => {
    d3_json(url)
      .then(data => {
        then(data);
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}