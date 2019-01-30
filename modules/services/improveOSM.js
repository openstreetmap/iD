import _extend from 'lodash-es/extend';
import _find from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';

import rbush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-request';
import { request as d3_request } from 'd3-request';

import { geoExtent, geoVecAdd } from '../geo';
import { iOsmError } from '../osm';
import { services } from './index';
import { t } from '../util/locale';
import { utilRebind, utilTiler, utilQsString } from '../util';


var tiler = utilTiler();
var dispatch = d3_dispatch('loaded');

var _erCache;
var _erZoom = 14;

var _impOsmUrls = {
    ow: 'http://directionofflow.skobbler.net/directionOfFlowService',
    mr: 'http://missingroads.skobbler.net/missingGeoService',
    tr: 'http://turnrestrictionservice.skobbler.net/turnRestrictionService'
};

function abortRequest(i) {
    _forEach(i, function(v) {
        if (v) {
            v.abort();
        }
    });
}

function abortUnwantedRequests(cache, tiles) {
    _forEach(cache.inflightTile, function(v, k) {
        var wanted = _find(tiles, function(tile) {
            return k === tile.id;
        });
        if (!wanted) {
            abortRequest(v);
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
    return '<a class="kr_error_object_link">' + d + '</a>';
}

function linkEntity(d) {
    return '<a class="kr_error_entity_link">' + d + '</a>';
}

function pointAverage(points) {
    var x = 0;
    var y = 0;

    _forEach(points, function(v) {
        x += v.lon;
        y += v.lat;
    });

    x /= points.length;
    y /= points.length;

    return [x, y];
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

export default {
    init: function() {
        if (!_erCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
        if (_erCache) {
            _forEach(_erCache.inflightTile, abortRequest);
        }
        _erCache = {
            data: {},
            loadedTile: {},
            inflightTile: {},
            inflightPost: {},
            closed: {},
            rtree: rbush()
        };
    },

    loadErrors: function(projection) {
        var options = {
            client: 'iD',
            confidenceLevel: 'C1', // most confident only, still have false positives
            status: 'OPEN',
            type: 'PARKING,ROAD,BOTH,PATH', // exclude WATER as it doesn't seem useful
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
            var params = _extend({}, options, { east: rect[0], south: rect[3], west: rect[2], north: rect[1] });

            // 3 separate requests to store for each tile
            var requests = {};

            _forEach(_impOsmUrls, function(v, k) {
                var url = v + '/search?' + utilQsString(params);

                requests[k] = d3_json(url,
                    function(err, data) {
                        delete _erCache.inflightTile[tile.id];

                        if (err) return;
                        _erCache.loadedTile[tile.id] = true;

                        // Road segments at high zoom == oneways
                        if (data.roadSegments) {
                            data.roadSegments.forEach(function(feature) {
                                // Position error at the approximate middle of the segment
                                var points = feature.points;
                                var mid = points.length / 2;
                                var loc;

                                // Even number of points, find midpoint of the middle two
                                // Odd number of points, use position of very middle point
                                if (mid % 1 == 0) {
                                    loc = pointAverage([points[mid - 1], points[mid]]);
                                } else {
                                    mid = points[Math.floor(mid)];
                                    loc = [mid.lon, mid.lat];
                                }

                                var d = new iOsmError({
                                    loc: loc,
                                    comments: null,
                                    error_subtype: '',
                                    error_type: k,
                                    icon: 'fas-arrow-circle-up', //TODO: Change arrow based on direction?
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
                                var geoIcons = {
                                    road: 'maki-car',
                                    parking: 'maki-parking',
                                    both: 'maki-car',
                                    path: 'maki-shoe'
                                };

                                var d = new iOsmError({
                                    loc: pointAverage(feature.points),
                                    comments: null,
                                    error_subtype: geoType,
                                    error_type: k,
                                    icon: geoIcons[geoType],
                                    identifier: { x: feature.x, y: feature.y },
                                    status: feature.status
                                });

                                d.replacements = {
                                    num_trips: feature.numberOfTrips,
                                    geometry_type: t('QA.improveOSM.geometry_types.' + geoType)
                                };

                                _erCache.data[d.id] = d;
                                _erCache.rtree.insert(encodeErrorRtree(d));
                            });
                        }

                        // Entities at high zoom == turn restrictions
                        if (data.entities) {
                            data.entities.forEach(function(feature) {
                                var loc = feature.point;

                                // Bump position slightly so junction node is accessible
                                loc = geoVecAdd([loc.lon, loc.lat], [0, 0.00001]);

                                // Elements are presented in a strange way
                                var ids = feature.id.split(',');
                                var from_way = ids[0];
                                var via_node = ids[3];
                                var to_way = ids[2].split(':')[1];

                                // Travel direction along from_way clarifies the turn restriction
                                var p1 = feature.segments[0].points[0];
                                var p2 = feature.segments[0].points[1];

                                var dir_of_travel = cardinalDirection(relativeBearing(p1, p2));

                                var d = new iOsmError({
                                    loc: loc,
                                    comments: null,
                                    error_subtype: '',
                                    error_type: k,
                                    icon: 'temaki-junction',
                                    identifier: feature.id,
                                    object_id: via_node,
                                    object_type: 'node',
                                    status: feature.status
                                });

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
                            });
                        }
                    }
                );
            });

            _erCache.inflightTile[tile.id] = requests;
            dispatch.call('loaded');
        });
    },

    postUpdate: function(d, callback) {
        if (!services.osm.authenticated()) { // Username required in payload
            return callback({ message: 'Not Authenticated', status: -3}, d);
        }
        if (_erCache.inflightPost[d.id]) {
            return callback({ message: 'Error update already inflight', status: -2 }, d);
        }

        var osmUsername = services.osm.userDetails(function(err, user) {
            if (err) return '';

            return user.display_name;
        });

        var that = this;
        var type = d.error_type;
        var payload = {
            username: osmUsername
        };

        // Each error type has different data for identification
        if (type === 'ow') {
            payload.roadSegments = [ d.identifier ];
        } else if (type === 'mr') {
            payload.tiles = [ d.identifier ];
        } else if (type === 'tr') {
            payload.targetIds = [ d.identifier ];
        }

        // Separate requests required to comment and change status
        var url = _impOsmUrls[type] + '/comment';

        // Comments don't currently work
        // if (d.newComment !== undefined) {
        //     payload.text = d.newComment;
        // }

        if (d.newStatus !== d.status) {
            payload.status = d.newStatus;
            payload.text = 'status changed';

            _erCache.inflightPost[d.id] = d3_request(url)
                .header('Content-Type', 'application/json')
                .post(JSON.stringify(payload), function(err) {
                    delete _erCache.inflightPost[d.id];

                    if (d.newStatus === 'INVALID') {
                        that.removeError(d);
                    } else if (d.newStatus === 'SOLVED') {
                        that.removeError(d);

                        //TODO the identifiers are ugly and can't be used frontend, use error position instead?
                        // or perhaps don't track this at all?
                        //_erCache.closed[d.error_type + ':' + d.identifier] = true;
                    }

                    return callback(err, d);
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
        if (!(error instanceof iOsmError) || !error.id) return;

        _erCache.data[error.id] = error;
        updateRtree(encodeErrorRtree(error), true); // true = replace
        return error;
    },

    // remove a single error from the cache
    removeError: function(error) {
        if (!(error instanceof iOsmError) || !error.id) return;

        delete _erCache.data[error.id];
        updateRtree(encodeErrorRtree(error), false); // false = remove
    }
};
