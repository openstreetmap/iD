import * as d3 from 'd3';
import _ from 'lodash';
import osmAuth from 'osm-auth';
import { JXON } from '../util/jxon';
import { d3geoTile } from '../lib/d3.geo.tile';
import { geoExtent } from '../geo/index';
import { osmEntity, osmNode, osmRelation, osmWay } from '../osm/index';
import { utilDetect } from '../util/detect';
import { utilRebind } from '../util/rebind';
import { utilFunctor } from '../util/index';


var dispatch = d3.dispatch('authenticating', 'authenticated', 'auth', 'loading', 'loaded'),
    useHttps = window.location.protocol === 'https:',
    protocol = useHttps ? 'https:' : 'http:',
    url = protocol + '//www.openstreetmap.org',
    inflight = {},
    loadedTiles = {},
    tileZoom = 16,
    oauth = osmAuth({
        url: protocol + '//www.openstreetmap.org',
        oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
        oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
        loading: authenticating,
        done: authenticated
    }),
    userDetails,
    off;


function authenticating() {
    dispatch.call('authenticating');
}


function authenticated() {
    dispatch.call('authenticated');
}


function abortRequest(i) {
    i.abort();
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


function parse(dom) {
    if (!dom || !dom.childNodes) return;

    var root = dom.childNodes[0],
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
        this.event = utilRebind(this, dispatch, 'on');
    },


    reset: function() {
        userDetails = undefined;
        _.forEach(inflight, abortRequest);
        loadedTiles = {};
        inflight = {};
        return this;
    },


    changesetURL: function(changesetId) {
        return url + '/changeset/' + changesetId;
    },


    changesetsURL: function(center, zoom) {
        var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        return url + '/history#map=' +
            Math.floor(zoom) + '/' +
            center[1].toFixed(precision) + '/' +
            center[0].toFixed(precision);
    },


    entityURL: function(entity) {
        return url + '/' + entity.type + '/' + entity.osmId();
    },


    userURL: function(username) {
        return url + '/user/' + username;
    },


    loadFromURL: function(url, callback) {
        function done(err, dom) {
            return callback(err, parse(dom));
        }
        return d3.xml(url).get(done);
    },


    loadEntity: function(id, callback) {
        var type = osmEntity.id.type(id),
            osmID = osmEntity.id.toOSM(id);

        this.loadFromURL(
            url + '/api/0.6/' + type + '/' + osmID + (type !== 'node' ? '/full' : ''),
            function(err, entities) {
                if (callback) callback(err, {data: entities});
            });
    },


    loadEntityVersion: function(id, version, callback) {
        var type = osmEntity.id.type(id),
            osmID = osmEntity.id.toOSM(id);

        this.loadFromURL(
            url + '/api/0.6/' + type + '/' + osmID + '/' + version,
            function(err, entities) {
                if (callback) callback(err, {data: entities});
            });
    },


    loadMultiple: function(ids, callback) {
        var that = this;
        _.each(_.groupBy(_.uniq(ids), osmEntity.id.type), function(v, k) {
            var type = k + 's',
                osmIDs = _.map(v, osmEntity.id.toOSM);

            _.each(_.chunk(osmIDs, 150), function(arr) {
                that.loadFromURL(
                    url + '/api/0.6/' + type + '?' + type + '=' + arr.join(),
                    function(err, entities) {
                        if (callback) callback(err, {data: entities});
                    });
            });
        });
    },


    authenticated: function() {
        return oauth.authenticated();
    },


    // Generate Changeset XML. Returns a string.
    changesetJXON: function(tags) {
        return {
            osm: {
                changeset: {
                    tag: _.map(tags, function(value, key) {
                        return { '@k': key, '@v': value };
                    }),
                    '@version': 0.6,
                    '@generator': 'iD'
                }
            }
        };
    },


    // Generate [osmChange](http://wiki.openstreetmap.org/wiki/OsmChange)
    // XML. Returns a string.
    osmChangeJXON: function(changeset_id, changes) {
        function nest(x, order) {
            var groups = {};
            for (var i = 0; i < x.length; i++) {
                var tagName = Object.keys(x[i])[0];
                if (!groups[tagName]) groups[tagName] = [];
                groups[tagName].push(x[i][tagName]);
            }
            var ordered = {};
            order.forEach(function(o) {
                if (groups[o]) ordered[o] = groups[o];
            });
            return ordered;
        }

        function rep(entity) {
            return entity.asJXON(changeset_id);
        }

        return {
            osmChange: {
                '@version': 0.6,
                '@generator': 'iD',
                'create': nest(changes.created.map(rep), ['node', 'way', 'relation']),
                'modify': nest(changes.modified.map(rep), ['node', 'way', 'relation']),
                'delete': _.extend(nest(changes.deleted.map(rep), ['relation', 'way', 'node']), {'@if-unused': true})
            }
        };
    },


    changesetTags: function(version, comment, imageryUsed) {
        var detected = utilDetect(),
            tags = {
                created_by: ('iD ' + version).substr(0, 255),
                imagery_used: imageryUsed.join(';').substr(0, 255),
                host: detected.host.substr(0, 255),
                locale: detected.locale.substr(0, 255)
            };

        if (comment) {
            tags.comment = comment.substr(0, 255);
        }

        return tags;
    },


    putChangeset: function(changes, version, comment, imageryUsed, callback) {
        var that = this;
        oauth.xhr({
                method: 'PUT',
                path: '/api/0.6/changeset/create',
                options: { header: { 'Content-Type': 'text/xml' } },
                content: JXON.stringify(that.changesetJXON(that.changesetTags(version, comment, imageryUsed)))
            }, function(err, changeset_id) {
                if (err) return callback(err);
                oauth.xhr({
                    method: 'POST',
                    path: '/api/0.6/changeset/' + changeset_id + '/upload',
                    options: { header: { 'Content-Type': 'text/xml' } },
                    content: JXON.stringify(that.osmChangeJXON(changeset_id, changes))
                }, function(err) {
                    if (err) return callback(err);
                    // POST was successful, safe to call the callback.
                    // Still attempt to close changeset, but ignore response because #2667
                    // Add delay to allow for postgres replication #1646 #2678
                    window.setTimeout(function() { callback(null, changeset_id); }, 2500);
                    oauth.xhr({
                        method: 'PUT',
                        path: '/api/0.6/changeset/' + changeset_id + '/close',
                        options: { header: { 'Content-Type': 'text/xml' } }
                    }, utilFunctor(true));
                });
            });
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
        this.userDetails(function(err, user) {
            if (err) return callback(err);

            function done(changesets) {
                callback(undefined, Array.prototype.map.call(changesets.getElementsByTagName('changeset'),
                    function (changeset) {
                        return { tags: getTags(changeset) };
                    }));
            }

            d3.xml(url + '/api/0.6/changesets?user=' + user.id).get()
                .on('load', done)
                .on('error', callback);
        });
    },


    status: function(callback) {
        function done(capabilities) {
            var apiStatus = capabilities.getElementsByTagName('status');
            callback(undefined, apiStatus[0].getAttribute('api'));
        }
        d3.xml(url + '/api/capabilities').get()
            .on('load', done)
            .on('error', callback);
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
                s / 2 - projection.translate()[1]];

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

        function bboxUrl(tile) {
            return url + '/api/0.6/map?bbox=' + tile.extent.toParam();
        }

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

            inflight[id] = that.loadFromURL(bboxUrl(tile), function(err, parsed) {
                loadedTiles[id] = true;
                delete inflight[id];

                if (callback) callback(err, _.extend({data: parsed}, tile));

                if (_.isEmpty(inflight)) {
                    dispatch.call('loaded');
                }
            });
        });
    },


    switch: function(options) {
        url = options.url;
        oauth.options(_.extend({
            loading: authenticating,
            done: authenticated
        }, options));
        dispatch.call('auth');
        this.reset();
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
        userDetails = undefined;
        oauth.logout();
        dispatch.call('auth');
        return this;
    },


    authenticate: function(callback) {
        userDetails = undefined;
        function done(err, res) {
            dispatch.call('auth');
            if (callback) callback(err, res);
        }
        return oauth.authenticate(done);
    }
};
