import _find from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { request as d3_request } from 'd3-request';

import Protobuf from 'pbf';
import vt from '@mapbox/vector-tile';

import { utilRebind, utilTiler } from '../util';


var tiler = utilTiler().tileSize(512);
var dispatch = d3_dispatch('loadedData');
var _vtCache;


function abortRequest(i) {
    i.abort();
}


function vtToGeoJSON(bufferdata) {
    var tile = new vt.VectorTile(new Protobuf(bufferdata.data.response));
    var layers = Object.keys(tile.layers);
    if (!Array.isArray(layers)) { layers = [layers]; }

    var collection = { type: 'FeatureCollection', features: [] };

    layers.forEach(function (layerID) {
        var layer = tile.layers[layerID];
        if (layer) {
            for (var i = 0; i < layer.length; i++) {
                var feature = layer.feature(i).toGeoJSON(bufferdata.xyz[0], bufferdata.xyz[1], bufferdata.xyz[2]);
                if (layers.length > 1) feature.properties.vt_layer = layerID;
                collection.features.push(feature);
            }
        }
    });

    return collection;
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
            source.loaded[tile.id] = true;
            delete source.inflight[tile.id];
            if (err || !data) return;

            var bufferdata = {
                data: data,
                xyz: tile.xyz
            };

            source.loaded[tile.id] = {
                bufferdata: bufferdata,
                geojson: vtToGeoJSON(bufferdata)
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

        // for now, return the FeatureCollection for each tile
        var tiles = tiler.getTiles(projection);
        return tiles.map(function(tile) {
            var loaded = source.loaded[tile.id];
            return loaded && loaded.geojson;
        }).filter(Boolean);
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
