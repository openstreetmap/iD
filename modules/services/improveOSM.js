import RBush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import { fileFetcher } from '../core/file_fetcher';
import { geoExtent, geoVecAdd, geoVecScale } from '../geo';
import { QAItem } from '../osm';
import { serviceOsm } from './index';
import { t } from '../core/localizer';
import { utilRebind, utilTiler, utilQsString } from '../util';


const tiler = utilTiler();
const dispatch = d3_dispatch('loaded');
const _tileZoom = 14;
const _impOsmUrls = {
  ow: 'https://grab.community.improve-osm.org/directionOfFlowService',
  mr: 'https://grab.community.improve-osm.org/missingGeoService',
  tr: 'https://grab.community.improve-osm.org/turnRestrictionService'
};
let _impOsmData = { icons: {} };


// This gets reassigned if reset
let _cache;

function abortRequest(i) {
  Object.values(i).forEach(controller => {
    if (controller) {
      controller.abort();
    }
  });
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

function linkErrorObject(d) {
  return `<a class="error_object_link">${d}</a>`;
}

function linkEntity(d) {
  return `<a class="error_entity_link">${d}</a>`;
}

function pointAverage(points) {
  if (points.length) {
    const sum = points.reduce(
      (acc, point) => geoVecAdd(acc, [point.lon, point.lat]),
      [0,0]
    );
    return geoVecScale(sum, 1 / points.length);
  } else {
    return [0,0];
  }
}

function relativeBearing(p1, p2) {
  let angle = Math.atan2(p2.lon - p1.lon, p2.lat - p1.lat);
  if (angle < 0) {
    angle += 2 * Math.PI;
  }

  // Return degrees
  return angle * 180 / Math.PI;
}

// Assuming range [0,360)
function cardinalDirection(bearing) {
  const dir = 45 * Math.round(bearing / 45);
  const compass = {
    0: 'north',
    45: 'northeast',
    90: 'east',
    135: 'southeast',
    180: 'south',
    225: 'southwest',
    270: 'west',
    315: 'northwest',
    360: 'north'
  };

  return t(`QA.improveOSM.directions.${compass[dir]}`);
}

// Errors shouldn't obscure each other
function preventCoincident(loc, bumpUp) {
  let coincident = false;
  do {
    // first time, move marker up. after that, move marker right.
    let delta = coincident ? [0.00001, 0] : (bumpUp ? [0, 0.00001] : [0, 0]);
    loc = geoVecAdd(loc, delta);
    let bbox = geoExtent(loc).bbox();
    coincident = _cache.rtree.search(bbox).length;
  } while (coincident);

  return loc;
}

export default {
  title: 'improveOSM',

  init() {
    fileFetcher.get('qa_data')
      .then(d => _impOsmData = d.improveOSM);

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

  loadIssues(projection) {
    const options = {
      client: 'iD',
      status: 'OPEN',
      zoom: '19' // Use a high zoom so that clusters aren't returned
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

      const [ east, north, west, south ] = tile.extent.rectangle();
      const params = Object.assign({}, options, { east, south, west, north });

      // 3 separate requests to store for each tile
      const requests = {};

      Object.keys(_impOsmUrls).forEach(k => {
        // We exclude WATER from missing geometry as it doesn't seem useful
        // We use most confident one-way and turn restrictions only, still have false positives
        const kParams = Object.assign({},
          params,
          (k === 'mr') ? { type: 'PARKING,ROAD,BOTH,PATH' } : { confidenceLevel: 'C1' }
        );
        const url = `${_impOsmUrls[k]}/search?` + utilQsString(kParams);
        const controller = new AbortController();

        requests[k] = controller;

        d3_json(url, { signal: controller.signal })
          .then(data => {
            delete _cache.inflightTile[tile.id][k];
            if (!Object.keys(_cache.inflightTile[tile.id]).length) {
              delete _cache.inflightTile[tile.id];
              _cache.loadedTile[tile.id] = true;
            }

            // Road segments at high zoom == oneways
            if (data.roadSegments) {
              data.roadSegments.forEach(feature => {
                // Position error at the approximate middle of the segment
                const { points, wayId, fromNodeId, toNodeId } = feature;
                const itemId = `${wayId}${fromNodeId}${toNodeId}`;
                let mid = points.length / 2;
                let loc;

                // Even number of points, find midpoint of the middle two
                // Odd number of points, use position of very middle point
                if (mid % 1 === 0) {
                  loc = pointAverage([points[mid - 1], points[mid]]);
                } else {
                  mid = points[Math.floor(mid)];
                  loc = [mid.lon, mid.lat];
                }

                // One-ways can land on same segment in opposite direction
                loc = preventCoincident(loc, false);

                let d = new QAItem(loc, this, k, itemId, {
                  issueKey: k, // used as a category
                  identifier: { // used to post changes
                    wayId,
                    fromNodeId,
                    toNodeId
                  },
                  objectId: wayId,
                  objectType: 'way'
                });

                // Variables used in the description
                d.replacements = {
                  percentage: feature.percentOfTrips,
                  num_trips: feature.numberOfTrips,
                  highway: linkErrorObject(t('QA.keepRight.error_parts.highway')),
                  from_node: linkEntity('n' + feature.fromNodeId),
                  to_node: linkEntity('n' + feature.toNodeId)
                };

                _cache.data[d.id] = d;
                _cache.rtree.insert(encodeIssueRtree(d));
              });
            }

            // Tiles at high zoom == missing roads
            if (data.tiles) {
              data.tiles.forEach(feature => {
                const { type, x, y, numberOfTrips } = feature;
                const geoType = type.toLowerCase();
                const itemId = `${geoType}${x}${y}${numberOfTrips}`;

                // Average of recorded points should land on the missing geometry
                // Missing geometry could happen to land on another error
                let loc = pointAverage(feature.points);
                loc = preventCoincident(loc, false);

                let d = new QAItem(loc, this, `${k}-${geoType}`, itemId, {
                  issueKey: k,
                  identifier: { x, y }
                });

                d.replacements = {
                  num_trips: numberOfTrips,
                  geometry_type: t(`QA.improveOSM.geometry_types.${geoType}`)
                };

                // -1 trips indicates data came from a 3rd party
                if (numberOfTrips === -1) {
                  d.desc = t('QA.improveOSM.error_types.mr.description_alt', d.replacements);
                }

                _cache.data[d.id] = d;
                _cache.rtree.insert(encodeIssueRtree(d));
              });
            }

            // Entities at high zoom == turn restrictions
            if (data.entities) {
              data.entities.forEach(feature => {
                const { point, id, segments, numberOfPasses, turnType } = feature;
                const itemId = `${id.replace(/[,:+#]/g, '_')}`;

                // Turn restrictions could be missing at same junction
                // We also want to bump the error up so node is accessible
                const loc = preventCoincident([point.lon, point.lat], true);

                // Elements are presented in a strange way
                const ids = id.split(',');
                const from_way = ids[0];
                const via_node = ids[3];
                const to_way = ids[2].split(':')[1];

                let d = new QAItem(loc, this, k, itemId, {
                  issueKey: k,
                  identifier: id,
                  objectId: via_node,
                  objectType: 'node'
                });

                // Travel direction along from_way clarifies the turn restriction
                const [ p1, p2 ] = segments[0].points;
                const dir_of_travel = cardinalDirection(relativeBearing(p1, p2));

                // Variables used in the description
                d.replacements = {
                  num_passed: numberOfPasses,
                  num_trips: segments[0].numberOfTrips,
                  turn_restriction: turnType.toLowerCase(),
                  from_way: linkEntity('w' + from_way),
                  to_way: linkEntity('w' + to_way),
                  travel_direction: dir_of_travel,
                  junction: linkErrorObject(t('QA.keepRight.error_parts.this_node'))
                };

                _cache.data[d.id] = d;
                _cache.rtree.insert(encodeIssueRtree(d));
                dispatch.call('loaded');
              });
            }
          })
          .catch(() => {
            delete _cache.inflightTile[tile.id][k];
            if (!Object.keys(_cache.inflightTile[tile.id]).length) {
              delete _cache.inflightTile[tile.id];
              _cache.loadedTile[tile.id] = true;
            }
          });
      });

      _cache.inflightTile[tile.id] = requests;
    });
  },

  getComments(item) {
    // If comments already retrieved no need to do so again
    if (item.comments) {
      return Promise.resolve(item);
    }

    const key = item.issueKey;
    let qParams = {};

    if (key === 'ow') {
      qParams = item.identifier;
    } else if (key === 'mr') {
      qParams.tileX = item.identifier.x;
      qParams.tileY = item.identifier.y;
    } else if (key === 'tr') {
      qParams.targetId = item.identifier;
    }

    const url = `${_impOsmUrls[key]}/retrieveComments?` + utilQsString(qParams);
    const cacheComments = data => {
      // Assign directly for immediate use afterwards
      // comments are served newest to oldest
      item.comments = data.comments ? data.comments.reverse() : [];
      this.replaceItem(item);
    };

    return d3_json(url).then(cacheComments).then(() => item);
  },

  postUpdate(d, callback) {
    if (!serviceOsm.authenticated()) { // Username required in payload
      return callback({ message: 'Not Authenticated', status: -3}, d);
    }
    if (_cache.inflightPost[d.id]) {
      return callback({ message: 'Error update already inflight', status: -2 }, d);
    }

    // Payload can only be sent once username is established
    serviceOsm.userDetails(sendPayload.bind(this));

    function sendPayload(err, user) {
      if (err) { return callback(err, d); }

      const key = d.issueKey;
      const url = `${_impOsmUrls[key]}/comment`;
      const payload = {
        username: user.display_name,
        targetIds: [ d.identifier ]
      };

      if (d.newStatus) {
        payload.status = d.newStatus;
        payload.text = 'status changed';
      }

      // Comment take place of default text
      if (d.newComment) {
        payload.text = d.newComment;
      }

      const controller = new AbortController();
      _cache.inflightPost[d.id] = controller;

      const options = {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify(payload)
      };

      d3_json(url, options)
        .then(() => {
          delete _cache.inflightPost[d.id];

          // Just a comment, update error in cache
          if (!d.newStatus) {
            const now = new Date();
            let comments = d.comments ? d.comments : [];

            comments.push({
              username: payload.username,
              text: payload.text,
              timestamp: now.getTime() / 1000
            });

            this.replaceItem(d.update({
              comments: comments,
              newComment: undefined
            }));
          } else {
            this.removeItem(d);
            if (d.newStatus === 'SOLVED') {
              // Keep track of the number of issues closed per type to tag the changeset
              if (!(d.issueKey in _cache.closed)) {
                _cache.closed[d.issueKey] = 0;
              }
              _cache.closed[d.issueKey] += 1;
            }
          }
          if (callback) callback(null, d);
        })
        .catch(err => {
          delete _cache.inflightPost[d.id];
          if (callback) callback(err.message);
        });
    }
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

  // get the name of the icon to display for this item
  getIcon(itemType) {
    return _impOsmData.icons[itemType];
  },

  // Replace a single QAItem in the cache
  replaceItem(issue) {
    if (!(issue instanceof QAItem) || !issue.id) return;

    _cache.data[issue.id] = issue;
    updateRtree(encodeIssueRtree(issue), true); // true = replace
    return issue;
  },

  // Remove a single QAItem from the cache
  removeItem(issue) {
    if (!(issue instanceof QAItem) || !issue.id) return;

    delete _cache.data[issue.id];
    updateRtree(encodeIssueRtree(issue), false); // false = remove
  },

  // Used to populate `closed:improveosm:*` changeset tags
  getClosedCounts() {
    return _cache.closed;
  }
};
