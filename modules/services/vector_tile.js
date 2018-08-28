import _clone from 'lodash-es/clone';
import _find from 'lodash-es/find';
import _isEqual from 'lodash-es/isEqual';
import _forEach from 'lodash-es/forEach';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { request as d3_request } from 'd3-request';

import turf_bboxClip from '@turf/bbox-clip';
import stringify from 'fast-json-stable-stringify';
import martinez from 'martinez-polygon-clipping';

import Protobuf from 'pbf';
import vt from '@mapbox/vector-tile';

import { utilHashcode, utilRebind, utilTiler } from '../util';


var tiler = utilTiler().tileSize(512).margin(1);
var dispatch = d3_dispatch('loadedData');
var _vtCache;


function abortRequest(i) {
    i.abort();
}


function vtToGeoJSON(data, tile, mergeCache) {
    var vectorTile = new vt.VectorTile(new Protobuf(data.response));
    var layers = Object.keys(vectorTile.layers);
    if (!Array.isArray(layers)) { layers = [layers]; }

    var features = [];
    layers.forEach(function(layerID) {
        var layer = vectorTile.layers[layerID];
        if (layer) {
            for (var i = 0; i < layer.length; i++) {
                var feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
                var geometry = feature.geometry;

                // Treat all Polygons as MultiPolygons
                if (geometry.type === 'Polygon') {
                    geometry.type = 'MultiPolygon';
                    geometry.coordinates = [geometry.coordinates];
                }

                // Clip to tile bounds
                if (geometry.type === 'MultiPolygon') {
                    var isClipped = false;
                    var featureClip = turf_bboxClip(feature, tile.extent.rectangle());
                    if (!_isEqual(feature.geometry, featureClip.geometry)) {
                        // feature = featureClip;
                        isClipped = true;
                    }
                    if (!feature.geometry.coordinates.length) continue;   // not actually on this tile
                    if (!feature.geometry.coordinates[0].length) continue;   // not actually on this tile
                }

                // Generate some unique IDs and add some metadata
                var featurehash = utilHashcode(stringify(feature));
                var propertyhash = utilHashcode(stringify(feature.properties || {}));
                feature.__layerID__ = layerID.replace(/[^_a-zA-Z0-9\-]/g, '_');
                feature.__featurehash__ = featurehash;
                feature.__propertyhash__ = propertyhash;
                features.push(feature);

                // Clipped Polygons at same zoom with identical properties can get merged
                if (isClipped && geometry.type === 'MultiPolygon') {
                    var merged = mergeCache[propertyhash];
                    if (merged && merged.length) {
                        var other = merged[0];
                        var coords = martinez.union(
                            feature.geometry.coordinates, other.geometry.coordinates
                        );

                        if (!coords || !coords.length) {
                            continue;  // something failed in martinez union
                        }

                        merged.push(feature);
                        for (var j = 0; j < merged.length; j++) {      // all these features get...
                            merged[j].geometry.coordinates = coords;   // same coords
                            merged[j].__featurehash__ = featurehash;   // same hash, so deduplication works
                        }
                    } else {
                        mergeCache[propertyhash] = [feature];
                    }
                }
            }
        }
    });

    return features;
}


function loadTile(source, tile) {
    if (source.loaded[tile.id] || source.inflight[tile.id]) return;

    var url = source.template
        .replace('{x}', tile.xyz[0])
        .replace('{y}', tile.xyz[1])
        // TMS-flipped y coordinate
        .replace(/\{[t-]y\}/, Math.pow(2, tile.xyz[2]) - tile.xyz[1] - 1)
        .replace(/\{z(oom)?\}/, tile.xyz[2])
        .replace(/\{switch:([^}]+)\}/, function(s, r) {
            var subdomains = r.split(',');
            return subdomains[(tile.xyz[0] + tile.xyz[1]) % subdomains.length];
        });

    source.inflight[tile.id] = d3_request(url)
        .responseType('arraybuffer')
        .get(function(err, data) {
            source.loaded[tile.id] = [];
            delete source.inflight[tile.id];
            if (err || !data) return;

            var z = tile.xyz[2];
            if (!source.canMerge[z]) {
                source.canMerge[z] = {};  // initialize mergeCache
            }

            source.loaded[tile.id] = vtToGeoJSON(data, tile, source.canMerge[z]);
            dispatch.call('loadedData');
        });
}


export default {

    init: function() {
        if (!_vtCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },


    reset: function() {
        for (var sourceID in _vtCache) {
            var source = _vtCache[sourceID];
            if (source && source.inflight) {
                _forEach(source.inflight, abortRequest);
            }
        }

        _vtCache = {};
    },


    addSource: function(sourceID, template) {
        _vtCache[sourceID] = { template: template, inflight: {}, loaded: {}, canMerge: {} };
        return _vtCache[sourceID];
    },


    data: function(sourceID, projection) {
        var source = _vtCache[sourceID];
        if (!source) return [];

        var tiles = tiler.getTiles(projection);
        var seen = {};
        var results = [];

        for (var i = 0; i < tiles.length; i++) {
            var features = source.loaded[tiles[i].id];
            if (!features || !features.length) continue;

            for (var j = 0; j < features.length; j++) {
                var feature = features[j];
                var hash = feature.__featurehash__;
                if (seen[hash]) continue;
                seen[hash] = true;

                // return a shallow clone, because the hash may change
                // later if this feature gets merged with another
                results.push(_clone(feature));
            }
        }

        return results;
    },


    loadTiles: function(sourceID, template, projection) {
        var source = _vtCache[sourceID];
        if (!source) {
            source = this.addSource(sourceID, template);
        }

        var tiles = tiler.getTiles(projection);

        // abort inflight requests that are no longer needed
        _forEach(source.inflight, function(v, k) {
            var wanted = _find(tiles, function(tile) { return k === tile.id; });

            if (!wanted) {
                abortRequest(v);
                delete source.inflight[k];
            }
        });

        tiles.forEach(function(tile) {
            loadTile(source, tile);
        });
    },


    cache: function() {
        return _vtCache;
    }

};
