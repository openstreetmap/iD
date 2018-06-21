import _extend from 'lodash-es/extend';
import _filter from 'lodash-es/filter';
import _flatten from 'lodash-es/flatten';
import _find from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';
import _isEmpty from 'lodash-es/isEmpty';
import _map from 'lodash-es/map';

import osmAuth from 'osm-auth';

import rbush from 'rbush';

var _entityCache = {};

import { range as d3_range } from 'd3-array';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { xml as d3_xml } from 'd3-request';

import { d3geoTile as d3_geoTile } from '../lib/d3.geo.tile';
import { geoExtent } from '../geo';

import {
    osmNote,
    osmEntity,
} from '../osm';

import {
    utilRebind,
    utilIdleWorker
} from '../util';

var urlroot = 'https://api.openstreetmap.org',
    _notesCache,
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

// no more than `limit` results per partition.
function searchLimited(psize, limit, projection, rtree) {
    limit = limit || 3;

    var partitions = partitionViewport(psize, projection);
    var results;

    results = _flatten(_map(partitions, function(extent) {
        return rtree.search(extent.bbox())
            .slice(0, limit)
            .map(function(d) { return d.data; });
    }));
    return results;
}

// partition viewport into `psize` x `psize` regions
function partitionViewport(psize, projection) {
    var dimensions = projection.clipExtent()[1];
    psize = psize || 16;
    var cols = d3_range(0, dimensions[0], psize);
    var rows = d3_range(0, dimensions[1], psize);
    var partitions = [];

    rows.forEach(function(y) {
        cols.forEach(function(x) {
            var min = [x, y + psize];
            var max = [x + psize, y];
            partitions.push(
                geoExtent(projection.invert(min), projection.invert(max)));
        });
    });

    return partitions;
}

function getLoc(attrs) {
    var lon = attrs.lon && attrs.lon.value;
    var lat = attrs.lat && attrs.lat.value;
    return [parseFloat(lon), parseFloat(lat)];
}

function parseComments(comments) {
    var parsedComments = [];

    // for each comment
    var i;
    for (i = 0; i < comments.length; i++) {
        if (comments[i].nodeName === 'comment') {
            var childNodes = comments[i].childNodes;
            var parsedComment = {};

            // for each comment element
            var j;
            for (j = 0; j < childNodes.length; j++) {
                if (childNodes[j].nodeName !== '#text') {
                    var nodeName = childNodes[j].nodeName;
                    parsedComment[nodeName] = childNodes[j].innerHTML;
                }
            }
            parsedComments.push(parsedComment);
        }
    }
    return parsedComments;
}

var parsers = {
    note: function parseNote(obj, uid) {
        var attrs = obj.attributes;
        var childNodes = obj.childNodes;
        var parsedNote = {};

        parsedNote.loc = getLoc(attrs);

        // for each element in a note
        var i;
        for (i = 0; i < childNodes.length; i++) {
            if (childNodes[i].nodeName !== '#text') {
                var nodeName = childNodes[i].nodeName;
                // if the element is comments, parse the comments
                if (nodeName === 'comments') {
                    parsedNote[nodeName] = parseComments(childNodes[i].childNodes);
                } else {
                    parsedNote[nodeName] = childNodes[i].innerHTML;
                }
            }
        }
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
            // TODO: change how a note uid is parsed. Nodes also share 'n' + id
            // var uid = osmEntity.id.fromOSM(child.nodeName, child.childNodes[1].innerHTML);
            var childNodes = child.childNodes;
            var id;
            var i;

            for (i = 0; i < childNodes.length; i++) {
                if (childNodes[i].nodeName === 'id') { id = childNodes[i].nodeName; }
            }
            if (options.cache && _entityCache[id]) {
                return null;
            }
            return parser(child);
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

        __notesSelectedNote = null;
    },

    authenticated: function() {
        return oauth.authenticated();
    },

    loadFromAPI: function(path, callback, options) {
        options = _extend({ cache: true }, options);

        function done(err, xml) {
            if (err) { console.log ('error: ', err); }
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

        if (this.authenticated()) {
            return oauth.xhr({ method: 'GET', path: path }, done);
        } else {
            return d3_xml(path).get(done);
        }
    },

    loadTile: function(which, currZoom, url, tile) {
        var cache = _notesCache[which];
        var bbox = tile.extent.toParam();
        var fullUrl = url + bbox;

        var id = tile.id;

        if (cache.loaded[id] || cache.inflight[id]) return;

        if (_isEmpty(cache.inflight)) {
            dispatch.call('loading');
        }

        cache.inflight[id] = this.loadFromAPI(
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
    },

    notes: function(projection) {
        var psize = 32, limit = 3;
        return searchLimited(psize, limit, projection, _notesCache.notes.rtree);
    },
};