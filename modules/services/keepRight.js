import RBush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import { fileFetcher } from '../core/file_fetcher';
import { geoExtent, geoVecAdd } from '../geo';
import { QAItem } from '../osm';
import { t } from '../core/localizer';
import { utilRebind, utilTiler, utilQsString } from '../util';


const tiler = utilTiler();
const dispatch = d3_dispatch('loaded');
const _tileZoom = 14;
const _krUrlRoot = 'https://www.keepright.at';
let _krData = { errorTypes: {}, localizeStrings: {} };

// This gets reassigned if reset
let _cache;

const _krRuleset = [
  // no 20 - multiple node on same spot - these are mostly boundaries overlapping roads
  30, 40, 50, 60, 70, 90, 100, 110, 120, 130, 150, 160, 170, 180,
  190, 191, 192, 193, 194, 195, 196, 197, 198,
  200, 201, 202, 203, 204, 205, 206, 207, 208, 210, 220,
  230, 231, 232, 270, 280, 281, 282, 283, 284, 285,
  290, 291, 292, 293, 294, 295, 296, 297, 298, 300, 310, 311, 312, 313,
  320, 350, 360, 370, 380, 390, 400, 401, 402, 410, 411, 412, 413
];


function abortRequest(controller) {
  if (controller) {
    controller.abort();
  }
}

function abortUnwantedRequests(cache, tiles) {
  Object.keys(cache.inflightTile).forEach(k => {
    const wanted = tiles.find(tile => k === tile.id);
    if (!wanted) {
      abortRequest(cache.inflightTile[k]);
      delete cache.inflightTile[k];
    }
  });
}


function encodeIssueRtree(d) {
  return { minX: d.loc[0], minY: d.loc[1], maxX: d.loc[0], maxY: d.loc[1], data: d };
}


// Replace or remove QAItem from rtree
function updateRtree(item, replace) {
  _cache.rtree.remove(item, (a, b) => a.data.id === b.data.id);

  if (replace) {
    _cache.rtree.insert(item);
  }
}


function tokenReplacements(d) {
  if (!(d instanceof QAItem)) return;

  const htmlRegex = new RegExp(/<\/[a-z][\s\S]*>/);
  const replacements = {};

  const issueTemplate = _krData.errorTypes[d.whichType];
  if (!issueTemplate) {
    /* eslint-disable no-console */
    console.log('No Template: ', d.whichType);
    console.log('  ', d.description);
    /* eslint-enable no-console */
    return;
  }

  // some descriptions are just fixed text
  if (!issueTemplate.regex) return;

  // regex pattern should match description with variable details captured
  const errorRegex = new RegExp(issueTemplate.regex, 'i');
  const errorMatch = errorRegex.exec(d.description);
  if (!errorMatch) {
    /* eslint-disable no-console */
    console.log('Unmatched: ', d.whichType);
    console.log('  ', d.description);
    console.log('  ', errorRegex);
    /* eslint-enable no-console */
    return;
  }

  for (let i = 1; i < errorMatch.length; i++) {   // skip first
    let capture = errorMatch[i];
    let idType;

    idType = 'IDs' in issueTemplate ? issueTemplate.IDs[i-1] : '';
    if (idType && capture) {   // link IDs if present in the capture
      capture = parseError(capture, idType);
    } else if (htmlRegex.test(capture)) {   // escape any html in non-IDs
      capture = '\\' +  capture + '\\';
    } else {
      const compare = capture.toLowerCase();
      if (_krData.localizeStrings[compare]) {   // some replacement strings can be localized
        capture = t('QA.keepRight.error_parts.' + _krData.localizeStrings[compare]);
      }
    }

    replacements['var' + i] = capture;
  }

  return replacements;
}


function parseError(capture, idType) {
  const compare = capture.toLowerCase();
  if (_krData.localizeStrings[compare]) {   // some replacement strings can be localized
    capture = t('QA.keepRight.error_parts.' + _krData.localizeStrings[compare]);
  }

  switch (idType) {
    // link a string like "this node"
    case 'this':
      capture = linkErrorObject(capture);
      break;

    case 'url':
      capture = linkURL(capture);
      break;

    // link an entity ID
    case 'n':
    case 'w':
    case 'r':
      capture = linkEntity(idType + capture);
      break;

    // some errors have more complex ID lists/variance
    case '20':
      capture = parse20(capture);
      break;
    case '211':
      capture = parse211(capture);
      break;
    case '231':
      capture = parse231(capture);
      break;
    case '294':
      capture = parse294(capture);
      break;
    case '370':
      capture = parse370(capture);
      break;
  }

  return capture;


  function linkErrorObject(d) {
    return `<a class="error_object_link">${d}</a>`;
  }

  function linkEntity(d) {
    return `<a class="error_entity_link">${d}</a>`;
  }

  function linkURL(d) {
    return `<a class="kr_external_link" target="_blank" href="${d}">${d}</a>`;
  }

  // arbitrary node list of form: #ID, #ID, #ID...
  function parse211(capture) {
    let newList = [];
    const items = capture.split(', ');

    items.forEach(item => {
      // ID has # at the front
      let id = linkEntity('n' + item.slice(1));
      newList.push(id);
    });

    return newList.join(', ');
  }

  // arbitrary way list of form: #ID(layer),#ID(layer),#ID(layer)...
  function parse231(capture) {
    let newList = [];
    // unfortunately 'layer' can itself contain commas, so we split on '),'
    const items = capture.split('),');

    items.forEach(item => {
      const match = item.match(/\#(\d+)\((.+)\)?/);
      if (match !== null && match.length > 2) {
        newList.push(linkEntity('w' + match[1]) + ' ' +
          t('QA.keepRight.errorTypes.231.layer', { layer: match[2] })
        );
      }
    });

    return newList.join(', ');
  }

  // arbitrary node/relation list of form: from node #ID,to relation #ID,to node #ID...
  function parse294(capture) {
    let newList = [];
    const items = capture.split(',');

    items.forEach(item => {
      // item of form "from/to node/relation #ID"
      item = item.split(' ');

      // to/from role is more clear in quotes
      const role = `"${item[0]}"`;

      // first letter of node/relation provides the type
      const idType = item[1].slice(0,1);

      // ID has # at the front
      let id = item[2].slice(1);
      id = linkEntity(idType + id);

      newList.push(`${role} ${item[1]} ${id}`);
    });

    return newList.join(', ');
  }

  // may or may not include the string "(including the name 'name')"
  function parse370(capture) {
    if (!capture) return '';

    const match = capture.match(/\(including the name (\'.+\')\)/);
    if (match && match.length) {
      return t('QA.keepRight.errorTypes.370.including_the_name', { name: match[1] });
    }
    return '';
  }

  // arbitrary node list of form: #ID,#ID,#ID...
  function parse20(capture) {
    let newList = [];
    const items = capture.split(',');

    items.forEach(item => {
      // ID has # at the front
      const id = linkEntity('n' + item.slice(1));
      newList.push(id);
    });

    return newList.join(', ');
  }
}


export default {
  title: 'keepRight',

  init() {
    fileFetcher.get('keepRight')
      .then(d => _krData = d);

    if (!_cache) {
      this.reset();
    }

    this.event = utilRebind(this, dispatch, 'on');
  },

  reset() {
    if (_cache) {
      Object.values(_cache.inflightTile).forEach(abortRequest);
    }

    _cache = {
      data: {},
      loadedTile: {},
      inflightTile: {},
      inflightPost: {},
      closed: {},
      rtree: new RBush()
    };
  },


  // KeepRight API:  http://osm.mueschelsoft.de/keepright/interfacing.php
  loadIssues(projection) {
    const options = {
      format: 'geojson',
      ch: _krRuleset
    };

    // determine the needed tiles to cover the view
    const tiles = tiler
      .zoomExtent([_tileZoom, _tileZoom])
      .getTiles(projection);

    // abort inflight requests that are no longer needed
    abortUnwantedRequests(_cache, tiles);

    // issue new requests..
    tiles.forEach(tile => {
      if (_cache.loadedTile[tile.id] || _cache.inflightTile[tile.id]) return;

      const [ left, top, right, bottom ] = tile.extent.rectangle();
      const params = Object.assign({}, options, { left, bottom, right, top });
      const url = `${_krUrlRoot}/export.php?` + utilQsString(params);
      const controller = new AbortController();

      _cache.inflightTile[tile.id] = controller;

      d3_json(url, { signal: controller.signal })
        .then(data => {
          delete _cache.inflightTile[tile.id];
          _cache.loadedTile[tile.id] = true;
          if (!data || !data.features || !data.features.length) {
            throw new Error('No Data');
          }

          data.features.forEach(feature => {
            const {
              properties: {
                error_type: itemType,
                error_id: id,
                comment = null,
                object_id: objectId,
                object_type: objectType,
                schema,
                title
              }
            } = feature;
            let {
              geometry: { coordinates: loc },
              properties: { description = '' }
            } = feature;

            // if there is a parent, save its error type e.g.:
            //  Error 191 = "highway-highway"
            //  Error 190 = "intersections without junctions"  (parent)
            const issueTemplate = _krData.errorTypes[itemType];
            const parentIssueType = (Math.floor(itemType / 10) * 10).toString();

            // try to handle error type directly, fallback to parent error type.
            const whichType = issueTemplate ? itemType : parentIssueType;
            const whichTemplate = _krData.errorTypes[whichType];

            // Rewrite a few of the errors at this point..
            // This is done to make them easier to linkify and translate.
            switch (whichType) {
              case '170':
                description = `This feature has a FIXME tag: ${description}`;
                break;
              case '292':
              case '293':
                description = description.replace('A turn-', 'This turn-');
                break;
              case '294':
              case '295':
              case '296':
              case '297':
              case '298':
                description = `This turn-restriction~${description}`;
                break;
              case '300':
                description = 'This highway is missing a maxspeed tag';
                break;
              case '411':
              case '412':
              case '413':
                description = `This feature~${description}`;
                break;
            }

            // move markers slightly so it doesn't obscure the geometry,
            // then move markers away from other coincident markers
            let coincident = false;
            do {
              // first time, move marker up. after that, move marker right.
              let delta = coincident ? [0.00001, 0] : [0, 0.00001];
              loc = geoVecAdd(loc, delta);
              let bbox = geoExtent(loc).bbox();
              coincident = _cache.rtree.search(bbox).length;
            } while (coincident);

            let d = new QAItem(loc, this, itemType, id, {
              comment,
              description,
              whichType,
              parentIssueType,
              severity: whichTemplate.severity || 'error',
              objectId,
              objectType,
              schema,
              title
            });

            d.replacements = tokenReplacements(d);

            _cache.data[id] = d;
            _cache.rtree.insert(encodeIssueRtree(d));
          });

          dispatch.call('loaded');
        })
        .catch(() => {
          delete _cache.inflightTile[tile.id];
          _cache.loadedTile[tile.id] = true;
        });

    });
  },


  postUpdate(d, callback) {
    if (_cache.inflightPost[d.id]) {
      return callback({ message: 'Error update already inflight', status: -2 }, d);
    }

    const params = { schema: d.schema, id: d.id };

    if (d.newStatus) {
      params.st = d.newStatus;
    }
    if (d.newComment !== undefined) {
      params.co = d.newComment;
    }

    // NOTE: This throws a CORS err, but it seems successful.
    // We don't care too much about the response, so this is fine.
    const url = `${_krUrlRoot}/comment.php?` + utilQsString(params);
    const controller = new AbortController();

    _cache.inflightPost[d.id] = controller;

    // Since this is expected to throw an error just continue as if it worked
    // (worst case scenario the request truly fails and issue will show up if iD restarts)
    d3_json(url, { signal: controller.signal })
      .finally(() => {
        delete _cache.inflightPost[d.id];

        if (d.newStatus === 'ignore') {
          // ignore permanently (false positive)
          this.removeItem(d);
        } else if (d.newStatus === 'ignore_t') {
          // ignore temporarily (error fixed)
          this.removeItem(d);
          _cache.closed[`${d.schema}:${d.id}`] = true;
        } else {
          d = this.replaceItem(d.update({
            comment: d.newComment,
            newComment: undefined,
            newState: undefined
          }));
        }

        if (callback) callback(null, d);
      });
  },

  // Get all cached QAItems covering the viewport
  getItems(projection) {
    const viewport = projection.clipExtent();
    const min = [viewport[0][0], viewport[1][1]];
    const max = [viewport[1][0], viewport[0][1]];
    const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();

    return _cache.rtree.search(bbox).map(d => d.data);
  },

  // Get a QAItem from cache
  // NOTE: Don't change method name until UI v3 is merged
  getError(id) {
    return _cache.data[id];
  },

  // Replace a single QAItem in the cache
  replaceItem(item) {
    if (!(item instanceof QAItem) || !item.id) return;

    _cache.data[item.id] = item;
    updateRtree(encodeIssueRtree(item), true); // true = replace
    return item;
  },

  // Remove a single QAItem from the cache
  removeItem(item) {
    if (!(item instanceof QAItem) || !item.id) return;

    delete _cache.data[item.id];
    updateRtree(encodeIssueRtree(item), false); // false = remove
  },

  issueURL(item) {
    return `${_krUrlRoot}/report_map.php?schema=${item.schema}&error=${item.id}`;
  },

  // Get an array of issues closed during this session.
  // Used to populate `closed:keepright` changeset tag
  getClosedIDs() {
    return Object.keys(_cache.closed).sort();
  }

};
