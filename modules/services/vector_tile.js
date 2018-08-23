import _find from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { request as d3_request } from 'd3-request';

import Protobuf from 'pbf';
import vt from '@mapbox/vector-tile';

import { utilHashcode, utilRebind, utilTiler } from '../util';


var tiler = utilTiler().tileSize(512);
var dispatch = d3_dispatch('loadedData');
var _vtCache;


function abortRequest(i) {
    i.abort();
}


function vtToGeoJSON(data, tile) {
    var vectorTile = new vt.VectorTile(new Protobuf(data.response));
    var layers = Object.keys(vectorTile.layers);
    if (!Array.isArray(layers)) { layers = [layers]; }

    var features = [];
    layers.forEach(function(layerID) {
        var layer = vectorTile.layers[layerID];
        if (layer) {
            for (var i = 0; i < layer.length; i++) {
                var feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
                if (layers.length > 1) {
                    feature.properties.vt_layer = layerID;
                }
                // force unique id generation
                feature.__hashcode__ = utilHashcode(JSON.stringify(feature));
                features.push(feature);
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
            source.loaded[tile.id] = {};
            delete source.inflight[tile.id];
            if (err || !data) return;

            source.loaded[tile.id] = {
                data: data,
                features: vtToGeoJSON(data, tile)
            };

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
        _vtCache[sourceID] = { template: template, inflight: {}, loaded: {} };
        return _vtCache[sourceID];
    },


    data: function(sourceID, projection) {
        var source = _vtCache[sourceID];
        if (!source) return [];

        var tiles = tiler.getTiles(projection);
        var seen = {};
        var results = [];

        for (var i = 0; i < tiles.length; i++) {
            var loaded = source.loaded[tiles[i].id];
            if (!loaded || !loaded.features) continue;

            for (var j = 0; j < loaded.features.length; j++) {
                var feature = loaded.features[j];
                if (seen[feature.__hashcode__]) continue;
                seen[feature.__hashcode__] = true;
                results.push(feature);
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
