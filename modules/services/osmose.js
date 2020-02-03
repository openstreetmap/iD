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
const _osmoseUrlRoot = 'https://osmose.openstreetmap.fr/en/api/0.3beta/';
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
      item: qaServices.osmose.items.join()
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
      let url = _osmoseUrlRoot + `issues/${z}/${x}/${y}.json?` + utilQsString(params);

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

    let url = _osmoseUrlRoot + `issue/${d.identifier}`;

    d3_json(url)
      .then(data => {
        // Associated elements used for highlighting
        // Assign directly for immediate use in the callback
        d.elems = data.elems.map(e => e.type.substring(0,1) + e.id);

        // Some error types have details in their subtitle
        const special = {
          tags: {
            '3040-3040': /Bad tag value: "(.+)"/i,
            '4010-4010': /Tag (.+) is deprecated/i,
            '4010-40102': /Tag (.+) is deprecated/i,
            '4030-900': /Conflict between tags: (.+), (.+)/i,
            '5070-50703': /"(.+)"=".+" unexpected/i,
            '9010-9010001': /(.+) is unnecessary/i
          },
          values: {
            '3090-3090': /Incorrect date "(.+)"/i,
            '9010-9010003': /(.+)/
          },
          chars: {
            '5070-50703': /unexpected symbol char \(.+, (.+)\)/i,
            '5070-50704': /Umbalanced (.+)/i,
            '5070-50705': /Unexpected char (.+)/i
          },
          sug_tags: {
            '4010-4010': /Tag .+ is deprecated: (.+)/i,
            '4010-40102': /Tag .+ is deprecated: (.+)/i,
          }
        };
        for (let type in special) {
          if (d.error_type in special[type]) {
            // Destructuring doesn't work if no match returns null, hence []
            let [, ...details] = special[type][d.error_type].exec(data.subtitle) || [];

            if (
              d.error_type === '5070-50703'
              && type === 'chars'
              && details
            ) {
              details[0] = String.fromCharCode(details[0]);
            }

            // This error has a rare subtitle variant
            if (d.error_type === '9010-9010001' && !details) {
              [, ...details] = /\. Remove (.+)/i.exec(data.subtitle) || [];
            }

            if (details) d[type] = details;
          }
        }

        this.replaceError(d);
        if (callback) callback(null, d);
      })
      .catch(err => {
        if (callback) callback(err.message);
      });
  },

  loadStrings(callback, locale=currentLocale) {
    if (locale in _stringCache) {
        if (callback) callback(null, _stringCache[locale]);
        return;
    }

    // Osmose API falls back to English strings where untranslated or if locale doesn't exist
    const url = _osmoseUrlRoot + 'items?' + utilQsString({ langs: locale });

    d3_json(url)
      .then(data => {
        _stringCache[locale] = {};

        for (let i = 0; i < data.categories.length; i++) {
          let cat = data.categories[i];

          for (let j = 0; j < cat.items.length; j++) {
            let item = cat.items[j];

            // TODO: Item has 'color' key with hex color code value, automatically style issue markers

            // Only need to cache strings for supported error types
            // TODO: Investigate making multiple requests with filter by `item` and `class` to reduce data further
            // See endpoint: https://osmose.openstreetmap.fr/en/api/0.3beta/items/X/class/X?langs=X
            if (qaServices.osmose.items.indexOf(item.item) !== -1) {
              for (let k = 0; k < item.class.length; k++) {
                let { class: cl, item: cat } = item.class[k];
                let issueType = `${cat}-${cl}`;
                let issueStrings = {};

                // Value of root key will be null if no string exists
                // If string exists, value is an object with key 'auto' for string
                let { title, detail, trap, fix, example } = item.class[k];
                if (title) issueStrings.title = title.auto;
                if (detail) issueStrings.detail = detail.auto;
                if (trap) issueStrings.trap = trap.auto;
                if (fix) issueStrings.fix = fix.auto;
                if (example) issueStrings.example = example.auto;

                _stringCache[locale][issueType] = issueStrings;
              }
            }
          }
        }

        if (callback) callback(null, _stringCache[locale]);
      })
      .catch(err => {
        if (callback) callback(err.message);
      });
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
    let url = _osmoseUrlRoot + `issue/${d.identifier}/${d.newStatus}`;

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