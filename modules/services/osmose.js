import RBush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import { geoExtent, geoVecAdd, geoVecScale } from '../geo';
import { qaError } from '../osm';
import { t } from '../util/locale';
import { utilRebind, utilTiler, utilQsString } from '../util';
import { services } from '../../data/qa_errors.json';

var tiler = utilTiler();
var dispatch = d3_dispatch('loaded');

var _erCache;
var _erZoom = 14;

var _osmoseUrlRoot = 'https://osmose.openstreetmap.fr/en/api/0.3beta/';

function abortRequest(controller) {
    if (controller) {
        controller.abort();
    }
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
            full: 'true', // Returns element IDs
            level: '1,2,3',
            zoom: '19'
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

            var rect = tile.extent.rectangle(); // E, N, W, S
            var params = Object.assign({}, options, { bbox: [rect[0], rect[1], rect[2], rect[3]].join() });

            var url = _osmoseUrlRoot + 'issues?' + utilQsString(params);

            var controller = new AbortController();
            _erCache.inflightTile[tile.id] = controller;

            d3_json(url, { signal: controller.signal })
                .then(function(data) {
                    delete _erCache.inflightTile[tile.id];
                    _erCache.loadedTile[tile.id] = true;

                    if (data.issues) {
                        data.issues.forEach(function(issue) {
                            // Elements provided as string, separated by _ character
                            var elems = issue.elems.split('_').map(function(i) {
                                    return i.substring(0,1) + i.replace(/node|way|relation/, '')
                                });
                            var loc = [issue.lon, issue.lat];
                            // Item is the type of error, w/ class tells us the sub-type
                            var type = [issue.item, issue.classs].join('-');

                            // Filter out unsupported error types (some are too specific or advanced)
                            if (services.osmose.errorTypes[type]) {
                                loc = preventCoincident(loc, true);

                                var d = new qaError({
                                    // Info required for every error
                                    loc: loc,
                                    service: 'osmose',
                                    error_type: type,
                                    // Extra details needed for this service
                                    identifier: issue.id, // this is used to post changes to the error
                                    elems: elems,
                                    object_id: elems.length ? elems[0].substring(1) : '',
                                    object_type: elems.length ? elems[0].substring(0,1) : ''
                                });

                                // Variables used in the description
                                d.replacements = elems.map(function(i) {
                                    return linkEntity(i)
                                });

                                _erCache.data[d.id] = d;
                                _erCache.rtree.insert(encodeErrorRtree(d));
                            }
                        });
                    }
                })
                .catch(function() {
                    delete _erCache.inflightTile[tile.id];
                    _erCache.loadedTile[tile.id] = true;
                });
        });
    },

    postUpdate: function(d, callback) {
        if (_erCache.inflightPost[d.id]) {
            return callback({ message: 'Error update already inflight', status: -2 }, d);
        }

        var that = this;

        // UI sets the status to either '/done' or '/false'
        var url = _osmoseUrlRoot + 'issue/' + d.identifier + d.newStatus;

        var controller = new AbortController();
        _erCache.inflightPost[d.id] = controller;

        fetch(url, { signal: controller.signal })
            .then(function() {
                delete _erCache.inflightPost[d.id];

                that.removeError(d);
                if (d.newStatus === '/done') {
                    // No pretty identifier, so we just use coordinates
                    var closedID = d.loc[1].toFixed(5) + '/' + d.loc[0].toFixed(5);
                    _erCache.closed[key + ':' + closedID] = true;
                }
                if (callback) callback(null, d);
            })
            .catch(function(err) {
                delete _erCache.inflightPost[d.id];
                if (callback) callback(err.message);
            });
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

    // Used to populate `closed:osmose` changeset tag
    getClosedIDs: function() {
        return Object.keys(_erCache.closed).sort();
    }
};