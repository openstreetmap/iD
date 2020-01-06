import RBush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import { geoExtent, geoVecAdd, geoVecScale } from '../geo';
import { qaError } from '../osm';
import { serviceOsm } from './index';
import { t } from '../util/locale';
import { utilRebind, utilTiler, utilQsString } from '../util';


var tiler = utilTiler();
var dispatch = d3_dispatch('loaded');

var _erCache;
var _erZoom = 14;

var _impOsmUrls = {
    ow: 'https://grab.community.improve-osm.org/directionOfFlowService',
    mr: 'https://grab.community.improve-osm.org/missingGeoService',
    tr: 'https://grab.community.improve-osm.org/turnRestrictionService'
};

function abortRequest(i) {
    Object.values(i).forEach(function(controller) {
        if (controller) {
            controller.abort();
        }
    });
}

function abortUnwantedRequests(cache, tiles) {
    Object.keys(cache.inflightTile).forEach(function(k) {
        var wanted = tiles.find(function(tile) { return k === tile.id; });
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
    _erCache.rtree.remove(item, function isEql(a, b) {
        return a.data.id === b.data.id;
    });

    if (replace) {
        _erCache.rtree.insert(item);
    }
}

function linkErrorObject(d) {
    return '<a class="error_object_link">' + d + '</a>';
}

function linkEntity(d) {
    return '<a class="error_entity_link">' + d + '</a>';
}

function pointAverage(points) {
    if (points.length) {
        var sum = points.reduce(function(acc, point) {
            return geoVecAdd(acc, [point.lon, point.lat]);
        }, [0,0]);
        return geoVecScale(sum, 1 / points.length);
    } else {
        return [0,0];
    }
}

function relativeBearing(p1, p2) {
    var angle = Math.atan2(p2.lon - p1.lon, p2.lat - p1.lat);
    if (angle < 0) {
        angle += 2 * Math.PI;
    }

    // Return degrees
    return angle * 180 / Math.PI;
}

// Assuming range [0,360)
function cardinalDirection(bearing) {
    var dir = 45 * Math.round(bearing / 45);
    var compass = {
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

    return t('QA.improveOSM.directions.' + compass[dir]);
}

// Errors shouldn't obscure eachother
function preventCoincident(loc, bumpUp) {
    var coincident = false;
    do {
        // first time, move marker up. after that, move marker right.
        var delta = coincident ? [0.00001, 0] : (bumpUp ? [0, 0.00001] : [0, 0]);
        loc = geoVecAdd(loc, delta);
        var bbox = geoExtent(loc).bbox();
        coincident = _erCache.rtree.search(bbox).length;
    } while (coincident);

    return loc;
}

export default {
    init: function() {
        if (!_erCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
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

    loadErrors: function(projection) {
        var options = {
            client: 'iD',
            status: 'OPEN',
            zoom: '19' // Use a high zoom so that clusters aren't returned
        };

        // determine the needed tiles to cover the view
        var tiles = tiler
            .zoomExtent([_erZoom, _erZoom])
            .getTiles(projection);

        // abort inflight requests that are no longer needed
        abortUnwantedRequests(_erCache, tiles);

        // issue new requests..
        tiles.forEach(function(tile) {
            if (_erCache.loadedTile[tile.id] || _erCache.inflightTile[tile.id]) return;

            var rect = tile.extent.rectangle();
            var params = Object.assign({}, options, { east: rect[0], south: rect[3], west: rect[2], north: rect[1] });

            // 3 separate requests to store for each tile
            var requests = {};

            Object.keys(_impOsmUrls).forEach(function(k) {
                var v = _impOsmUrls[k];
                // We exclude WATER from missing geometry as it doesn't seem useful
                // We use most confident one-way and turn restrictions only, still have false positives
                var kParams = Object.assign({},
                    params,
                    (k === 'mr') ? { type: 'PARKING,ROAD,BOTH,PATH' } : { confidenceLevel: 'C1' }
                );
                var url = v + '/search?' + utilQsString(kParams);

                var controller = new AbortController();
                requests[k] = controller;

                d3_json(url, { signal: controller.signal })
                    .then(function(data) {
                        delete _erCache.inflightTile[tile.id][k];
                        if (!Object.keys(_erCache.inflightTile[tile.id]).length) {
                            delete _erCache.inflightTile[tile.id];
                            _erCache.loadedTile[tile.id] = true;
                        }

                        // Road segments at high zoom == oneways
                        if (data.roadSegments) {
                            data.roadSegments.forEach(function(feature) {
                                // Position error at the approximate middle of the segment
                                var points = feature.points;
                                var mid = points.length / 2;
                                var loc;

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

                                var d = new qaError({
                                    // Info required for every error
                                    loc: loc,
                                    service: 'improveOSM',
                                    error_type: k,
                                    // Extra details needed for this service
                                    error_key: k,
                                    identifier: { // this is used to post changes to the error
                                        wayId: feature.wayId,
                                        fromNodeId: feature.fromNodeId,
                                        toNodeId: feature.toNodeId
                                    },
                                    object_id: feature.wayId,
                                    object_type: 'way',
                                    status: feature.status
                                });

                                // Variables used in the description
                                d.replacements = {
                                    percentage: feature.percentOfTrips,
                                    num_trips: feature.numberOfTrips,
                                    highway: linkErrorObject(t('QA.keepRight.error_parts.highway')),
                                    from_node: linkEntity('n' + feature.fromNodeId),
                                    to_node: linkEntity('n' + feature.toNodeId)
                                };

                                _erCache.data[d.id] = d;
                                _erCache.rtree.insert(encodeErrorRtree(d));
                            });
                        }

                        // Tiles at high zoom == missing roads
                        if (data.tiles) {
                            data.tiles.forEach(function(feature) {
                                var geoType = feature.type.toLowerCase();

                                // Average of recorded points should land on the missing geometry
                                // Missing geometry could happen to land on another error
                                var loc = pointAverage(feature.points);
                                loc = preventCoincident(loc, false);

                                var d = new qaError({
                                    // Info required for every error
                                    loc: loc,
                                    service: 'improveOSM',
                                    error_type: k + '-' + geoType,
                                    // Extra details needed for this service
                                    error_key: k,
                                    identifier: { x: feature.x, y: feature.y },
                                    status: feature.status
                                });

                                d.replacements = {
                                    num_trips: feature.numberOfTrips,
                                    geometry_type: t('QA.improveOSM.geometry_types.' + geoType)
                                };

                                // -1 trips indicates data came from a 3rd party
                                if (feature.numberOfTrips === -1) {
                                    d.desc = t('QA.improveOSM.error_types.mr.description_alt', d.replacements);
                                }

                                _erCache.data[d.id] = d;
                                _erCache.rtree.insert(encodeErrorRtree(d));
                            });
                        }

                        // Entities at high zoom == turn restrictions
                        if (data.entities) {
                            data.entities.forEach(function(feature) {
                                // Turn restrictions could be missing at same junction
                                // We also want to bump the error up so node is accessible
                                var loc = feature.point;
                                loc = preventCoincident([loc.lon, loc.lat], true);

                                // Elements are presented in a strange way
                                var ids = feature.id.split(',');
                                var from_way = ids[0];
                                var via_node = ids[3];
                                var to_way = ids[2].split(':')[1];

                                var d = new qaError({
                                    // Info required for every error
                                    loc: loc,
                                    service: 'improveOSM',
                                    error_type: k,
                                    // Extra details needed for this service
                                    error_key: k,
                                    identifier: feature.id,
                                    object_id: via_node,
                                    object_type: 'node',
                                    status: feature.status
                                });

                                // Travel direction along from_way clarifies the turn restriction
                                var p1 = feature.segments[0].points[0];
                                var p2 = feature.segments[0].points[1];

                                var dir_of_travel = cardinalDirection(relativeBearing(p1, p2));

                                // Variables used in the description
                                d.replacements = {
                                    num_passed: feature.numberOfPasses,
                                    num_trips: feature.segments[0].numberOfTrips,
                                    turn_restriction: feature.turnType.toLowerCase(),
                                    from_way: linkEntity('w' + from_way),
                                    to_way: linkEntity('w' + to_way),
                                    travel_direction: dir_of_travel,
                                    junction: linkErrorObject(t('QA.keepRight.error_parts.this_node'))
                                };

                                _erCache.data[d.id] = d;
                                _erCache.rtree.insert(encodeErrorRtree(d));
                                dispatch.call('loaded');
                            });
                        }
                    })
                    .catch(function() {
                        delete _erCache.inflightTile[tile.id][k];
                        if (!Object.keys(_erCache.inflightTile[tile.id]).length) {
                            delete _erCache.inflightTile[tile.id];
                            _erCache.loadedTile[tile.id] = true;
                        }
                    });
            });

            _erCache.inflightTile[tile.id] = requests;
        });
    },

    getComments: function(d, callback) {
        // If comments already retrieved no need to do so again
        if (d.comments !== undefined) {
            if (callback) callback({}, d);
            return;
        }

        var key = d.error_key;
        var qParams = {};

        if (key === 'ow') {
            qParams = d.identifier;
        } else if (key === 'mr') {
            qParams.tileX = d.identifier.x;
            qParams.tileY = d.identifier.y;
        } else if (key === 'tr') {
            qParams.targetId = d.identifier;
        }

        var url = _impOsmUrls[key] + '/retrieveComments?' + utilQsString(qParams);

        var that = this;
        d3_json(url)
            .then(function(data) {
                // Assign directly for immediate use in the callback
                // comments are served newest to oldest
                d.comments = data.comments ? data.comments.reverse() : [];
                that.replaceError(d);
                if (callback) callback(null, d);
            })
            .catch(function(err) {
                if (callback) callback(err.message);
            });
    },

    postUpdate: function(d, callback) {
        if (!serviceOsm.authenticated()) { // Username required in payload
            return callback({ message: 'Not Authenticated', status: -3}, d);
        }
        if (_erCache.inflightPost[d.id]) {
            return callback({ message: 'Error update already inflight', status: -2 }, d);
        }

        var that = this;

        // Payload can only be sent once username is established
        serviceOsm.userDetails(sendPayload);

        function sendPayload(err, user) {
            if (err) { return callback(err, d); }

            var key = d.error_key;
            var url = _impOsmUrls[key] + '/comment';
            var payload = {
                username: user.display_name,
                targetIds: [ d.identifier ]
            };

            if (d.newStatus !== undefined) {
                payload.status = d.newStatus;
                payload.text = 'status changed';
            }

            // Comment take place of default text
            if (d.newComment !== undefined) {
                payload.text = d.newComment;
            }

            var controller = new AbortController();
            _erCache.inflightPost[d.id] = controller;

            var options = {
                method: 'POST',
                signal: controller.signal,
                body: JSON.stringify(payload)
            };

             d3_json(url, options)
                .then(function() {
                    delete _erCache.inflightPost[d.id];

                    // Just a comment, update error in cache
                    if (d.newStatus === undefined) {
                        var now = new Date();
                        var comments = d.comments ? d.comments : [];

                        comments.push({
                            username: payload.username,
                            text: payload.text,
                            timestamp: now.getTime() / 1000
                        });

                        that.replaceError(d.update({
                            comments: comments,
                            newComment: undefined
                        }));
                    } else {
                        that.removeError(d);
                        if (d.newStatus === 'SOLVED') {
                            // No pretty identifier, so we just use coordinates
                            var closedID = d.loc[1].toFixed(5) + '/' + d.loc[0].toFixed(5);
                            _erCache.closed[key + ':' + closedID] = true;
                        }
                    }
                    if (callback) callback(null, d);
                })
                .catch(function(err) {
                    delete _erCache.inflightPost[d.id];
                    if (callback) callback(err.message);
                });
        }
    },


    // get all cached errors covering the viewport
    getErrors: function(projection) {
        var viewport = projection.clipExtent();
        var min = [viewport[0][0], viewport[1][1]];
        var max = [viewport[1][0], viewport[0][1]];
        var bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();

        return _erCache.rtree.search(bbox).map(function(d) {
            return d.data;
        });
    },

    // get a single error from the cache
    getError: function(id) {
        return _erCache.data[id];
    },

    // replace a single error in the cache
    replaceError: function(error) {
        if (!(error instanceof qaError) || !error.id) return;

        _erCache.data[error.id] = error;
        updateRtree(encodeErrorRtree(error), true); // true = replace
        return error;
    },

    // remove a single error from the cache
    removeError: function(error) {
        if (!(error instanceof qaError) || !error.id) return;

        delete _erCache.data[error.id];
        updateRtree(encodeErrorRtree(error), false); // false = remove
    },

    // Used to populate `closed:improveosm` changeset tag
    getClosedIDs: function() {
        return Object.keys(_erCache.closed).sort();
    }
};
