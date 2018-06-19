import _extend from 'lodash-es/extend';
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';
import _isEmpty from 'lodash-es/isEmpty';

import osmAuth from 'osm-auth';

import rbush from 'rbush';

var _entityCache = {};

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { xml as d3_xml } from 'd3-request';

import { d3geoTile as d3_geoTile } from '../lib/d3.geo.tile';
import { geoExtent } from '../geo';

import {
    utilRebind,
    utilIdleWorker
} from '../util';

var urlroot = 'https://api.openstreetmap.org',
    _notesCache = { notes: { inflight: {}, loaded: {} } },
    __notesSelectedNote,
    dispatch = d3_dispatch('loadedNotes', 'loading'),
    tileZoom = 14;

var oauth = osmAuth({
    url: urlroot,
    oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
    oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
    loading: authLoading,
    done: authDone
});

function authLoading() {
    dispatch.call('authLoading');
}


function authDone() {
    dispatch.call('authDone');
}

function abortRequest(i) {
    i.abort();
}

function getTiles(projection) {
    var s = projection.scale() * 2 * Math.PI,
        z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
        ts = 256 * Math.pow(2, z - tileZoom),
        origin = [
            s / 2 - projection.translate()[0],
            s / 2 - projection.translate()[1]];

    return d3_geoTile()
        .scaleExtent([tileZoom, tileZoom])
        .scale(s)
        .size(projection.clipExtent()[1])
        .translate(projection.translate())()
        .map(function(tile) {
            var x = tile[0] * ts - origin[0],
                y = tile[1] * ts - origin[1];

            return {
                id: tile.toString(),
                xyz: tile,
                extent: geoExtent(
                    projection.invert([x, y + ts]),
                    projection.invert([x + ts, y])
                )
            };
        });
}

function nearNullIsland(x, y, z) {
    if (z >= 7) {
        var center = Math.pow(2, z - 1),
        width = Math.pow(2, z - 6),
        min = center - (width / 2),
        max = center + (width / 2) - 1;
        return x >= min && x <= max && y >= min && y <= max;
    }
    return false;
}

export default {

    init: function() {
        if (!_notesCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
        var cache = _notesCache;

        if (cache) {
            if (cache.notes && cache.notes.inflight) {
                _forEach(cache.notes.inflight, abortRequest);
            }
        }

        _notesCache = { notes: { inflight: {}, loaded: {} } };

        __notesSelectedNote = null;
    },

    authenticated: function() {
        return oauth.authenticated();
    },

    loadFromAPI(path, callback, options) {
        options = _extend({ cache: true }, options);

        function done(err, xml) {}

        if (this.authenticated()) {
            return oauth.xhr({ method: 'GET', path: path }, done);
        } else {
            return d3_xml(path).get(done);
        }
    },

    loadTile(which, currZoom, url, tile) {
        var cache = _notesCache[which];
        var bbox = tile.extent.toParam();

        var id = tile.id;

        if (cache.loaded[id] || cache.inflight[id]) return;

        if (_isEmpty(cache.inflight)) {
            dispatch.call('loading');
        }

        cache.inflight[id] = this.loadFromAPI(
            url + bbox,
            function () {

            },
            []
        );
    },

    loadTiles(which, url, projection) {
        var that = this;
        var s = projection.scale() * 2 * Math.PI,
            currZoom = Math.floor(Math.max(Math.log(s) / Math.log(2) - 8, 0));

        var tiles = getTiles(projection).filter(function(t) {
                return !nearNullIsland(t.xyz[0], t.xyz[1], t.xyz[2]);
            });

        _filter(which.inflight, function(v, k) {
            var wanted = _find(tiles, function(tile) { return k === (tile.id + ',0'); });
            if (!wanted) delete which.inflight[k];
            return !wanted;
        }).map(abortRequest);

        tiles.forEach(function(tile) {
            that.loadTile(which, currZoom, url, tile);
        });
    },

    loadNotes: function(projection) {
        var url = urlroot + '/api/0.6/notes?bbox=';
        this.loadTiles('notes', url, projection);
    }
};