import _extend from 'lodash-es/extend';
import _find from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';

import rbush from 'rbush';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-request';
import { request as d3_request } from 'd3-request';

import { geoExtent } from '../geo';
import { impOsmError } from '../osm';
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

var _missingTypes = {
    PARKING: 'Unmapped parking',
    ROAD: 'Unmapped road(s)',
    BOTH: 'Unmapped road(s) and parking',
    PATH: 'Unmapped path(s)',
    WATER: 'Unmapped water feature' // ?
};

function abortRequest(i) {
    _forEach(i, function(v) {
        if (v) {
            v.abort();
        }
    });
}

function abortUnwantedRequests(cache, tiles) {
    _forEach(cache.inflight, function(v, k) {
        var wanted = _find(tiles, function(tile) {
            return k === tile.id;
        });
        if (!wanted) {
            abortRequest(v);
            delete cache.inflight[k];
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

export default {
    init: function() {
        if (!_erCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
        if (_erCache) {
            _forEach(_erCache.inflight, abortRequest);
        }
        _erCache = {
            data: {},
            loaded: {},
            inflight: {},
            closed: {},
            rtree: rbush()
        };
    },

    loadErrors: function(projection) {
        var options = {
            client: 'iD',
            confidenceLevel: 'C1', // most confident cases only for now
            status: 'OPEN',
            type: 'PARKING,ROAD,BOTH,PATH', // exclude WATER
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
            if (_erCache.loaded[tile.id] || _erCache.inflight[tile.id]) return;

            var rect = tile.extent.rectangle();
            var params = _extend({}, options, { east: rect[0], south: rect[3], west: rect[2], north: rect[1] });

            // 3 separate requests to store for each tile
            var requests = {};

            // TODO: Just implement TRs and One-ways for now, much more simple
            _forEach(_impOsmUrls, function(v, k) {
                var url = v + '/search?' + utilQsString(params);

                if (k == 'mr') return

                requests[k] = d3_json(url,
                    function(err, data) {
                        delete _erCache.inflight[tile.id];

                        if (err) return;
                        _erCache.loaded[tile.id] = true;

                        // Clusters are returned at low zoom
                        // if (data.clusters) {
                        //     data.clusters.forEach(function(feature) {
                        //         var loc = feature.point;
                        //         var size = feature.size;
                        //     });
                        // }

                        // Road segments at high zoom == oneways
                        if (data.roadSegments) {
                            data.roadSegments.forEach(function(feature) {
                                var loc = feature.points[0];

                                var d = new impOsmError({
                                    loc: [loc.lon, loc.lat],
                                    comments: null,
                                    error_type: k,
                                    road_type: feature.type
                                });

                                _erCache.data[d.id] = d;
                                _erCache.rtree.insert(encodeErrorRtree(d));
                            })
                        }

                        // Tiles at high zoom == missing roads
                        // if (data.tiles) {
                        //     data.tiles.forEach(function(feature) {
                        //         // Get description based on type
                        //         var desc = _missingTypes[feature.type];


                        //         var d = new impOsmError({
                        //             loc: [feature.x, feature.y],
                        //             comment: null,
                        //             error_type: k,
                        //             geometry_type: feature.type
                        //         });

                        //         _erCache.data[d.id] = d;
                        //         _erCache.rtree.insert(encodeErrorRtree(d));
                        //     })
                        // }

                        // Entities at high zoom == turn restrictions
                        if (data.entities) {
                            data.entities.forEach(function(feature) {
                                var loc = feature.point;

                                var d = new impOsmError({
                                    loc: [loc.lon, loc.lat],
                                    comments: null,
                                    error_type: k,
                                    turn_type: feature.turnType
                                });

                                _erCache.data[d.id] = d;
                                _erCache.rtree.insert(encodeErrorRtree(d));
                            })
                        }
                    }
                );
            });

            _erCache.inflight[tile.id] = requests;
            dispatch.call('loaded');
        })
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
        if (!(error instanceof impOsmError) || !error.id) return;

        _erCache.data[error.id] = error;
        updateRtree(encodeErrorRtree(error), true); // true = replace
        return error;
    },

    // remove a single error from the cache
    removeError: function(error) {
        if (!(error instanceof impOsmError) || !error.id) return;

        delete _erCache.data[error.id];
        updateRtree(encodeErrorRtree(error), false); // false = remove
    }
};
