import RBush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import { dataEn } from '../../data';
import { geoExtent, geoVecAdd } from '../geo';
import { qaError } from '../osm';
import { utilRebind, utilTiler, utilQsString } from '../util';
import { services } from '../../data/qa_errors.json';

var tiler = utilTiler();
var dispatch = d3_dispatch('loaded');

var _erCache;
var _erZoom = 14;

var _osmoseUrlRoot = 'https://osmose.openstreetmap.fr/';

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
        var params = {
            item: services.osmose.items.join() // only interested in certain errors
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

            var lang = 'en'; // todo: may want to use provided translations
            var path = [tile.xyz[2], tile.xyz[0], tile.xyz[1]].join('/');
            var url = _osmoseUrlRoot + lang + '/map/issues/' + path + '.json?' + utilQsString(params);

            var controller = new AbortController();
            _erCache.inflightTile[tile.id] = controller;

            d3_json(url, { signal: controller.signal })
                .then(function(data) {
                    delete _erCache.inflightTile[tile.id];
                    _erCache.loadedTile[tile.id] = true;

                    if (data.features) {
                        data.features.forEach(function(issue) {
                            var loc = issue.geometry.coordinates; // lon, lat
                            var props = issue.properties;
                            // Item is the type of error, w/ class tells us the sub-type
                            var type = [props.item, props.class].join('-');

                            // Filter out unsupported error types (some are too specific or advanced)
                            if (type in services.osmose.errorTypes) {
                                loc = preventCoincident(loc, true);

                                var d = new qaError({
                                    // Info required for every error
                                    loc: loc,
                                    service: 'osmose',
                                    error_type: type,
                                    // Extra details needed for this service
                                    identifier: props.issue_id, // needed to query and update the error
                                    item: props.item, // category of the issue for styling
                                    class: props.class
                                });

                                // Special handling for some error types
                                // Setting elems here prevents UI error detail requests
                                switch (d.item) {
                                    case 8300:
                                    case 8360:
                                        mapillaryError(d);
                                        break;
                                }

                                _erCache.data[d.id] = d;
                                _erCache.rtree.insert(encodeErrorRtree(d));
                            }
                        });
                    }

                    dispatch.call('loaded');
                })
                .catch(function() {
                    delete _erCache.inflightTile[tile.id];
                    _erCache.loadedTile[tile.id] = true;
                });
        });

        function mapillaryError(d) {
            // Parts only exists for these error types
            var parts = dataEn.QA.osmose.error_types[d.item].parts;
            d.replacements = [parts[d.class]];
            d.elems = [];
        }
    },

    loadErrorDetail: function(d, callback) {
        // Error details only need to be fetched once
        if (d.elems !== undefined) {
            if (callback) callback(null, d);
            return;
        }

        var url = _osmoseUrlRoot + 'en/api/0.3beta/issue/' + d.identifier;

        var that = this;
        d3_json(url)
            .then(function(data) {
                // Associated elements used for highlighting
                // Assign directly for immediate use in the callback
                d.elems = data.elems.map(function(e) {
                    return e.type.substring(0,1) + e.id;
                });

                // Element links used in the error description
                d.replacements = d.elems.map(function(i) {
                    return linkEntity(i);
                });

                // Special handling for some error types
                switch (d.item) {
                    case 3040:
                        d.replacements.push(/Bad value for (.+)/i
                            .exec(data.subtitle)[1]
                        );
                        break;
                }

                that.replaceError(d);
                if (callback) callback(null, d);
            })
            .catch(function(err) {
                if (callback) callback(err.message);
            });
    },

    postUpdate: function(d, callback) {
        if (_erCache.inflightPost[d.id]) {
            return callback({ message: 'Error update already inflight', status: -2 }, d);
        }

        var that = this;

        // UI sets the status to either '/done' or '/false'
        var url = _osmoseUrlRoot + 'en/api/0.3beta/issue/' + d.identifier + d.newStatus;

        var controller = new AbortController();
        _erCache.inflightPost[d.id] = controller;

        fetch(url, { signal: controller.signal })
            .then(function() {
                delete _erCache.inflightPost[d.id];

                that.removeError(d);
                if (d.newStatus === '/done') {
                    // No error identifier, so we give a count of each category
                    if (!(d.item in _erCache.closed)) {
                        _erCache.closed[d.item] = 0;
                    }
                    _erCache.closed[d.item] += 1;
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

    // Used to populate `closed:osmose:*` changeset tags
    getClosedCounts: function() {
        return _erCache.closed;
    }
};