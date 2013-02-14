iD.Connection = function(context) {

    var event = d3.dispatch('auth', 'load'),
        url = 'http://www.openstreetmap.org',
        connection = {},
        user = {},
        version,
        presetData = iD.presetData(),
        keys,
        inflight = {},
        loadedTiles = {},
        oauth = iD.OAuth(context).url(url),
        ndStr = 'nd',
        tagStr = 'tag',
        memberStr = 'member',
        nodeStr = 'node',
        wayStr = 'way',
        relationStr = 'relation';

    function changesetUrl(changesetId) {
        return url + '/browse/changeset/' + changesetId;
    }

    function bboxUrl(b) {
        return url + '/api/0.6/map?bbox=' + [b[0][0],b[1][1],b[1][0],b[0][1]];
    }

    function bboxFromAPI(box, tile, callback) {
        function done(err, parsed) {
             loadedTiles[tile.toString()] = true;
             delete inflight[tile.toString()];
             callback(err, parsed);
         }
         inflight[tile.toString()] = loadFromURL(bboxUrl(box), done);
    }

    function loadFromURL(url, callback) {
        function done(dom) {
            return callback(null, parse(dom));
        }
        return d3.xml(url).get().on('load', done);
    }

    function getNodes(obj) {
        var elems = obj.getElementsByTagName(ndStr),
            nodes = new Array(elems.length);
        for (var i = 0, l = elems.length; i < l; i++) {
            nodes[i] = 'n' + elems[i].attributes.ref.nodeValue;
        }
        return nodes;
    }

    function getTags(obj) {
        var elems = obj.getElementsByTagName(tagStr),
            tags = {};
        for (var i = 0, l = elems.length; i < l; i++) {
            var attrs = elems[i].attributes;
            tags[attrs.k.nodeValue] = attrs.v.nodeValue;
        }
        return tags;
    }

    function getMembers(obj) {
        var elems = obj.getElementsByTagName(memberStr),
            members = new Array(elems.length);
        for (var i = 0, l = elems.length; i < l; i++) {
            var attrs = elems[i].attributes;
            members[i] = {
                id: attrs.type.nodeValue[0] + attrs.ref.nodeValue,
                type: attrs.type.nodeValue,
                role: attrs.role.nodeValue
            };
        }
        return members;
    }

    var parsers = {
        node: function nodeData(obj) {
            var attrs = obj.attributes;
            return new iD.Node({
                id: iD.Entity.id.fromOSM(nodeStr, attrs.id.nodeValue),
                loc: [parseFloat(attrs.lon.nodeValue), parseFloat(attrs.lat.nodeValue)],
                version: attrs.version.nodeValue,
                changeset: attrs.changeset.nodeValue,
                user: attrs.user.nodeValue,
                uid: attrs.uid.nodeValue,
                visible: attrs.visible.nodeValue,
                timestamp: attrs.timestamp.nodeValue,
                tags: getTags(obj)
            });
        },

        way: function wayData(obj) {
            var attrs = obj.attributes;
            return new iD.Way({
                id: iD.Entity.id.fromOSM(wayStr, attrs.id.nodeValue),
                version: attrs.version.nodeValue,
                changeset: attrs.changeset.nodeValue,
                user: attrs.user.nodeValue,
                uid: attrs.uid.nodeValue,
                visible: attrs.visible.nodeValue,
                timestamp: attrs.timestamp.nodeValue,
                tags: getTags(obj),
                nodes: getNodes(obj)
            });
        },

        relation: function relationData(obj) {
            var attrs = obj.attributes;
            return new iD.Relation({
                id: iD.Entity.id.fromOSM(relationStr, attrs.id.nodeValue),
                version: attrs.version.nodeValue,
                changeset: attrs.changeset.nodeValue,
                user: attrs.user.nodeValue,
                uid: attrs.uid.nodeValue,
                visible: attrs.visible.nodeValue,
                timestamp: attrs.timestamp.nodeValue,
                tags: getTags(obj),
                members: getMembers(obj)
            });
        }
    };

    function parse(dom) {
        if (!dom || !dom.childNodes) return new Error('Bad request');

        var root = dom.childNodes[0],
            children = root.childNodes,
            entities = {};

        var i, o, l;
        for (i = 0, l = children.length; i < l; i++) {
            var child = children[i],
                parser = parsers[child.nodeName];
            if (parser) {
                o = parser(child);
                entities[o.id] = o;
            }
        }

        return entities;
    }

    function authenticated() {
        return oauth.authenticated();
    }

    // Generate Changeset XML. Returns a string.
    connection.changesetJXON = function(tags) {
        return {
            osm: {
                changeset: {
                    tag: _.map(tags, function(value, key) {
                        return { '@k': key, '@v': value };
                    }),
                    '@version': 0.3,
                    '@generator': 'iD'
                }
            }
        };
    };

    // Generate [osmChange](http://wiki.openstreetmap.org/wiki/OsmChange)
    // XML. Returns a string.
    connection.osmChangeJXON = function(userid, changeset_id, changes) {
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
                '@version': 0.3,
                '@generator': 'iD',
                'create': nest(changes.created.map(rep), ['node', 'way', 'relation']),
                'modify': nest(changes.modified.map(rep), ['node', 'way', 'relation']),
                'delete': _.extend(nest(changes.deleted.map(rep), ['relation', 'way', 'node']), {'@if-unused': true})
            }
        };
    };

    connection.putChangeset = function(changes, comment, imagery_used, callback) {
        oauth.xhr({
                method: 'PUT',
                path: '/api/0.6/changeset/create',
                options: { header: { 'Content-Type': 'text/xml' } },
                content: JXON.stringify(connection.changesetJXON({
                    imagery_used: imagery_used.join(';'),
                    comment: comment,
                    created_by: 'iD ' + iD.version
                }))
            }, function(err, changeset_id) {
                if (err) return callback(err);
                oauth.xhr({
                    method: 'POST',
                    path: '/api/0.6/changeset/' + changeset_id + '/upload',
                    options: { header: { 'Content-Type': 'text/xml' } },
                    content: JXON.stringify(connection.osmChangeJXON(user.id, changeset_id, changes))
                }, function(err) {
                    if (err) return callback(err);
                    oauth.xhr({
                        method: 'PUT',
                        path: '/api/0.6/changeset/' + changeset_id + '/close'
                    }, function(err) {
                        callback(err, changeset_id);
                    });
                });
            });
    };

    function userDetails(callback) {
        function done(err, user_details) {
            if (err) return callback(err);
            var u = user_details.getElementsByTagName('user')[0],
                img = u.getElementsByTagName('img'),
                image_url = '';
            if (img && img[0].getAttribute('href')) {
                image_url = img[0].getAttribute('href');
            }
            callback(undefined, connection.user({
                display_name: u.attributes.display_name.nodeValue,
                image_url: image_url,
                id: u.attributes.id.nodeValue
            }).user());
        }
        oauth.xhr({ method: 'GET', path: '/api/0.6/user/details' }, done);
    }

    function tileAlreadyLoaded(c) { return !loadedTiles[c.toString()] && !inflight[c.toString()]; }

    function abortRequest(i) { i.abort(); }

    function loadTile(e) {
        function done(err, g) {
            event.load(err, g);
        }
        bboxFromAPI(e.box, e.tile, done);
    }

    function loadTiles(projection, dimensions) {
        var scaleExtent = [16, 16],
            s = projection.scale(),
            tiles = d3.geo.tile()
                .scaleExtent(scaleExtent)
                .scale(s)
                .size(dimensions)
                .translate(projection.translate())(),
            z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
            rz = Math.max(scaleExtent[0], Math.min(scaleExtent[1], Math.floor(z))),
            ts = 256 * Math.pow(2, z - rz),
            tile_origin = [
                s / 2 - projection.translate()[0],
                s / 2 - projection.translate()[1]];

        function apiExtentBox(c) {
            var x = (c[0] * ts) - tile_origin[0];
            var y = (c[1] * ts) - tile_origin[1];
            return {
                box: [
                    projection.invert([x, y]),
                    projection.invert([x + ts, y + ts])],
                tile: c
            };
        }

        _.filter(inflight, function(v, i) {
            var wanted = _.find(tiles, function(tile) {
                return i === tile.toString();
            });
            if (!wanted) delete inflight[i];
            return !wanted;
        }).map(abortRequest);

        tiles
            .filter(tileAlreadyLoaded)
            .map(apiExtentBox)
            .forEach(loadTile);
    }

    connection.userUrl = function(username) {
        return url + "/user/" + username;
    };

    connection.url = function(_) {
        if (!arguments.length) return url;
        url = _;
        oauth.url(_);
        event.auth();
        connection.flush();
        return connection;
    };

    connection.user = function(_) {
        if (!arguments.length) return user;
        user = _;
        return connection;
    };

    connection.flush = function() {
        _.forEach(inflight, abortRequest);
        loadedTiles = {};
        inflight = {};
        return connection;
    };

    connection.logout = function() {
        oauth.logout();
        event.auth();
        return connection;
    };

    connection.keys = function(_) {
        if (!arguments.length) return keys;
        keys = _;
        oauth.keys(keys);
        return connection;
    };

    connection.presetData = function(_) {
        if (!arguments.length) return presetData;
        presetData = _;
        return connection;
    };

    connection.authenticate = function(callback) {
        function done(err, res) {
            event.auth();
            if (callback) callback(err, res);
        }
        return oauth.authenticate(done);
    };

    connection.bboxFromAPI = bboxFromAPI;
    connection.changesetUrl = changesetUrl;
    connection.loadFromURL = loadFromURL;
    connection.loadTiles = _.debounce(loadTiles, 100);
    connection.userDetails = userDetails;
    connection.authenticated = authenticated;

    return d3.rebind(connection, event, 'on');
};
