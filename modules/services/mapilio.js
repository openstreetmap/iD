import { dispatch as d3_dispatch } from 'd3-dispatch';

import Protobuf from 'pbf';
import RBush from 'rbush';
import { VectorTile } from '@mapbox/vector-tile';

import { utilRebind, utilTiler } from '../util';
import {geoExtent, geoScaleToZoom} from '../geo';

const baseTileUrl = 'https://geo.mapilio.com/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=mapilio:';
const pointLayer = 'points_mapilio_map';
const lineLayer = 'captured_roads_line';
const tileStyle = '&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}';

const minZoom = 14;
const dispatch = d3_dispatch('change', 'loadedImages', 'loadedSigns', 'loadedMapFeatures', 'bearingChanged', 'imageChanged');

let _mlyActiveImage;
let _mlyCache;


// Partition viewport into higher zoom tiles
function partitionViewport(projection) {
    const z = geoScaleToZoom(projection.scale());
    const z2 = (Math.ceil(z * 2) / 2) + 2.5;   // round to next 0.5 and add 2.5
    const tiler = utilTiler().zoomExtent([z2, z2]);

    return tiler.getTiles(projection)
        .map(function(tile) { return tile.extent; });
}


// Return no more than `limit` results per partition.
function searchLimited(limit, projection, rtree) {
    limit = limit || 5;

    return partitionViewport(projection)
        .reduce(function(result, extent) {
            const found = rtree.search(extent.bbox())
                .slice(0, limit)
                .map(function(d) { return d.data; });

            return (found.length ? result.concat(found) : result);
        }, []);
}

// Load all data for the specified type from Mapilio vector tiles
function loadTiles(which, url, maxZoom, projection) {
    const tiler = utilTiler().zoomExtent([minZoom, maxZoom]).skipNullIsland(true);
    const tiles = tiler.getTiles(projection);

    tiles.forEach(function(tile) {
        loadTile(which, url, tile);
    });
}


// Load all data for the specified type from one vector tile
function loadTile(which, url, tile) {
    const cache = _mlyCache.requests;
    const tileId = `${tile.id}-${which}`;
    if (cache.loaded[tileId] || cache.inflight[tileId]) return;
    const controller = new AbortController();
    cache.inflight[tileId] = controller;
    const requestUrl = url.replace('{x}', tile.xyz[0])
        .replace('{y}', tile.xyz[1])
        .replace('{z}', tile.xyz[2]);

    fetch(requestUrl, { signal: controller.signal })
        .then(function(response) {
            if (!response.ok) {
                throw new Error(response.status + ' ' + response.statusText);
            }
            cache.loaded[tileId] = true;
            delete cache.inflight[tileId];
            return response.arrayBuffer();
        })
        .then(function(data) {
            if (!data) {
                throw new Error('No Data');
            }

            loadTileDataToCache(data, tile, which);

            if (which === 'images') {
                dispatch.call('loadedImages');
            }
        })
        .catch(function() {
            cache.loaded[tileId] = true;
            delete cache.inflight[tileId];
        });
}


// Load the data from the vector tile into cache
function loadTileDataToCache(data, tile, which) {
    const vectorTile = new VectorTile(new Protobuf(data));
    let features,
        cache,
        layer,
        i,
        feature,
        loc,
        d;
    if (vectorTile.layers.hasOwnProperty('points_mapilio_map')) {
        features = [];
        cache = _mlyCache.images;
        layer = vectorTile.layers.points_mapilio_map;

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            loc = feature.geometry.coordinates;
            d = {
                loc: loc,
                captured_at: feature.properties.captured_at,
                created_at: feature.properties.created_at,
                id: feature.properties.id,
                sequence_id: feature.properties.sequence_uuid,
            };
            cache.forImageId[d.id] = d;
            features.push({
                minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
            });
        }
        if (cache.rtree) {
            cache.rtree.load(features);
        }
    }

    if (vectorTile.layers.hasOwnProperty('captured_roads_line')) {
        features = [];
        cache = _mlyCache.sequences;
        layer = vectorTile.layers.captured_roads_line;

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            if (cache.lineString[feature.properties.sequence_uuid]) {
                cache.lineString[feature.properties.sequence_uuid].push(feature);
            } else {
                cache.lineString[feature.properties.sequence_uuid] = [feature];
            }
        }
    }

}


export default {
    // Initialize Mapilio
    init: function() {
        if (!_mlyCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    // Reset cache and state
    reset: function() {
        if (_mlyCache) {
            Object.values(_mlyCache.requests.inflight).forEach(function(request) { request.abort(); });
        }

        _mlyCache = {
            images: { rtree: new RBush(), forImageId: {} },
            sequences: { rtree: new RBush(), lineString: {} },
            requests: { loaded: {}, inflight: {} }
        };

        _mlyActiveImage = null;
    },

    // Get visible images
    images: function(projection) {
        const limit = 5;
        return searchLimited(limit, projection, _mlyCache.images.rtree);
    },


    // Load images in the visible area
    loadImages: function(projection) {
        let url = baseTileUrl + pointLayer + tileStyle;
        loadTiles('images', url, 14, projection);
    },

    // Load line in the visible area
    loadLines: function(projection) {
        let url = baseTileUrl + lineLayer + tileStyle;
        loadTiles('line', url, 14, projection);
    },

    // Get visible sequences
    sequences: function(projection) {
        const viewport = projection.clipExtent();
        const min = [viewport[0][0], viewport[1][1]];
        const max = [viewport[1][0], viewport[0][1]];
        const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
        const sequenceIds = {};
        let lineStrings = [];

        _mlyCache.images.rtree.search(bbox)
            .forEach(function(d) {
                if (d.data.sequence_id) {
                    sequenceIds[d.data.sequence_id] = true;
                }
            });

        Object.keys(sequenceIds).forEach(function(sequenceId) {
            if (_mlyCache.sequences.lineString[sequenceId]) {
                lineStrings = lineStrings.concat(_mlyCache.sequences.lineString[sequenceId]);
            }
        });

        return lineStrings;
    },


    // Update the currently highlighted sequence and selected bubble.
    setStyles: function(context, hovered) {
        const hoveredImageId = hovered && hovered.id;
        const hoveredSequenceId = hovered && hovered.sequence_id;
        const selectedSequenceId = _mlyActiveImage && _mlyActiveImage.sequence_id;

        context.container().selectAll('.layer-mapilio .viewfield-group')
            .classed('highlighted', function(d) { return (d.sequence_id === selectedSequenceId) || (d.id === hoveredImageId); })
            .classed('hovered', function(d) { return d.id === hoveredImageId; });

        context.container().selectAll('.layer-mapilio .sequence')
            .classed('highlighted', function(d) { return d.properties.id === hoveredSequenceId; })
            .classed('currentView', function(d) { return d.properties.id === selectedSequenceId; });

        return this;
    },


    // Return the current cache
    cache: function() {
        return _mlyCache;
    }
};
