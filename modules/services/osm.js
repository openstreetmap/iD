import * as d3 from 'd3';
import _ from 'lodash';
import osmAuth from 'osm-auth';
import { JXON } from '../util/jxon';
import { d3geoTile } from '../lib/d3.geo.tile';
import { geoExtent } from '../geo';
import {
    osmEntity,
    osmNode,
    osmRelation,
    osmWay
} from '../osm';

import { utilRebind } from '../util';


var dispatch = d3.dispatch('authLoading', 'authDone', 'change', 'loading', 'loaded'),
    urlroot = 'https://www.openstreetmap.org',
    blacklists = ['.*\.google(apis)?\..*/(vt|kh)[\?/].*([xyz]=.*){3}.*'],
    inflight = {},
    loadedTiles = {},
    tileZoom = 16,
    oauth = osmAuth({
        url: urlroot,
        oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
        oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
        loading: authLoading,
        done: authDone
    }),
    rateLimitError,
    userChangesets,
    userDetails,
    off;


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
    var lon = attrs.lon && attrs.lon.value,
        lat = attrs.lat && attrs.lat.value;
    return [parseFloat(lon), parseFloat(lat)];
}


function getNodes(obj) {
    var elems = obj.getElementsByTagName('nd'),
        nodes = new Array(elems.length);
    for (var i = 0, l = elems.length; i < l; i++) {
        nodes[i] = 'n' + elems[i].attributes.ref.value;
    }
    return nodes;
}


function getTags(obj) {
    var elems = obj.getElementsByTagName('tag'),
        tags = {};
    for (var i = 0, l = elems.length; i < l; i++) {
        var attrs = elems[i].attributes;
        tags[attrs.k.value] = attrs.v.value;
    }

    return tags;
}


function getMembers(obj) {
    var elems = obj.getElementsByTagName('member'),
        members = new Array(elems.length);
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
    node: function nodeData(obj) {
        var attrs = obj.attributes;
        return new osmNode({
            id: osmEntity.id.fromOSM('node', attrs.id.value),
            loc: getLoc(attrs),
            version: attrs.version.value,
            user: attrs.user && attrs.user.value,
            tags: getTags(obj),
            visible: getVisible(attrs)
        });
    },

    way: function wayData(obj) {
        var attrs = obj.attributes;
        return new osmWay({
            id: osmEntity.id.fromOSM('way', attrs.id.value),
            version: attrs.version.value,
            user: attrs.user && attrs.user.value,
            tags: getTags(obj),
            nodes: getNodes(obj),
            visible: getVisible(attrs)
        });
    },

    relation: function relationData(obj) {
        var attrs = obj.attributes;
        return new osmRelation({
            id: osmEntity.id.fromOSM('relation', attrs.id.value),
            version: attrs.version.value,
            user: attrs.user && attrs.user.value,
            tags: getTags(obj),
            members: getMembers(obj),
            visible: getVisible(attrs)
        });
    }
};


function parse(xml) {
    if (!xml || !xml.childNodes) return;

    var root = xml.childNodes[0],
        children = root.childNodes,
        entities = [];

    for (var i = 0, l = children.length; i < l; i++) {
        var child = children[i],
            parser = parsers[child.nodeName];
        if (parser) {
            entities.push(parser(child));
        }
    }

    return entities;
}


export default {

    init: function() {
        utilRebind(this, dispatch, 'on');
    },


    reset: function() {
        userChangesets = undefined;
        userDetails = undefined;
        rateLimitError = undefined;
        _.forEach(inflight, abortRequest);
        loadedTiles = {};
        inflight = {};
        return this;
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


    userURL: function(username) {
        return urlroot + '/user/' + username;
    },


    loadFromAPI: function(path, callback) {
        var that = this;

        function done(err, xml) {
            var isAuthenticated = that.authenticated();

            // 400 Bad Request, 401 Unauthorized, 403 Forbidden
            // Logout and retry the request..
            if (isAuthenticated && err &&
                    (err.status === 400 || err.status === 401 || err.status === 403)) {
                that.logout();
                that.loadFromAPI(path, callback);

            // else, no retry..
            } else {
                // 509 Bandwidth Limit Exceeded, 429 Too Many Requests
                // Set the rateLimitError flag and trigger a warning..
                if (!isAuthenticated && !rateLimitError && err &&
                        (err.status === 509 || err.status === 429)) {
                    rateLimitError = err;
                    dispatch.call('change');
                }

                if (callback) {
                    callback(err, parse(xml));
                }
            }
        }

        if (this.authenticated()) {
            return oauth.xhr({ method: 'GET', path: path }, done);
        } else {
            var url = urlroot + path;
            return d3.xml(url).get(done);
        }
    },


    loadEntity: function(id, callback) {
        var type = osmEntity.id.type(id),
            osmID = osmEntity.id.toOSM(id);

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + (type !== 'node' ? '/full' : ''),
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            }
        );
    },


    loadEntityVersion: function(id, version, callback) {
        var type = osmEntity.id.type(id),
            osmID = osmEntity.id.toOSM(id);

        this.loadFromAPI(
            '/api/0.6/' + type + '/' + osmID + '/' + version,
            function(err, entities) {
                if (callback) callback(err, { data: entities });
            }
        );
    },


    loadMultiple: function(ids, callback) {
        var that = this;
        _.each(_.groupBy(_.uniq(ids), osmEntity.id.type), function(v, k) {
            var type = k + 's',
                osmIDs = _.map(v, osmEntity.id.toOSM);

            _.each(_.chunk(osmIDs, 150), function(arr) {
                that.loadFromAPI(
                    '/api/0.6/' + type + '?' + type + '=' + arr.join(),
                    function(err, entities) {
                        if (callback) callback(err, { data: entities });
                    }
                );
            });
        });
    },


    authenticated: function() {
        return oauth.authenticated();
    },


    putChangeset: function(changeset, changes, callback) {

        // Create the changeset..
        oauth.xhr({
            method: 'PUT',
            path: '/api/0.6/changeset/create',
            options: { header: { 'Content-Type': 'text/xml' } },
            content: JXON.stringify(changeset.asJXON())
        }, createdChangeset);


        function createdChangeset(err, changeset_id) {
            if (err) return callback(err);
            changeset = changeset.update({ id: changeset_id });

            // Upload the changeset..
            oauth.xhr({
                method: 'POST',
                path: '/api/0.6/changeset/' + changeset_id + '/upload',
                options: { header: { 'Content-Type': 'text/xml' } },
                content: JXON.stringify(changeset.osmChangeJXON(changes))
            }, uploadedChangeset);
        }


        function uploadedChangeset(err) {
            if (err) return callback(err);

            // Upload was successful, safe to call the callback.
            // Add delay to allow for postgres replication #1646 #2678
            window.setTimeout(function() {
                callback(null, changeset);
            }, 2500);

            // Still attempt to close changeset, but ignore response because #2667
            oauth.xhr({
                method: 'PUT',
                path: '/api/0.6/changeset/' + changeset.id + '/close',
                options: { header: { 'Content-Type': 'text/xml' } }
            }, function() { return true; });
        }
    },


    userDetails: function(callback) {
        if (userDetails) {
            callback(undefined, userDetails);
            return;
        }

        function done(err, user_details) {
            if (err) return callback(err);

            var u = user_details.getElementsByTagName('user')[0],
                img = u.getElementsByTagName('img'),
                image_url = '';

            if (img && img[0] && img[0].getAttribute('href')) {
                image_url = img[0].getAttribute('href');
            }

            userDetails = {
                display_name: u.attributes.display_name.value,
                image_url: image_url,
                id: u.attributes.id.value
            };

            callback(undefined, userDetails);
        }

        oauth.xhr({ method: 'GET', path: '/api/0.6/user/details' }, done);
    },


    userChangesets: function(callback) {
        if (userChangesets) {
            callback(undefined, userChangesets);
            return;
        }

        this.userDetails(function(err, user) {
            if (err) {
                callback(err);
                return;
            }

            function done(err, changesets) {
                if (err) {
                    callback(err);
                } else {
                    userChangesets = Array.prototype.map.call(
                        changesets.getElementsByTagName('changeset'),
                        function (changeset) {
                            return { tags: getTags(changeset) };
                        }
                    ).filter(function (changeset) {
                        var comment = changeset.tags.comment;
                        return comment && comment !== '';
                    });
                    callback(undefined, userChangesets);
                }
            }

            oauth.xhr({ method: 'GET', path: '/api/0.6/changesets?user=' + user.id }, done);
        });
    },


    status: function(callback) {
        function done(xml) {
            // update blacklists
            var elements = xml.getElementsByTagName('blacklist'),
                regexes = [];
            for (var i = 0; i < elements.length; i++) {
                var regex = elements[i].getAttribute('regex');  // needs unencode?
                if (regex) {
                    regexes.push(regex);
                }
            }
            if (regexes.length) {
                blacklists = regexes;
            }


            if (rateLimitError) {
                callback(rateLimitError, 'rateLimited');
            } else {
                var apiStatus = xml.getElementsByTagName('status'),
                    val = apiStatus[0].getAttribute('api');

                callback(undefined, val);
            }
        }

        d3.xml(urlroot + '/api/capabilities').get()
            .on('load', done)
            .on('error', callback);
    },


    imageryBlacklists: function() {
        return blacklists;
    },


    tileZoom: function(_) {
        if (!arguments.length) return tileZoom;
        tileZoom = _;
        return this;
    },


    loadTiles: function(projection, dimensions, callback) {
        if (off) return;

        var that = this,
            s = projection.scale() * 2 * Math.PI,
            z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
            ts = 256 * Math.pow(2, z - tileZoom),
            origin = [
                s / 2 - projection.translate()[0],
                s / 2 - projection.translate()[1]
            ];

        var tiles = d3geoTile()
            .scaleExtent([tileZoom, tileZoom])
            .scale(s)
            .size(dimensions)
            .translate(projection.translate())()
            .map(function(tile) {
                var x = tile[0] * ts - origin[0],
                    y = tile[1] * ts - origin[1];

                return {
                    id: tile.toString(),
                    extent: geoExtent(
                        projection.invert([x, y + ts]),
                        projection.invert([x + ts, y]))
                };
            });

        _.filter(inflight, function(v, i) {
            var wanted = _.find(tiles, function(tile) {
                return i === tile.id;
            });
            if (!wanted) delete inflight[i];
            return !wanted;
        }).map(abortRequest);

        tiles.forEach(function(tile) {
            var id = tile.id;

            if (loadedTiles[id] || inflight[id]) return;

            if (_.isEmpty(inflight)) {
                dispatch.call('loading');
            }

            inflight[id] = that.loadFromAPI(
                '/api/0.6/map?bbox=' + tile.extent.toParam(),
                function(err, parsed) {
                    delete inflight[id];
                    if (!err) {
                        loadedTiles[id] = true;
                    }

                    if (callback) {
                        callback(err, _.extend({ data: parsed }, tile));
                    }

                    if (_.isEmpty(inflight)) {
                        dispatch.call('loaded');
                    }
                }
            );
        });
    },


    switch: function(options) {
        urlroot = options.urlroot;

        oauth.options(_.extend({
            url: urlroot,
            loading: authLoading,
            done: authDone
        }, options));

        dispatch.call('change');
        this.reset();
        this.userChangesets(function() {});  // eagerly load user details/changesets
        return this;
    },


    toggle: function(_) {
        off = !_;
        return this;
    },


    loadedTiles: function(_) {
        if (!arguments.length) return loadedTiles;
        loadedTiles = _;
        return this;
    },


    logout: function() {
        userChangesets = undefined;
        userDetails = undefined;
        oauth.logout();
        dispatch.call('change');
        return this;
    },


    authenticate: function(callback) {
        var that = this;
        userChangesets = undefined;
        userDetails = undefined;

        function done(err, res) {
            rateLimitError = undefined;
            dispatch.call('change');
            if (callback) callback(err, res);
            that.userChangesets(function() {});  // eagerly load user details/changesets
        }

        return oauth.authenticate(done);
    }
};
