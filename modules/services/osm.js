import _throttle from 'lodash-es/throttle';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { xml as d3_xml } from 'd3-fetch';
import { json as d3_json } from 'd3-fetch';

import osmAuth from 'osm-auth';
import RBush from 'rbush';

import { JXON } from '../util/jxon';
import { geoExtent, geoRawMercator, geoVecAdd, geoZoomToScale } from '../geo';
import { osmEntity, osmNode, osmNote, osmRelation, osmWay } from '../osm';
import { utilArrayChunk, utilArrayGroupBy, utilArrayUniq, utilRebind, utilTiler, utilQsString } from '../util';


var tiler = utilTiler();
var dispatch = d3_dispatch('apiStatusChange', 'authLoading', 'authDone', 'change', 'loading', 'loaded', 'loadedNotes');
var urlroot = 'https://www.openstreetmap.org';
var oauth = osmAuth({
    url: urlroot,
    oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
    oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
    loading: authLoading,
    done: authDone
});
// hardcode default block of Google Maps
var _imageryBlocklists = [/.*\.google(apis)?\..*\/(vt|kh)[\?\/].*([xyz]=.*){3}.*/];
var _tileCache = { toLoad: {}, loaded: {}, inflight: {}, seen: {}, rtree: new RBush() };
var _noteCache = { toLoad: {}, loaded: {}, inflight: {}, inflightPost: {}, note: {}, closed: {}, rtree: new RBush() };
var _userCache = { toLoad: {}, user: {} };
var _cachedApiStatus;
var _changeset = {};

var _deferred = new Set();
var _connectionID = 1;
var _tileZoom = 16;
var _noteZoom = 12;
var _rateLimitError;
var _userChangesets;
var _userDetails;
var _off;

// set a default but also load this from the API status
var _maxWayNodes = 2000;


function authLoading() {
    dispatch.call('authLoading');
}


function authDone() {
    dispatch.call('authDone');
}


function abortRequest(controllerOrXHR) {
    if (controllerOrXHR) {
        controllerOrXHR.abort();
    }
}


function hasInflightRequests(cache) {
    return Object.keys(cache.inflight).length;
}


function abortUnwantedRequests(cache, visibleTiles) {
    Object.keys(cache.inflight).forEach(function(k) {
        if (cache.toLoad[k]) return;
        if (visibleTiles.find(function(tile) { return k === tile.id; })) return;

        abortRequest(cache.inflight[k]);
        delete cache.inflight[k];
    });
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

function getNodesJSON(obj) {
    var elems = obj.nodes;
    var nodes = new Array(elems.length);
    for (var i = 0, l = elems.length; i < l; i++) {
        nodes[i] = 'n' + elems[i];
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

function getMembersJSON(obj) {
    var elems = obj.members;
    var members = new Array(elems.length);
    for (var i = 0, l = elems.length; i < l; i++) {
        var attrs = elems[i];
        members[i] = {
            id: attrs.type[0] + attrs.ref,
            type: attrs.type,
            role: attrs.role
        };
    }
    return members;
}

function getVisible(attrs) {
    return (!attrs.visible || attrs.visible.value !== 'false');
}


function parseComments(comments) {
    var parsedComments = [];

    // for each comment
    for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        if (comment.nodeName === 'comment') {
            var childNodes = comment.childNodes;
            var parsedComment = {};

            for (var j = 0; j < childNodes.length; j++) {
                var node = childNodes[j];
                var nodeName = node.nodeName;
                if (nodeName === '#text') continue;
                parsedComment[nodeName] = node.textContent;

                if (nodeName === 'uid') {
                    var uid = node.textContent;
                    if (uid && !_userCache.user[uid]) {
                        _userCache.toLoad[uid] = true;
                    }
                }
            }

            if (parsedComment) {
                parsedComments.push(parsedComment);
            }
        }
    }
    return parsedComments;
}


function encodeNoteRtree(note) {
    return {
        minX: note.loc[0],
        minY: note.loc[1],
        maxX: note.loc[0],
        maxY: note.loc[1],
        data: note
    };
}


var jsonparsers = {

    node: function nodeData(obj, uid) {
        return new osmNode({
            id:  uid,
            visible: typeof obj.visible === 'boolean' ? obj.visible : true,
            version: obj.version && obj.version.toString(),
            changeset: obj.changeset && obj.changeset.toString(),
            timestamp: obj.timestamp,
            user: obj.user,
            uid: obj.uid && obj.uid.toString(),
            loc: [parseFloat(obj.lon), parseFloat(obj.lat)],
            tags: obj.tags
        });
    },

    way: function wayData(obj, uid) {
        return new osmWay({
            id:  uid,
            visible: typeof obj.visible === 'boolean' ? obj.visible : true,
            version: obj.version && obj.version.toString(),
            changeset: obj.changeset && obj.changeset.toString(),
            timestamp: obj.timestamp,
            user: obj.user,
            uid: obj.uid && obj.uid.toString(),
            tags: obj.tags,
            nodes: getNodesJSON(obj)
        });
    },

    relation: function relationData(obj, uid) {
        return new osmRelation({
            id:  uid,
            visible: typeof obj.visible === 'boolean' ? obj.visible : true,
            version: obj.version && obj.version.toString(),
            changeset: obj.changeset && obj.changeset.toString(),
            timestamp: obj.timestamp,
            user: obj.user,
            uid: obj.uid && obj.uid.toString(),
            tags: obj.tags,
            members: getMembersJSON(obj)
        });
    }
};

function parseJSON(payload, callback, options) {
    options = Object.assign({ skipSeen: true }, options);
    if (!payload)  {
        return callback({ message: 'No JSON', status: -1 });
    }

    var json = payload;
    if (typeof json !== 'object')
       json = JSON.parse(payload);

    if (!json.elements)
        return callback({ message: 'No JSON', status: -1 });

    var children = json.elements;

    var handle = window.requestIdleCallback(function() {
        var results = [];
        var result;
        for (var i = 0; i < children.length; i++) {
            result = parseChild(children[i]);
            if (result) results.push(result);
        }
        callback(null, results);
    });

    _deferred.add(handle);

    function parseChild(child) {
        var parser = jsonparsers[child.type];
        if (!parser) return null;

        var uid;

        uid = osmEntity.id.fromOSM(child.type, child.id);
        if (options.skipSeen) {
            if (_tileCache.seen[uid]) return null;  // avoid reparsing a "seen" entity
            _tileCache.seen[uid] = true;
        }

        return parser(child, uid);
    }
}

var parsers = {
    node: function nodeData(obj, uid) {
        var attrs = obj.attributes;
        return new osmNode({
            id: uid,
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
    },

    note: function parseNote(obj, uid) {
        var attrs = obj.attributes;
        var childNodes = obj.childNodes;
        var props = {};

        props.id = uid;
        props.loc = getLoc(attrs);

        // if notes are coincident, move them apart slightly
        var coincident = false;
        var epsilon = 0.00001;
        do {
            if (coincident) {
                props.loc = geoVecAdd(props.loc, [epsilon, epsilon]);
            }
            var bbox = geoExtent(props.loc).bbox();
            coincident = _noteCache.rtree.search(bbox).length;
        } while (coincident);

        // parse note contents
        for (var i = 0; i < childNodes.length; i++) {
            var node = childNodes[i];
            var nodeName = node.nodeName;
            if (nodeName === '#text') continue;

            // if the element is comments, parse the comments
            if (nodeName === 'comments') {
                props[nodeName] = parseComments(node.childNodes);
            } else {
                props[nodeName] = node.textContent;
            }
        }

        var note = new osmNote(props);
        var item = encodeNoteRtree(note);
        _noteCache.note[note.id] = note;
        _noteCache.rtree.insert(item);

        return note;
    },

    user: function parseUser(obj, uid) {
        var attrs = obj.attributes;
        var user = {
            id: uid,
            display_name: attrs.display_name && attrs.display_name.value,
            account_created: attrs.account_created && attrs.account_created.value,
            changesets_count: '0',
            active_blocks: '0'
        };

        var img = obj.getElementsByTagName('img');
        if (img && img[0] && img[0].getAttribute('href')) {
            user.image_url = img[0].getAttribute('href');
        }

        var changesets = obj.getElementsByTagName('changesets');
        if (changesets && changesets[0] && changesets[0].getAttribute('count')) {
            user.changesets_count = changesets[0].getAttribute('count');
        }

        var blocks = obj.getElementsByTagName('blocks');
        if (blocks && blocks[0]) {
            var received = blocks[0].getElementsByTagName('received');
            if (received && received[0] && received[0].getAttribute('active')) {
                user.active_blocks = received[0].getAttribute('active');
            }
        }

        _userCache.user[uid] = user;
        delete _userCache.toLoad[uid];
        return user;
    }
};


function parseXML(xml, callback, options) {
    options = Object.assign({ skipSeen: true }, options);
    if (!xml || !xml.childNodes) {
        return callback({ message: 'No XML', status: -1 });
    }

    var root = xml.childNodes[0];
    var children = root.childNodes;

    var handle = window.requestIdleCallback(function() {
        var results = [];
        var result;
        for (var i = 0; i < children.length; i++) {
            result = parseChild(children[i]);
            if (result) results.push(result);
        }
        callback(null, results);
    });

    _deferred.add(handle);


    function parseChild(child) {
        var parser = parsers[child.nodeName];
        if (!parser) return null;

        var uid;
        if (child.nodeName === 'user') {
            uid = child.attributes.id.value;
            if (options.skipSeen && _userCache.user[uid]) {
                delete _userCache.toLoad[uid];
                return null;
            }

        } else if (child.nodeName === 'note') {
            uid = child.getElementsByTagName('id')[0].textContent;

        } else {
            uid = osmEntity.id.fromOSM(child.nodeName, child.attributes.id.value);
            if (options.skipSeen) {
                if (_tileCache.seen[uid]) return null;  // avoid reparsing a "seen" entity
                _tileCache.seen[uid] = true;
            }
        }

        return parser(child, uid);
    }
}


// replace or remove note from rtree
function updateRtree(item, replace) {
    _noteCache.rtree.remove(item, function isEql(a, b) { return a.data.id === b.data.id; });

    if (replace) {
        _noteCache.rtree.insert(item);
    }
}


function wrapcb(thisArg, callback, cid) {
    return function(err, result) {
        if (err) {
            // 400 Bad Request, 401 Unauthorized, 403 Forbidden..
            if (err.status === 400 || err.status === 401 || err.status === 403) {
                thisArg.logout();
            }
            return callback.call(thisArg, err);

        } else if (thisArg.getConnectionId() !== cid) {
            return callback.call(thisArg, { message: 'Connection Switched', status: -1 });

        } else {
            return callback.call(thisArg, err, result);
        }
    };
}


export default {

    init: function() {
        utilRebind(this, dispatch, 'on');
    },


    reset: function() {
        Array.from(_deferred).forEach(function(handle) {
            window.cancelIdleCallback(handle);
            _deferred.delete(handle);
        });

        _connectionID++;
        _userChangesets = undefined;
        _userDetails = undefined;
        _rateLimitError = undefined;

        Object.values(_tileCache.inflight).forEach(abortRequest);
        Object.values(_noteCache.inflight).forEach(abortRequest);
        Object.values(_noteCache.inflightPost).forEach(abortRequest);
        if (_changeset.inflight) abortRequest(_changeset.inflight);

        _tileCache = { toLoad: {}, loaded: {}, inflight: {}, seen: {}, rtree: new RBush() };
        _noteCache = { toLoad: {}, loaded: {}, inflight: {}, inflightPost: {}, note: {}, closed: {}, rtree: new RBush() };
        _userCache = { toLoad: {}, user: {} };
        _cachedApiStatus = undefined;
        _changeset = {};

        return this;
    },


    getConnectionId: function() {
        return _connectionID;
    },


    changesetURL: function(changesetID) {
        return urlroot + '/changeset/' + changesetID;
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


    noteURL: function(note) {
        return urlroot + '/note/' + note.id;
    },


    noteReportURL: function(note) {
        return urlroot + '/reports/new?reportable_type=Note&reportable_id=' + note.id;
    },


    // Generic method to load data from the OSM API
    // Can handle either auth or unauth calls.
    loadFromAPI: function(path, callback, options) {
        options = Object.assign({ skipSeen: true }, options);
        var that = this;
        var cid = _connectionID;

        function done(err, payload) {
            if (that.getConnectionId() !== cid) {
                if (callback) callback({ message: 'Connection Switched', status: -1 });
                return;
            }

            var isAuthenticated = that.authenticated();

            // 400 Bad Request, 401 Unauthorized, 403 Forbidden
            // Logout and retry the request..
            if (isAuthenticated && err && err.status &&
                    (err.status === 400 || err.status === 401 || err.status === 403)) {
                that.logout();
                that.loadFromAPI(path, callback, options);

            // else, no retry..
            } else {
                // 509 Bandwidth Limit Exceeded, 429 Too Many Requests
                // Set the rateLimitError flag and trigger a warning..
                if (!isAuthenticated && !_rateLimitError && err && err.status &&
                        (err.status === 509 || err.status === 429)) {
                    _rateLimitError = err;
                    dispatch.call('change');
                    that.reloadApiStatus();

                } else if ((err && _cachedApiStatus === 'online') ||
                    (!err && _cachedApiStatus !== 'online')) {
                    // If the response's error state doesn't match the status,
                    // it's likely we lost or gained the connection so reload the status
                    that.reloadApiStatus();
                }

                if (callback) {
                    if (err) {
                        return callback(err);
                    } else {
                        if (path.indexOf('.json') !== -1) {
                            return parseJSON(payload, callback, options);
                        } else {
                            return parseXML(payload, callback, options);
                        }
                    }
                }
            }
        }

        if (this.authenticated()) {
            return oauth.xhr({ method: 'GET', path: path }, done);
        } else {
            var url = urlroot + path;
            var controller = new AbortController();
            d3_json(url, { signal: controller.signal })
                .then(function(data) {
                    done(null, data);
                })
                .catch(function(err) {
                    if (err.name === 'AbortError') return;
                    // d3-fetch includes status in the error message,
                    // but we can't access the response itself
                    // https://github.com/d3/d3-fetch/issues/27
                    var match = err.message.match(/^\d{3}/);
                    if (match) {
                        done({ status: +match[0], statusText: err.message });
                    } else {
                        done(err.message);
                    }
                });
            return controller;
        }
    },


    // Load a single entity by id (ways and relations use the `/full` call)
    // GET /api/0.6/node/#id
    // GET /api/0.6/[way|relation]/#id/full
    loadEntity: function(id, callback) {
        var type = osmEntity.id.type(id);
        var osmID = osmEntity.id.toOSM(id);
        var options = { skipSeen: false };

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + (type !== 'node' ? '/full' : '') + '.json',
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            },
            options
        );
    },


    // Load a single entity with a specific version
    // GET /api/0.6/[node|way|relation]/#id/#version
    loadEntityVersion: function(id, version, callback) {
        var type = osmEntity.id.type(id);
        var osmID = osmEntity.id.toOSM(id);
        var options = { skipSeen: false };

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + '/' + version + '.json',
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            },
            options
        );
    },


    // Load multiple entities in chunks
    // (note: callback may be called multiple times)
    // Unlike `loadEntity`, child nodes and members are not fetched
    // GET /api/0.6/[nodes|ways|relations]?#parameters
    loadMultiple: function(ids, callback) {
        var that = this;
        var groups = utilArrayGroupBy(utilArrayUniq(ids), osmEntity.id.type);

        Object.keys(groups).forEach(function(k) {
            var type = k + 's';   // nodes, ways, relations
            var osmIDs = groups[k].map(function(id) { return osmEntity.id.toOSM(id); });
            var options = { skipSeen: false };

            utilArrayChunk(osmIDs, 150).forEach(function(arr) {
                that.loadFromAPI(
                    '/api/0.6/' + type + '.json?' + type + '=' + arr.join(),
                    function(err, entities) {
                        if (callback) callback(err, { data: entities });
                    },
                    options
                );
            });
        });
    },


    // Create, upload, and close a changeset
    // PUT /api/0.6/changeset/create
    // POST /api/0.6/changeset/#id/upload
    // PUT /api/0.6/changeset/#id/close
    putChangeset: function(changeset, changes, callback) {
        var cid = _connectionID;

        if (_changeset.inflight) {
            return callback({ message: 'Changeset already inflight', status: -2 }, changeset);

        } else if (_changeset.open) {   // reuse existing open changeset..
            return createdChangeset.call(this, null, _changeset.open);

        } else {   // Open a new changeset..
            var options = {
                method: 'PUT',
                path: '/api/0.6/changeset/create',
                options: { header: { 'Content-Type': 'text/xml' } },
                content: JXON.stringify(changeset.asJXON())
            };
            _changeset.inflight = oauth.xhr(
                options,
                wrapcb(this, createdChangeset, cid)
            );
        }


        function createdChangeset(err, changesetID) {
            _changeset.inflight = null;
            if (err) { return callback(err, changeset); }

            _changeset.open = changesetID;
            changeset = changeset.update({ id: changesetID });

            // Upload the changeset..
            var options = {
                method: 'POST',
                path: '/api/0.6/changeset/' + changesetID + '/upload',
                options: { header: { 'Content-Type': 'text/xml' } },
                content: JXON.stringify(changeset.osmChangeJXON(changes))
            };
            _changeset.inflight = oauth.xhr(
                options,
                wrapcb(this, uploadedChangeset, cid)
            );
        }


        function uploadedChangeset(err) {
            _changeset.inflight = null;
            if (err) return callback(err, changeset);

            // Upload was successful, safe to call the callback.
            // Add delay to allow for postgres replication #1646 #2678
            window.setTimeout(function() { callback(null, changeset); }, 2500);
            _changeset.open = null;

            // At this point, we don't really care if the connection was switched..
            // Only try to close the changeset if we're still talking to the same server.
            if (this.getConnectionId() === cid) {
                // Still attempt to close changeset, but ignore response because #2667
                oauth.xhr({
                    method: 'PUT',
                    path: '/api/0.6/changeset/' + changeset.id + '/close',
                    options: { header: { 'Content-Type': 'text/xml' } }
                }, function() { return true; });
            }
        }
    },


    // Load multiple users in chunks
    // (note: callback may be called multiple times)
    // GET /api/0.6/users?users=#id1,#id2,...,#idn
    loadUsers: function(uids, callback) {
        var toLoad = [];
        var cached = [];

        utilArrayUniq(uids).forEach(function(uid) {
            if (_userCache.user[uid]) {
                delete _userCache.toLoad[uid];
                cached.push(_userCache.user[uid]);
            } else {
                toLoad.push(uid);
            }
        });

        if (cached.length || !this.authenticated()) {
            callback(undefined, cached);
            if (!this.authenticated()) return;  // require auth
        }

        utilArrayChunk(toLoad, 150).forEach(function(arr) {
            oauth.xhr(
                { method: 'GET', path: '/api/0.6/users?users=' + arr.join() },
                wrapcb(this, done, _connectionID)
            );
        }.bind(this));

        function done(err, xml) {
            if (err) { return callback(err); }

            var options = { skipSeen: true };
            return parseXML(xml, function(err, results) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(undefined, results);
                }
            }, options);
        }
    },


    // Load a given user by id
    // GET /api/0.6/user/#id
    loadUser: function(uid, callback) {
        if (_userCache.user[uid] || !this.authenticated()) {   // require auth
            delete _userCache.toLoad[uid];
            return callback(undefined, _userCache.user[uid]);
        }

        oauth.xhr(
            { method: 'GET', path: '/api/0.6/user/' + uid },
            wrapcb(this, done, _connectionID)
        );

        function done(err, xml) {
            if (err) { return callback(err); }

            var options = { skipSeen: true };
            return parseXML(xml, function(err, results) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(undefined, results[0]);
                }
            }, options);
        }
    },


    // Load the details of the logged-in user
    // GET /api/0.6/user/details
    userDetails: function(callback) {
        if (_userDetails) {    // retrieve cached
            return callback(undefined, _userDetails);
        }

        oauth.xhr(
            { method: 'GET', path: '/api/0.6/user/details' },
            wrapcb(this, done, _connectionID)
        );

        function done(err, xml) {
            if (err) { return callback(err); }

            var options = { skipSeen: false };
            return parseXML(xml, function(err, results) {
                if (err) {
                    return callback(err);
                } else {
                    _userDetails = results[0];
                    return callback(undefined, _userDetails);
                }
            }, options);
        }
    },


    // Load previous changesets for the logged in user
    // GET /api/0.6/changesets?user=#id
    userChangesets: function(callback) {
        if (_userChangesets) {    // retrieve cached
            return callback(undefined, _userChangesets);
        }

        this.userDetails(
            wrapcb(this, gotDetails, _connectionID)
        );


        function gotDetails(err, user) {
            if (err) { return callback(err); }

            oauth.xhr(
                { method: 'GET', path: '/api/0.6/changesets?user=' + user.id },
                wrapcb(this, done, _connectionID)
            );
        }

        function done(err, xml) {
            if (err) { return callback(err); }

            _userChangesets = Array.prototype.map.call(
                xml.getElementsByTagName('changeset'),
                function (changeset) { return { tags: getTags(changeset) }; }
            ).filter(function (changeset) {
                var comment = changeset.tags.comment;
                return comment && comment !== '';
            });

            return callback(undefined, _userChangesets);
        }
    },


    // Fetch the status of the OSM API
    // GET /api/capabilities
    status: function(callback) {
        var url = urlroot + '/api/capabilities';
        var errback = wrapcb(this, done, _connectionID);
        d3_xml(url)
            .then(function(data) { errback(null, data); })
            .catch(function(err) { errback(err.message); });

        function done(err, xml) {
            if (err) {
                // the status is null if no response could be retrieved
                return callback(err, null);
            }

            // update blocklists
            var elements = xml.getElementsByTagName('blacklist');
            var regexes = [];
            for (var i = 0; i < elements.length; i++) {
                var regexString = elements[i].getAttribute('regex');  // needs unencode?
                if (regexString) {
                    try {
                        var regex = new RegExp(regexString);
                        regexes.push(regex);
                    } catch (e) {
                        /* noop */
                    }
                }
            }
            if (regexes.length) {
                _imageryBlocklists = regexes;
            }

            if (_rateLimitError) {
                return callback(_rateLimitError, 'rateLimited');
            } else {
                var waynodes = xml.getElementsByTagName('waynodes');
                var maxWayNodes = waynodes.length && parseInt(waynodes[0].getAttribute('maximum'), 10);
                if (maxWayNodes && isFinite(maxWayNodes)) _maxWayNodes = maxWayNodes;

                var apiStatus = xml.getElementsByTagName('status');
                var val = apiStatus[0].getAttribute('api');
                return callback(undefined, val);
            }
        }
    },

    // Calls `status` and dispatches an `apiStatusChange` event if the returned
    // status differs from the cached status.
    reloadApiStatus: function() {
        // throttle to avoid unnecessary API calls
        if (!this.throttledReloadApiStatus) {
            var that = this;
            this.throttledReloadApiStatus = _throttle(function() {
                that.status(function(err, status) {
                    if (status !== _cachedApiStatus) {
                        _cachedApiStatus = status;
                        dispatch.call('apiStatusChange', that, err, status);
                    }
                });
            }, 500);
        }
        this.throttledReloadApiStatus();
    },


    // Returns the maximum number of nodes a single way can have
    maxWayNodes: function() {
        return _maxWayNodes;
    },


    // Load data (entities) from the API in tiles
    // GET /api/0.6/map?bbox=
    loadTiles: function(projection, callback) {
        if (_off) return;

        // determine the needed tiles to cover the view
        var tiles = tiler.zoomExtent([_tileZoom, _tileZoom]).getTiles(projection);

        // abort inflight requests that are no longer needed
        var hadRequests = hasInflightRequests(_tileCache);
        abortUnwantedRequests(_tileCache, tiles);
        if (hadRequests && !hasInflightRequests(_tileCache)) {
            dispatch.call('loaded');    // stop the spinner
        }

        // issue new requests..
        tiles.forEach(function(tile) {
            this.loadTile(tile, callback);
        }, this);
    },


    // Load a single data tile
    // GET /api/0.6/map?bbox=
    loadTile: function(tile, callback) {
        if (_off) return;
        if (_tileCache.loaded[tile.id] || _tileCache.inflight[tile.id]) return;

        if (!hasInflightRequests(_tileCache)) {
            dispatch.call('loading');   // start the spinner
        }

        var path = '/api/0.6/map.json?bbox=';
        var options = { skipSeen: true };

        _tileCache.inflight[tile.id] = this.loadFromAPI(
            path + tile.extent.toParam(),
            tileCallback,
            options
        );

        function tileCallback(err, parsed) {
            delete _tileCache.inflight[tile.id];
            if (!err) {
                delete _tileCache.toLoad[tile.id];
                _tileCache.loaded[tile.id] = true;
                var bbox = tile.extent.bbox();
                bbox.id = tile.id;
                _tileCache.rtree.insert(bbox);
            }
            if (callback) {
                callback(err, Object.assign({ data: parsed }, tile));
            }
            if (!hasInflightRequests(_tileCache)) {
                dispatch.call('loaded');     // stop the spinner
            }
        }
    },


    isDataLoaded: function(loc) {
        var bbox = { minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1] };
        return _tileCache.rtree.collides(bbox);
    },


    // load the tile that covers the given `loc`
    loadTileAtLoc: function(loc, callback) {
        // Back off if the toLoad queue is filling up.. re #6417
        // (Currently `loadTileAtLoc` requests are considered low priority - used by operations to
        // let users safely edit geometries which extend to unloaded tiles.  We can drop some.)
        if (Object.keys(_tileCache.toLoad).length > 50) return;

        var k = geoZoomToScale(_tileZoom + 1);
        var offset = geoRawMercator().scale(k)(loc);
        var projection = geoRawMercator().transform({ k: k, x: -offset[0], y: -offset[1] });
        var tiles = tiler.zoomExtent([_tileZoom, _tileZoom]).getTiles(projection);

        tiles.forEach(function(tile) {
            if (_tileCache.toLoad[tile.id] || _tileCache.loaded[tile.id] || _tileCache.inflight[tile.id]) return;

            _tileCache.toLoad[tile.id] = true;
            this.loadTile(tile, callback);
        }, this);
    },


    // Load notes from the API in tiles
    // GET /api/0.6/notes?bbox=
    loadNotes: function(projection, noteOptions) {
        noteOptions = Object.assign({ limit: 10000, closed: 7 }, noteOptions);
        if (_off) return;

        var that = this;
        var path = '/api/0.6/notes?limit=' + noteOptions.limit + '&closed=' + noteOptions.closed + '&bbox=';
        var throttleLoadUsers = _throttle(function() {
            var uids = Object.keys(_userCache.toLoad);
            if (!uids.length) return;
            that.loadUsers(uids, function() {});  // eagerly load user details
        }, 750);

        // determine the needed tiles to cover the view
        var tiles = tiler.zoomExtent([_noteZoom, _noteZoom]).getTiles(projection);

        // abort inflight requests that are no longer needed
        abortUnwantedRequests(_noteCache, tiles);

        // issue new requests..
        tiles.forEach(function(tile) {
            if (_noteCache.loaded[tile.id] || _noteCache.inflight[tile.id]) return;

            var options = { skipSeen: false };
            _noteCache.inflight[tile.id] = that.loadFromAPI(
                path + tile.extent.toParam(),
                function(err) {
                    delete _noteCache.inflight[tile.id];
                    if (!err) {
                        _noteCache.loaded[tile.id] = true;
                    }
                    throttleLoadUsers();
                    dispatch.call('loadedNotes');
                },
                options
            );
        });
    },


    // Create a note
    // POST /api/0.6/notes?params
    postNoteCreate: function(note, callback) {
        if (!this.authenticated()) {
            return callback({ message: 'Not Authenticated', status: -3 }, note);
        }
        if (_noteCache.inflightPost[note.id]) {
            return callback({ message: 'Note update already inflight', status: -2 }, note);
        }

        if (!note.loc[0] || !note.loc[1] || !note.newComment) return; // location & description required

        var comment = note.newComment;
        if (note.newCategory && note.newCategory !== 'None') { comment += ' #' + note.newCategory; }

        var path = '/api/0.6/notes?' + utilQsString({ lon: note.loc[0], lat: note.loc[1], text: comment });

        _noteCache.inflightPost[note.id] = oauth.xhr(
            { method: 'POST', path: path },
            wrapcb(this, done, _connectionID)
        );


        function done(err, xml) {
            delete _noteCache.inflightPost[note.id];
            if (err) { return callback(err); }

            // we get the updated note back, remove from caches and reparse..
            this.removeNote(note);

            var options = { skipSeen: false };
            return parseXML(xml, function(err, results) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(undefined, results[0]);
                }
            }, options);
        }
    },


    // Update a note
    // POST /api/0.6/notes/#id/comment?text=comment
    // POST /api/0.6/notes/#id/close?text=comment
    // POST /api/0.6/notes/#id/reopen?text=comment
    postNoteUpdate: function(note, newStatus, callback) {
        if (!this.authenticated()) {
            return callback({ message: 'Not Authenticated', status: -3 }, note);
        }
        if (_noteCache.inflightPost[note.id]) {
            return callback({ message: 'Note update already inflight', status: -2 }, note);
        }

        var action;
        if (note.status !== 'closed' && newStatus === 'closed') {
            action = 'close';
        } else if (note.status !== 'open' && newStatus === 'open') {
            action = 'reopen';
        } else {
            action = 'comment';
            if (!note.newComment) return; // when commenting, comment required
        }

        var path = '/api/0.6/notes/' + note.id + '/' + action;
        if (note.newComment) {
            path += '?' + utilQsString({ text: note.newComment });
        }

        _noteCache.inflightPost[note.id] = oauth.xhr(
            { method: 'POST', path: path },
            wrapcb(this, done, _connectionID)
        );


        function done(err, xml) {
            delete _noteCache.inflightPost[note.id];
            if (err) { return callback(err); }

            // we get the updated note back, remove from caches and reparse..
            this.removeNote(note);

            // update closed note cache - used to populate `closed:note` changeset tag
            if (action === 'close') {
                _noteCache.closed[note.id] = true;
            } else if (action === 'reopen') {
                delete _noteCache.closed[note.id];
            }

            var options = { skipSeen: false };
            return parseXML(xml, function(err, results) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(undefined, results[0]);
                }
            }, options);
        }
    },


    switch: function(options) {
        urlroot = options.urlroot;

        oauth.options(Object.assign({
            url: urlroot,
            loading: authLoading,
            done: authDone
        }, options));

        this.reset();
        this.userChangesets(function() {});  // eagerly load user details/changesets
        dispatch.call('change');
        return this;
    },


    toggle: function(val) {
        _off = !val;
        return this;
    },


    isChangesetInflight: function() {
        return !!_changeset.inflight;
    },


    // get/set cached data
    // This is used to save/restore the state when entering/exiting the walkthrough
    // Also used for testing purposes.
    caches: function(obj) {
        function cloneCache(source) {
            var target = {};
            Object.keys(source).forEach(function(k) {
                if (k === 'rtree') {
                    target.rtree = new RBush().fromJSON(source.rtree.toJSON());  // clone rbush
                } else if (k === 'note') {
                    target.note = {};
                    Object.keys(source.note).forEach(function(id) {
                        target.note[id] = osmNote(source.note[id]);   // copy notes
                    });
                } else {
                    target[k] = JSON.parse(JSON.stringify(source[k]));   // clone deep
                }
            });
            return target;
        }

        if (!arguments.length) {
            return {
                tile: cloneCache(_tileCache),
                note: cloneCache(_noteCache),
                user: cloneCache(_userCache)
            };
        }

        // access caches directly for testing (e.g., loading notes rtree)
        if (obj === 'get') {
            return {
                tile: _tileCache,
                note: _noteCache,
                user: _userCache
            };
        }

        if (obj.tile) {
            _tileCache = obj.tile;
            _tileCache.inflight = {};
        }
        if (obj.note) {
            _noteCache = obj.note;
            _noteCache.inflight = {};
            _noteCache.inflightPost = {};
        }
        if (obj.user) {
            _userCache = obj.user;
        }

        return this;
    },


    logout: function() {
        _userChangesets = undefined;
        _userDetails = undefined;
        oauth.logout();
        dispatch.call('change');
        return this;
    },


    authenticated: function() {
        return oauth.authenticated();
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
    },


    imageryBlocklists: function() {
        return _imageryBlocklists;
    },


    tileZoom: function(val) {
        if (!arguments.length) return _tileZoom;
        _tileZoom = val;
        return this;
    },


    // get all cached notes covering the viewport
    notes: function(projection) {
        var viewport = projection.clipExtent();
        var min = [viewport[0][0], viewport[1][1]];
        var max = [viewport[1][0], viewport[0][1]];
        var bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();

        return _noteCache.rtree.search(bbox)
            .map(function(d) { return d.data; });
    },


    // get a single note from the cache
    getNote: function(id) {
        return _noteCache.note[id];
    },


    // remove a single note from the cache
    removeNote: function(note) {
        if (!(note instanceof osmNote) || !note.id) return;

        delete _noteCache.note[note.id];
        updateRtree(encodeNoteRtree(note), false);  // false = remove
    },


    // replace a single note in the cache
    replaceNote: function(note) {
        if (!(note instanceof osmNote) || !note.id) return;

        _noteCache.note[note.id] = note;
        updateRtree(encodeNoteRtree(note), true);  // true = replace
        return note;
    },


    // Get an array of note IDs closed during this session.
    // Used to populate `closed:note` changeset tag
    getClosedIDs: function() {
        return Object.keys(_noteCache.closed).sort();
    }

};
