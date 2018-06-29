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

import {
    osmNote
} from '../osm';
import { actionRestrictTurn } from '../actions';

var urlroot = 'https://api.openstreetmap.org',
    _notesCache,
    dispatch = d3_dispatch('loadedNotes', 'loading'),
    tileZoom = 14;

// TODO: complete authentication
var oauth = osmAuth({
    url: urlroot,
    oauth_consumer_key: '',
    oauth_secret: '',
    loading: authLoading,
    done: authDone
});

function authLoading() {
    dispatch.call('authLoading');
}

function authDone() {
    dispatch.call('authDone');
}

function authenticated() {
    return oauth.authenticated();
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

function getLoc(attrs) {
    var lon = attrs.lon && attrs.lon.value;
    var lat = attrs.lat && attrs.lat.value;
    return [parseFloat(lon), parseFloat(lat)];
}

function parseComments(comments) {
    var parsedComments = [];

    // for each comment
    _forEach(comments, function(comment) {
        if (comment.nodeName === 'comment') {
            var childNodes = comment.childNodes;
            var parsedComment = {};

            _forEach(childNodes, function(node) {
                if (node.nodeName !== '#text') {
                    var nodeName = node.nodeName;
                    parsedComment[nodeName] = node.innerHTML;
                }
            });
            if (parsedComment) { parsedComments.push(parsedComment); }
        }
    });
    return parsedComments;
}

var parsers = {
    note: function parseNote(obj, uid) {
        var attrs = obj.attributes;
        var childNodes = obj.childNodes;
        var parsedNote = {};

        parsedNote.loc = getLoc(attrs);

        _forEach(childNodes, function(node) {
            if (node.nodeName !== '#text') {
                var nodeName = node.nodeName;
                // if the element is comments, parse the comments
                if (nodeName === 'comments') {
                    parsedNote[nodeName] = parseComments(node.childNodes);
                } else {
                    parsedNote[nodeName] = node.innerHTML;
                }
            }
        });

        parsedNote.id = uid;
        parsedNote.type = 'note';

        return {
            minX: parsedNote.loc[0],
            minY: parsedNote.loc[1],
            maxX: parsedNote.loc[0],
            maxY: parsedNote.loc[1],
            data: new osmNote(parsedNote)
        };
    }
};

function parse(xml, callback, options) {
    options = _extend({ cache: true }, options);
    if (!xml || !xml.childNodes) return;

    var root = xml.childNodes[0];
    var children = root.childNodes;

    function parseChild(child) {
        var parser = parsers[child.nodeName];
        if (parser) {

            var childNodes = child.childNodes;

            var uid;
            _forEach(childNodes, function(node) {
                if (node.nodeName === 'id') {
                    uid = child.nodeName + node.innerHTML;
                }
            });

            if (options.cache && _entityCache[uid]) {
                return null;
            }
            return parser(child, uid);
        }
    }
    utilIdleWorker(children, parseChild, callback);
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

        _notesCache = { notes: { inflight: {}, loaded: {}, rtree: rbush() } };
    },

    loadFromAPI: function(path, callback, options) {
        options = _extend({ cache: true }, options);

        function done(err, xml) {
            if (err) {
                callback(err, xml);
            }
            parse(
                xml,
                function(entities) {
                    if (options.cache) {
                        for (var i in entities) {
                            _entityCache[entities[i].id] = true;
                        }
                    }
                    callback(null, entities);
                },
                options
            );
        }

        if (authenticated()) {
            return oauth.xhr({ method: 'GET', path: path }, done);
        } else {
            return d3_xml(path).get(done);
        }
    },

    // TODO: refactor /services for consistency by splitting or joining loadTiles & loadTile
    loadTile: function(which, currZoom, url, tile) {
        var that = this;
        var cache = _notesCache[which];
        var bbox = tile.extent.toParam();
        var fullUrl = url + bbox;

        var id = tile.id;

        if (cache.loaded[id] || cache.inflight[id]) return;

        if (_isEmpty(cache.inflight)) {
            dispatch.call('loading');
        }

        cache.inflight[id] = that.loadFromAPI(
            fullUrl,
            function (err, parsed) {
                delete cache.inflight[id];
                if (!err) {
                    cache.loaded[id] = true;
                }

                cache.rtree.load(parsed);

                if (_isEmpty(cache.inflight)) {
                    dispatch.call('loadedNotes');
                }
            },
            []
        );
    },

    loadTiles: function(which, url, projection) {
        var that = this;
        var s = projection.scale() * 2 * Math.PI,
            currZoom = Math.floor(Math.max(Math.log(s) / Math.log(2) - 8, 0));

        var tiles = getTiles(projection);

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
        var that = this;
        var url = urlroot + '/api/0.6/notes?bbox=';
        that.loadTiles('notes', url, projection);
    },

    notes: function(projection) {
        var viewport = projection.clipExtent();
        var min = [viewport[0][0], viewport[1][1]];
        var max = [viewport[1][0], viewport[0][1]];
        var bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();

        return _notesCache.notes.rtree.search(bbox)
            .map(function(d) { return d.data; });
    },

    cache: function() {
        return _notesCache;
    }
};