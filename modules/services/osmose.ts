import RBush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import { marked } from 'marked';
import { PbfReader } from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

import { fileFetcher } from '../core/file_fetcher';
import { localizer } from '../core/localizer';
import { geoExtent, geoVecAdd } from '../geo';
import { osmIdManager, QAItem } from '../osm';
import { utilRebind, utilTiler, utilQsString } from '../util';
import { ApiError } from '../util/error';
import type { WithBbox } from '../util/partition';
import type { Tile } from '../util/tiler';
import type { Vec2 } from '../geo/vector';
import type { Projection } from '../geo/raw_mercator';
import type { Feature, Point } from 'geojson';

const tiler = utilTiler();
const dispatch = d3_dispatch('loaded');
const _tileZoom = 14;
const _osmoseUrlRoot = 'https://osmose.openstreetmap.fr/api/0.3';
let _osmoseData: QAData['osmose'] = { icons: {}, items: [] };

export interface QAData {
    osmose: {
        icons: {
            [id: string]: string;
        };
        items: string[];
    };
}

interface OsmoseRawItem {
    class: {
        title: { auto: string } | null;
        detail: { auto: string } | null;
        fix: { auto: string } | null;
        trap: { auto: string } | null;
    }[];
    item: number;
    color?: string;
}

interface OsmoseGeoJsonProperties {
    item: number;
    class: number;
    uuid: string;
}

interface OsmoseClassApiResponse {
    categories: {
        items: OsmoseRawItem[];
    }[];
}

interface OsmoseIssueApiResponse {
    elems: {
        type: 'node' | 'way' | 'relation';
        id: number;
    }[];
    subtitle: { auto: string } | null;
}

interface Cache {
    rtree: RBush<WithBbox<QAItem>>;
    inflightTile: {
        [tileId: string]: AbortController;
    };
    inflightPost: {
        [issueId: string]: AbortController;
    };
    loadedTile: {
        [tileId: string]: boolean;
    };
    closed: {
        [item: number]: number;
    };
    strings: {
        [locale: string]: {
            [itemType: string]: {
                [stringKey: string]: string;
            };
        };
    };
    colors: {
        [item: number]: string;
    };
    data: {
        [itemId: string]: QAItem;
    };
}

// This gets reassigned if reset
let _cache: Cache;

function abortRequest(controller: AbortController) {
  if (controller) {
    controller.abort();
  }
}

function abortUnwantedRequests(cache: Cache, tiles: Tile[]) {
  Object.keys(cache.inflightTile).forEach(k => {
    let wanted = tiles.find(tile => k === tile.id);
    if (!wanted) {
      abortRequest(cache.inflightTile[k]);
      delete cache.inflightTile[k];
    }
  });
}

function encodeIssueRtree(d: QAItem) {
  return { minX: d.loc[0], minY: d.loc[1], maxX: d.loc[0], maxY: d.loc[1], data: d };
}

// Replace or remove QAItem from rtree
function updateRtree(item: WithBbox<QAItem>, replace?: boolean) {
  _cache.rtree.remove(item, (a, b) => a.data.id === b.data.id);

  if (replace) {
    _cache.rtree.insert(item);
  }
}

// Issues shouldn't obscure each other
function preventCoincident(loc: Vec2) {
  let coincident: number | false = false;
  do {
    // first time, move marker up. after that, move marker right.
    let delta: Vec2 = coincident ? [0.00001, 0] : [0, 0.00001];
    loc = geoVecAdd(loc, delta);
    let bbox = geoExtent(loc).bbox();
    coincident = _cache.rtree.search(bbox).length;
  } while (coincident);

  return loc;
}

class Osmose {
    event!: Pick<typeof dispatch, 'on'>;
    on!: typeof dispatch['on'];

    title = 'osmose';

  init() {
    fileFetcher.get('qa_data')
      .then(d => {
        _osmoseData = d.osmose;
        _osmoseData.items = Object.keys(d.osmose.icons)
          .map(s => s.split('-')[0])
          .reduce<string[]>((unique, item) => unique.indexOf(item) !== -1 ? unique : [...unique, item], []);
      });

    if (!_cache) {
      this.reset();
    }

    this.event = utilRebind(this, dispatch, 'on');
  }

  reset() {
    let _strings = {};
    let _colors = {};
    if (_cache) {
      Object.values(_cache.inflightTile).forEach(abortRequest);
      // Strings and colors are static and should not be re-populated
      _strings = _cache.strings;
      _colors = _cache.colors;
    }
    _cache = {
      data: {},
      loadedTile: {},
      inflightTile: {},
      inflightPost: {},
      closed: {},
      rtree: new RBush(),
      strings: _strings,
      colors: _colors
    };
  }

  loadIssues(projection: Projection) {
    let params = {
      // Tiles return a maximum # of issues
      // So we want to filter our request for only types iD supports
      item: _osmoseData.items.join(','),
    };

    // determine the needed tiles to cover the view
    let tiles = tiler
      .zoomExtent([_tileZoom, _tileZoom])
      .getTiles(projection);

    // abort inflight requests that are no longer needed
    abortUnwantedRequests(_cache, tiles);

    // issue new requests..
    tiles.forEach(tile => {
      if (_cache.loadedTile[tile.id] || _cache.inflightTile[tile.id]) return;

      let [ x, y, z ] = tile.xyz;
      let url = `${_osmoseUrlRoot}/issues/${z}/${x}/${y}.mvt?` + utilQsString(params);

      let controller = new AbortController();
      _cache.inflightTile[tile.id] = controller;

      fetch(url, { signal: controller.signal })
        .then(data => data.arrayBuffer())
        .then(arrayBuffer => {
          delete _cache.inflightTile[tile.id];
          _cache.loadedTile[tile.id] = true;

          var vectorTile = new VectorTile(new PbfReader(arrayBuffer));
          const data = vectorTile.layers.issues;
          const features = [];
          for (let i = 0; i < data.length; i++) {
            features.push(data.feature(i).toGeoJSON(x, y, z) as Feature<Point, OsmoseGeoJsonProperties>);
          }

          if (features.length > 0) {
            features.forEach(issue => {
              const { item, class: cl, uuid: id } = issue.properties;
              /* Osmose issues are uniquely identified by a unique
                `item` and `class` combination (both integer values) */
              const itemType = `${item}-${cl}`;

              // Filter out unsupported issue types (some are too specific or advanced)
              if (itemType in _osmoseData.icons) {
                let loc = issue.geometry.coordinates as Vec2; // lon, lat
                loc = preventCoincident(loc);

                let d = new QAItem(loc, this, itemType, id, { item });

                // Setting elems here prevents UI detail requests
                if (item === 8300 || item === 8360) {
                  d.elems = [];
                }

                _cache.data[d.id] = d;
                _cache.rtree.insert(encodeIssueRtree(d));
              }
            });
          }

          dispatch.call('loaded');
        })
        .catch(() => {
          delete _cache.inflightTile[tile.id];
          _cache.loadedTile[tile.id] = true;
        });
    });
  }

  loadIssueDetail(issue: QAItem) {
    // Issue details only need to be fetched once
    if (issue.elems !== undefined) {
      return Promise.resolve(issue);
    }

    const url = `${_osmoseUrlRoot}/issue/${issue.id}?langs=${localizer.localeCode()}`;

    const cacheDetails = (data?: OsmoseIssueApiResponse) => {
      if (!data) return;

      // Associated elements used for highlighting
      // Assign directly for immediate use in the callback
      issue.elems = data.elems.map(e => osmIdManager.fromOSM(e.type, e.id));

      // Some issues have instance specific detail in a subtitle
      issue.detail = data.subtitle ? marked(data.subtitle.auto, { async: false }) : '';

      this.replaceItem(issue);
    };

    return d3_json<OsmoseIssueApiResponse>(url).then(cacheDetails).then(() => issue);
  }

  loadStrings(locale=localizer.localeCode()) {
    const items = Object.keys(_osmoseData.icons);

    if (
      locale in _cache.strings
      && Object.keys(_cache.strings[locale]).length === items.length
    ) {
        return Promise.resolve(_cache.strings[locale]);
    }

    // May be partially populated already if some requests were successful
    if (!(locale in _cache.strings)) {
      _cache.strings[locale] = {};
    }

    // Only need to cache strings for supported issue types
    // Using multiple individual item + class requests to reduce fetched data size
    const allRequests = items.map(itemType => {
      // No need to request data we already have
      if (itemType in _cache.strings[locale]) return null;

      const cacheData = (data?: OsmoseClassApiResponse) => {
        if (!data) return;

        // Bunch of nested single value arrays of objects
        const [ cat = {items:[]} ] = data.categories;
        const item = cat.items[0];
        const cl = item?.class[0];

        // If null default value is reached, data wasn't as expected (or was empty)
        if (!cl) {
          /* eslint-disable no-console */
          console.log(`Osmose strings request (${itemType}) had unexpected data`);
          /* eslint-enable no-console */
          return;
        }

        // Cache served item colors to automatically style issue markers later
        const { item: itemInt, color } = item;
        if (color && /^#[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}/.test(color)) {
          _cache.colors[itemInt] = color;
        }

        // Value of root key will be null if no string exists
        // If string exists, value is an object with key 'auto' for string
        const { title, detail, fix, trap } = cl;

        // Osmose titles shouldn't contain markdown
        let issueStrings: Record<string, string> = {};
        if (title) issueStrings.title = title.auto;
        if (detail) issueStrings.detail = marked(detail.auto, { async: false });
        if (trap) issueStrings.trap = marked(trap.auto, { async: false });
        if (fix) issueStrings.fix = marked(fix.auto, { async: false });

        _cache.strings[locale][itemType] = issueStrings;
      };

      const [ item, cl ] = itemType.split('-');

      // Osmose API falls back to English strings where untranslated or if locale doesn't exist
      const url = `${_osmoseUrlRoot}/items/${item}/class/${cl}?langs=${locale}`;

      return d3_json<OsmoseClassApiResponse>(url).then(cacheData);
    }).filter(Boolean);

    return Promise.all(allRequests).then(() => _cache.strings[locale]);
  }

  getStrings(itemType: string, locale=localizer.localeCode()) {
    // No need to fallback to English, Osmose API handles this for us
    return _cache.strings[locale]?.[itemType] || {};
  }

  getColor(itemType: number) {
    return (itemType in _cache.colors) ? _cache.colors[itemType] : '#FFFFFF';
  }

  postUpdate(issue: QAItem, callback: Callback<QAItem>) {
    if (_cache.inflightPost[issue.id]) {
      return callback(new ApiError('Issue update already inflight', -2));
    }

    // UI sets the status to either 'done' or 'false'
    const url = `${_osmoseUrlRoot}/issue/${issue.id}/${issue.newStatus}`;
    const controller = new AbortController();
    const after = () => {
      delete _cache.inflightPost[issue.id];

      this.removeItem(issue);
      if (issue.newStatus === 'done') {
        // Keep track of the number of issues closed per `item` to tag the changeset
        if (!(issue.item in _cache.closed)) {
          _cache.closed[issue.item] = 0;
        }
        _cache.closed[issue.item] += 1;
      }
      if (callback) callback(null, issue);
    };

    _cache.inflightPost[issue.id] = controller;

    fetch(url, { signal: controller.signal })
      .then(after)
      .catch(err => {
        delete _cache.inflightPost[issue.id];
        if (callback) callback(err);
      });
  }

  // Get all cached QAItems covering the viewport
  getItems(projection: Projection) {
    const viewport = projection.clipExtent();
    const min: Vec2 = [viewport[0][0], viewport[1][1]];
    const max: Vec2 = [viewport[1][0], viewport[0][1]];
    const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();

    return _cache.rtree.search(bbox).map(d => d.data);
  }

  // Get a QAItem from cache
  // NOTE: Don't change method name until UI v3 is merged
  getError(id: string) {
    return _cache.data[id];
  }

  // get the name of the icon to display for this item
  getIcon(itemType: string) {
    return _osmoseData.icons[itemType];
  }

  // Replace a single QAItem in the cache
  replaceItem(item: QAItem) {
    if (!(item instanceof QAItem) || !item.id) return;

    _cache.data[item.id] = item;
    updateRtree(encodeIssueRtree(item), true); // true = replace
    return item;
  }

  // Remove a single QAItem from the cache
  removeItem(item: QAItem) {
    if (!(item instanceof QAItem) || !item.id) return;

    delete _cache.data[item.id];
    updateRtree(encodeIssueRtree(item), false); // false = remove
  }

  // Used to populate `closed:osmose:*` changeset tags
  getClosedCounts() {
    return _cache.closed;
  }

  itemURL(item: QAItem) {
    return `https://osmose.openstreetmap.fr/en/error/${item.id}`;
  }
};
export default new Osmose;
export type { Osmose };
