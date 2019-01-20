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

    return [x, y]
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
                                var d = new impOsmError({
                                    loc: pointAverage(feature.points), // TODO: This isn't great for curved roads, would be better to find actual midpoint of segment
                                    comments: null,
                                    error_subtype: '',
                                    error_type: k,
                                    object_id: feature.wayId,
                                    object_type: 'way'
                                });

                                //TODO include road type in description?
                                // feature.type

                                // Variables used in the description
                                d.replacements = {
                                    percentage: feature.percentOfTrips,
                                    num_trips: feature.numberOfTrips,
                                    highway: linkErrorObject(t('QA.keepRight.error_parts.highway'))
                                };

                                _erCache.data[d.id] = d;
                                _erCache.rtree.insert(encodeErrorRtree(d));
                            })
                        }

                        // Tiles at high zoom == missing roads
                        if (data.tiles) {
                            data.tiles.forEach(function(feature) {
                                var geoType = feature.type.toLowerCase();

                                var d = new impOsmError({
                                    loc: pointAverage(feature.points),
                                    comments: null,
                                    error_subtype: '_' + geoType,
                                    error_type: k
                                });

                                d.replacements = {
                                    num_trips: feature.numberOfTrips,
                                    geometry_type: t('QA.improveOSM.geometry_types.' + geoType)
                                };

                                _erCache.data[d.id] = d;
                                _erCache.rtree.insert(encodeErrorRtree(d));
                            })
                        }

                        // Entities at high zoom == turn restrictions
                        if (data.entities) {
                            data.entities.forEach(function(feature) {
                                var loc = feature.point;

                                // Elements are presented in a strange way
                                var ids = feature.id.split(',');
                                var from_way = ids[0];
                                var via_node = ids[3];
                                var to_way = ids[2].split(':')[1];

                                var d = new impOsmError({
                                    loc: [loc.lon, loc.lat],
                                    comments: null,
                                    error_subtype: '',
                                    error_type: k,
                                    object_id: via_node,
                                    object_type: 'node'
                                });

                                // Variables used in the description
                                //TODO: Add direction of travel
                                d.replacements = {
                                    num_passed: feature.numberOfPasses,
                                    num_trips: feature.segments[0].numberOfTrips,
                                    turn_restriction: feature.turnType.toLowerCase(),
                                    from_way: linkEntity('w' + from_way),
                                    to_way: linkEntity('w' + to_way)
                                };

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
