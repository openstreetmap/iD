import _chunk from 'lodash-es/chunk';
import _extend from 'lodash-es/extend';
import _forEach from 'lodash-es/forEach';
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _groupBy from 'lodash-es/groupBy';
import _isEmpty from 'lodash-es/isEmpty';
import _map from 'lodash-es/map';
import _uniq from 'lodash-es/uniq';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { xml as d3_xml } from 'd3-request';

import osmAuth from 'osm-auth';
import { JXON } from '../util/jxon';
import { d3geoTile as d3_geoTile } from '../lib/d3.geo.tile';
import { geoExtent } from '../geo';
import {
    osmEntity,
    osmNode,
    osmRelation,
    osmWay
} from '../osm';

import { utilRebind, utilIdleWorker } from '../util';


var dispatch = d3_dispatch('authLoading', 'authDone', 'change', 'loading', 'loaded');
var urlroot = 'https://www.openstreetmap.org';
var oauth = osmAuth({
    url: urlroot,
    oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
    oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
    loading: authLoading,
    done: authDone
});

var _blacklists = ['.*\.google(apis)?\..*/(vt|kh)[\?/].*([xyz]=.*){3}.*'];
var _tiles = { loaded: {}, inflight: {} };
var _changeset = {};
var _entityCache = {};
var _connectionID = 1;
var _tileZoom = 16;
var _rateLimitError;
var _userChangesets;
var _userDetails;
var _off;


function authLoading() {
    dispatch.call('authLoading');
}


function authDone() {
    dispatch.call('authDone');
}


function abortRequest(i) {
    if (i) {
        i.abort();
    }
}


function getLoc(attrs) {
    var lon = attrs.lon && attrs.lon.value;
    var lat = attrs.lat && attrs.lat.value;
    return [parseFloat(lon), parseFloat(lat)];
}


function getNodes(obj) {
    var elems = obj.getElementsByTagName('nd');
    var nodes = new Array(elems.length);
    for (var i = 0, l = elems.length; i < l; i++) {
        nodes[i] = 'n' + elems[i].attributes.ref.value;
    }
    return nodes;
}


function getTags(obj) {
    var elems = obj.getElementsByTagName('tag');
    var tags = {};
    for (var i = 0, l = elems.length; i < l; i++) {
        var attrs = elems[i].attributes;
        tags[attrs.k.value] = attrs.v.value;
    }

    return tags;
}


function getMembers(obj) {
    var elems = obj.getElementsByTagName('member');
    var members = new Array(elems.length);
    for (var i = 0, l = elems.length; i < l; i++) {
        var attrs = elems[i].attributes;
        members[i] = {
            id: attrs.type.value[0] + attrs.ref.value,
            type: attrs.type.value,
            role: attrs.role.value
        };
    }
    return members;
}


function getVisible(attrs) {
    return (!attrs.visible || attrs.visible.value !== 'false');
}


var parsers = {
    node: function nodeData(obj, uid) {
        var attrs = obj.attributes;
        return new osmNode({
            id:uid,
            visible: getVisible(attrs),
            version: attrs.version.value,
            changeset: attrs.changeset && attrs.changeset.value,
            timestamp: attrs.timestamp && attrs.timestamp.value,
            user: attrs.user && attrs.user.value,
            uid: attrs.uid && attrs.uid.value,
            loc: getLoc(attrs),
            tags: getTags(obj)
        });
    },

    way: function wayData(obj, uid) {
        var attrs = obj.attributes;
        return new osmWay({
            id: uid,
            visible: getVisible(attrs),
            version: attrs.version.value,
            changeset: attrs.changeset && attrs.changeset.value,
            timestamp: attrs.timestamp && attrs.timestamp.value,
            user: attrs.user && attrs.user.value,
            uid: attrs.uid && attrs.uid.value,
            tags: getTags(obj),
            nodes: getNodes(obj),
        });
    },

    relation: function relationData(obj, uid) {
        var attrs = obj.attributes;
        return new osmRelation({
            id: uid,
            visible: getVisible(attrs),
            version: attrs.version.value,
            changeset: attrs.changeset && attrs.changeset.value,
            timestamp: attrs.timestamp && attrs.timestamp.value,
            user: attrs.user && attrs.user.value,
            uid: attrs.uid && attrs.uid.value,
            tags: getTags(obj),
            members: getMembers(obj)
        });
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
            var uid = osmEntity.id.fromOSM(child.nodeName, child.attributes.id.value);
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
        utilRebind(this, dispatch, 'on');
    },


    reset: function() {
        _connectionID++;
        _userChangesets = undefined;
        _userDetails = undefined;
        _rateLimitError = undefined;
        _forEach(_tiles.inflight, abortRequest);
        if (_changeset.inflight) abortRequest(_changeset.inflight);
        _tiles = { loaded: {}, inflight: {} };
        _changeset = {};
        _entityCache = {};
        return this;
    },


    getConnectionId: function() {
        return _connectionID;
    },


    changesetURL: function(changesetId) {
        return urlroot + '/changeset/' + changesetId;
    },


    changesetsURL: function(center, zoom) {
        var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        return urlroot + '/history#map=' +
            Math.floor(zoom) + '/' +
            center[1].toFixed(precision) + '/' +
            center[0].toFixed(precision);
    },


    entityURL: function(entity) {
        return urlroot + '/' + entity.type + '/' + entity.osmId();
    },


    historyURL: function(entity) {
        return urlroot + '/' + entity.type + '/' + entity.osmId() + '/history';
    },


    userURL: function(username) {
        return urlroot + '/user/' + username;
    },


    loadFromAPI: function(path, callback, options) {
        options = _extend({ cache: true }, options);
        var that = this;
        var cid = _connectionID;

        function done(err, xml) {
            if (that.getConnectionId() !== cid) {
                if (callback) callback({ message: 'Connection Switched', status: -1 });
                return;
            }

            var isAuthenticated = that.authenticated();

            // 400 Bad Request, 401 Unauthorized, 403 Forbidden
            // Logout and retry the request..
            if (isAuthenticated && err && (err.status === 400 || err.status === 401 || err.status === 403)) {
                that.logout();
                that.loadFromAPI(path, callback);

            // else, no retry..
            } else {
                // 509 Bandwidth Limit Exceeded, 429 Too Many Requests
                // Set the rateLimitError flag and trigger a warning..
                if (!isAuthenticated && !_rateLimitError && err &&
                        (err.status === 509 || err.status === 429)) {
                    _rateLimitError = err;
                    dispatch.call('change');
                }

                if (callback) {
                    if (err) return callback(err, null);
                    parse(xml, function (entities) {
                        if (options.cache) {
                            for (var i in entities) {
                                _entityCache[entities[i].id] = true;
                            }
                        }
                        callback(null, entities);
                    }, options);
                }
            }
        }

        if (this.authenticated()) {
            return oauth.xhr({ method: 'GET', path: path }, done);
        } else {
            var url = urlroot + path;
            return d3_xml(url).get(done);
        }
    },


    loadEntity: function(id, callback) {
        var type = osmEntity.id.type(id);
        var osmID = osmEntity.id.toOSM(id);
        var options = { cache: false };

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + (type !== 'node' ? '/full' : ''),
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            },
            options
        );
    },


    loadEntityVersion: function(id, version, callback) {
        var type = osmEntity.id.type(id);
        var osmID = osmEntity.id.toOSM(id);
        var options = { cache: false };

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + '/' + version,
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            },
            options
        );
    },


    loadMultiple: function(ids, callback) {
        var that = this;

        _forEach(_groupBy(_uniq(ids), osmEntity.id.type), function(v, k) {
            var type = k + 's';
            var osmIDs = _map(v, osmEntity.id.toOSM);
            var options = { cache: false };

            _forEach(_chunk(osmIDs, 150), function(arr) {
                that.loadFromAPI(
                    '/api/0.6/' + type + '?' + type + '=' + arr.join(),
                    function(err, entities) {
                        if (callback) callback(err, { data: entities });
                    },
                    options
                );
            });
        });
    },


    authenticated: function() {
        return oauth.authenticated();
    },


    putChangeset: function(changeset, changes, callback) {
        if (_changeset.inflight) {
            return callback({ message: 'Changeset already inflight', status: -2 }, changeset);
        }

        var that = this;
        var cid = _connectionID;

        if (_changeset.open) {   // reuse existing open changeset..
            createdChangeset(null, _changeset.open);
        } else {                 // open a new changeset..
            _changeset.inflight = oauth.xhr({
                method: 'PUT',
                path: '/api/0.6/changeset/create',
                options: { header: { 'Content-Type': 'text/xml' } },
                content: JXON.stringify(changeset.asJXON())
            }, createdChangeset);
        }


        function createdChangeset(err, changesetID) {
            _changeset.inflight = null;

            if (err) {
                // 400 Bad Request, 401 Unauthorized, 403 Forbidden..
                if (err.status === 400 || err.status === 401 || err.status === 403) {
                    that.logout();
                }
                return callback(err, changeset);
            }
            if (that.getConnectionId() !== cid) {
                return callback({ message: 'Connection Switched', status: -1 }, changeset);
            }

            _changeset.open = changesetID;
            changeset = changeset.update({ id: changesetID });

            // Upload the changeset..
            _changeset.inflight = oauth.xhr({
                method: 'POST',
                path: '/api/0.6/changeset/' + changesetID + '/upload',
                options: { header: { 'Content-Type': 'text/xml' } },
                content: JXON.stringify(changeset.osmChangeJXON(changes))
            }, uploadedChangeset);
        }


        function uploadedChangeset(err) {
            _changeset.inflight = null;

            if (err) return callback(err, changeset);

            // Upload was successful, safe to call the callback.
            // Add delay to allow for postgres replication #1646 #2678
            window.setTimeout(function() {
                callback(null, changeset);
            }, 2500);

            _changeset.open = null;

            // At this point, we don't really care if the connection was switched..
            // Only try to close the changeset if we're still talking to the same server.
            if (that.getConnectionId() === cid) {
                // Still attempt to close changeset, but ignore response because #2667
                oauth.xhr({
                    method: 'PUT',
                    path: '/api/0.6/changeset/' + changeset.id + '/close',
                    options: { header: { 'Content-Type': 'text/xml' } }
                }, function() { return true; });
            }
        }
    },


    userDetails: function(callback) {
        if (_userDetails) {
            callback(undefined, _userDetails);
            return;
        }

        var that = this;
        var cid = _connectionID;

        function done(err, user_details) {
            if (err) {
                // 400 Bad Request, 401 Unauthorized, 403 Forbidden..
                if (err.status === 400 || err.status === 401 || err.status === 403) {
                    that.logout();
                }
                return callback(err);
            }
            if (that.getConnectionId() !== cid) {
                return callback({ message: 'Connection Switched', status: -1 });
            }


            var u = user_details.getElementsByTagName('user')[0];
            var img = u.getElementsByTagName('img');
            var image_url = '';

            if (img && img[0] && img[0].getAttribute('href')) {
                image_url = img[0].getAttribute('href');
            }

            var changesets = u.getElementsByTagName('changesets');
            var changesets_count = 0;

            if (changesets && changesets[0] && changesets[0].getAttribute('count')) {
                changesets_count = changesets[0].getAttribute('count');
            }

            _userDetails = {
                id: u.attributes.id.value,
                display_name: u.attributes.display_name.value,
                image_url: image_url,
                changesets_count: changesets_count
            };

            callback(undefined, _userDetails);
        }

        oauth.xhr({ method: 'GET', path: '/api/0.6/user/details' }, done);
    },


    userChangesets: function(callback) {
        if (_userChangesets) {
            callback(undefined, _userChangesets);
            return;
        }

        var that = this;
        var cid = _connectionID;

        this.userDetails(function(err, user) {
            if (err) {
                return callback(err);
            }
            if (that.getConnectionId() !== cid) {
                return callback({ message: 'Connection Switched', status: -1 });
            }

            function done(err, changesets) {
                if (err) {
                    // 400 Bad Request, 401 Unauthorized, 403 Forbidden..
                    if (err.status === 400 || err.status === 401 || err.status === 403) {
                        that.logout();
                    }
                    return callback(err);
                }
                if (that.getConnectionId() !== cid) {
                    return callback({ message: 'Connection Switched', status: -1 });
                }

                _userChangesets = Array.prototype.map.call(
                    changesets.getElementsByTagName('changeset'),
                    function (changeset) {
                        return { tags: getTags(changeset) };
                    }
                ).filter(function (changeset) {
                    var comment = changeset.tags.comment;
                    return comment && comment !== '';
                });

                callback(undefined, _userChangesets);
            }

            oauth.xhr({ method: 'GET', path: '/api/0.6/changesets?user=' + user.id }, done);
        });
    },


    status: function(callback) {
        var that = this;
        var cid = _connectionID;

        function done(xml) {
            if (that.getConnectionId() !== cid) {
                return callback({ message: 'Connection Switched', status: -1 }, 'connectionSwitched');
            }

            // update blacklists
            var elements = xml.getElementsByTagName('blacklist');
            var regexes = [];
            for (var i = 0; i < elements.length; i++) {
                var regex = elements[i].getAttribute('regex');  // needs unencode?
                if (regex) {
                    regexes.push(regex);
                }
            }
            if (regexes.length) {
                _blacklists = regexes;
            }


            if (_rateLimitError) {
                callback(_rateLimitError, 'rateLimited');
            } else {
                var apiStatus = xml.getElementsByTagName('status');
                var val = apiStatus[0].getAttribute('api');

                callback(undefined, val);
            }
        }

        d3_xml(urlroot + '/api/capabilities').get()
            .on('load', done)
            .on('error', callback);
    },


    imageryBlacklists: function() {
        return _blacklists;
    },


    tileZoom: function(_) {
        if (!arguments.length) return _tileZoom;
        _tileZoom = _;
        return this;
    },


    loadTiles: function(projection, dimensions, callback) {
        if (_off) return;

        var that = this;
        var s = projection.scale() * 2 * Math.PI;
        var z = Math.max(Math.log(s) / Math.log(2) - 8, 0);
        var ts = 256 * Math.pow(2, z - _tileZoom);
        var origin = [
            s / 2 - projection.translate()[0],
            s / 2 - projection.translate()[1]
        ];

        var tiles = d3_geoTile()
            .scaleExtent([_tileZoom, _tileZoom])
            .scale(s)
            .size(dimensions)
            .translate(projection.translate())()
            .map(function(tile) {
                var x = tile[0] * ts - origin[0];
                var y = tile[1] * ts - origin[1];

                return {
                    id: tile.toString(),
                    extent: geoExtent(
                        projection.invert([x, y + ts]),
                        projection.invert([x + ts, y]))
                };
            });

        _filter(_tiles.inflight, function(v, i) {
            var wanted = _find(tiles, function(tile) {
                return i === tile.id;
            });
            if (!wanted) delete _tiles.inflight[i];
            return !wanted;
        }).map(abortRequest);

        tiles.forEach(function(tile) {
            var id = tile.id;

            if (_tiles.loaded[id] || _tiles.inflight[id]) return;

            if (_isEmpty(_tiles.inflight)) {
                dispatch.call('loading');
            }

            _tiles.inflight[id] = that.loadFromAPI(
                '/api/0.6/map?bbox=' + tile.extent.toParam(),
                function(err, parsed) {
                    delete _tiles.inflight[id];
                    if (!err) {
                        _tiles.loaded[id] = true;
                    }

                    if (callback) {
                        callback(err, _extend({ data: parsed }, tile));
                    }

                    if (_isEmpty(_tiles.inflight)) {
                        dispatch.call('loaded');
                    }
                }
            );
        });
    },


    switch: function(options) {
        urlroot = options.urlroot;

        oauth.options(_extend({
            url: urlroot,
            loading: authLoading,
            done: authDone
        }, options));

        this.reset();
        this.userChangesets(function() {});  // eagerly load user details/changesets
        dispatch.call('change');
        return this;
    },


    toggle: function(_) {
        _off = !_;
        return this;
    },


    loadedTiles: function(_) {
        if (!arguments.length) return _tiles.loaded;
        _tiles.loaded = _;
        return this;
    },


    logout: function() {
        _userChangesets = undefined;
        _userDetails = undefined;
        oauth.logout();
        dispatch.call('change');
        return this;
    },


    authenticate: function(callback) {
        var that = this;
        var cid = _connectionID;
        _userChangesets = undefined;
        _userDetails = undefined;

        function done(err, res) {
            if (err) {
                if (callback) callback(err);
                return;
            }
            if (that.getConnectionId() !== cid) {
                if (callback) callback({ message: 'Connection Switched', status: -1 });
                return;
            }
            _rateLimitError = undefined;
            dispatch.call('change');
            if (callback) callback(err, res);
            that.userChangesets(function() {});  // eagerly load user details/changesets
        }

        return oauth.authenticate(done);
    }
};
