import { dispatch as d3_dispatch } from 'd3-dispatch';
import type { Feature, GeoJsonProperties, MultiPolygon, Polygon } from 'geojson';
import { deepEqual } from 'fast-equals';
import turf_bboxClip from '@turf/bbox-clip';
import stringify from 'fast-json-stable-stringify';
import { union, type Geom } from 'polyclip-ts';

import { PbfReader } from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import type { Projection } from '../geo/raw_mercator';
import type { Tile } from '../util/tiler';
import { utilHashcode, utilRebind, utilTiler } from '../util';

interface MergeCache {
    [propertyHash: number]: VectorTileFeature[];
}

interface VectorTileFeature extends Feature<MultiPolygon | Polygon, GeoJsonProperties> {
    __layerID__: string;
    __featurehash__: number;
    __propertyhash__: number;
}

interface VectorTileSource {
    template: string;
    inflight: {
        [tileId: string]: AbortController;
    };
    loaded: {
        [tileId: string]: VectorTileFeature[];
    };
    canMerge: {
        [z: number]: MergeCache;
    };
}


var tiler = utilTiler().tileSize(512).margin(1);
var dispatch = d3_dispatch('loadedData');
var _vtCache: {
    [sourceId: string]: VectorTileSource;
};


function abortRequest(controller: AbortController) {
    controller.abort();
}


function vtToGeoJSON(data: ArrayBuffer, tile: Tile, mergeCache: MergeCache) {
    var vectorTile = new VectorTile(new PbfReader(data));
    var layers = Object.keys(vectorTile.layers);
    if (!Array.isArray(layers)) { layers = [layers]; }

    var features: VectorTileFeature[] = [];
    layers.forEach(function(layerID) {
        var layer = vectorTile.layers[layerID];
        if (layer) {
            for (var i = 0; i < layer.length; i++) {
                var feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]) as VectorTileFeature;

                // Treat all Polygons as MultiPolygons
                if (feature.geometry.type === 'Polygon') {
                    feature.geometry = {
                        type: 'MultiPolygon',
                        coordinates: [feature.geometry.coordinates],
                    };
                }

                var isClipped = false;

                // Clip to tile bounds
                if (feature.geometry.type === 'MultiPolygon') {
                    var featureClip = turf_bboxClip(feature, tile.extent.rectangle());
                    if (!deepEqual(feature.geometry, featureClip.geometry)) {
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
                if (isClipped && feature.geometry.type === 'MultiPolygon') {
                    var merged = mergeCache[propertyhash];
                    if (merged && merged.length) {
                        var other = merged[0];
                        const coords = union(
                            feature.geometry.coordinates as Geom,
                            other.geometry.coordinates as Geom
                        );

                        if (!coords || !coords.length) {
                            continue;  // something failed in polygon union
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


function loadTile(source: VectorTileSource, tile: Tile) {
    if (source.loaded[tile.id] || source.inflight[tile.id]) return;

    var url = source.template
        .replace('{x}', String(tile.xyz[0]))
        .replace('{y}', String(tile.xyz[1]))
        // TMS-flipped y coordinate
        .replace(/\{[t-]y\}/, String(Math.pow(2, tile.xyz[2]) - tile.xyz[1] - 1))
        .replace(/\{z(oom)?\}/, String(tile.xyz[2]))
        .replace(/\{switch:([^}]+)\}/, function(s, r) {
            var subdomains = r.split(',');
            return subdomains[(tile.xyz[0] + tile.xyz[1]) % subdomains.length];
        });


    var controller = new AbortController();
    source.inflight[tile.id] = controller;

    fetch(url, { signal: controller.signal })
        .then(function(response) {
            if (!response.ok) {
                throw new Error(response.status + ' ' + response.statusText);
            }
            source.loaded[tile.id] = [];
            delete source.inflight[tile.id];
            return response.arrayBuffer();
        })
        .then(function(data) {
            if (!data) {
                throw new Error('No Data');
            }

            var z = tile.xyz[2];
            if (!source.canMerge[z]) {
                source.canMerge[z] = {};  // initialize mergeCache
            }

            source.loaded[tile.id] = vtToGeoJSON(data, tile, source.canMerge[z]);
            dispatch.call('loadedData');
        })
        .catch(function() {
            source.loaded[tile.id] = [];
            delete source.inflight[tile.id];
        });
}


export default new class {
    event!: Pick<typeof dispatch, 'on'>;

    init() {
        if (!_vtCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    }


    reset() {
        for (var sourceID in _vtCache) {
            var source = _vtCache[sourceID];
            if (source && source.inflight) {
                Object.values(source.inflight).forEach(abortRequest);
            }
        }

        _vtCache = {};
    }


    addSource(sourceID: string, template: string) {
        _vtCache[sourceID] = { template: template, inflight: {}, loaded: {}, canMerge: {} };
        return _vtCache[sourceID];
    }


    data(sourceID: string, projection: Projection) {
        var source = _vtCache[sourceID];
        if (!source) return [];

        var tiles = tiler.getTiles(projection);
        var seen: { [hash: string]: boolean } = {};
        var results = [];

        for (var i = 0; i < tiles.length; i++) {
            var features = source.loaded[tiles[i].id];
            if (!features || !features.length) continue;

            for (var j = 0; j < features.length; j++) {
                var feature = features[j];
                var hash = feature.__featurehash__;
                if (seen[hash]) continue;
                seen[hash] = true;

                // return a shallow copy, because the hash may change
                // later if this feature gets merged with another
                results.push(Object.assign({}, feature));  // shallow copy
            }
        }

        return results;
    }


    loadTiles(sourceID: string, template: string, projection: Projection) {
        var source = _vtCache[sourceID];
        if (!source) {
            source = this.addSource(sourceID, template);
        }

        var tiles = tiler.getTiles(projection);

        // abort inflight requests that are no longer needed
        Object.keys(source.inflight).forEach(function(k) {
            var wanted = tiles.find(function(tile) { return k === tile.id; });
            if (!wanted) {
                abortRequest(source.inflight[k]);
                delete source.inflight[k];
            }
        });

        tiles.forEach(function(tile) {
            loadTile(source, tile);
        });
    }


    cache() {
        return _vtCache;
    }

};
