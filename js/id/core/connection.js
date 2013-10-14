iD.Connection = function() {

    var event = d3.dispatch('authenticating', 'authenticated', 'auth', 'loading', 'load', 'loaded', 'loadnote'),
        url = 'http://www.openstreetmap.org',
        connection = {},
        inflight = {},
        inflightNotes = {},
        loadedTiles = {},
        loadedNotes = {},
        tileZoom = 16,
        oauth = osmAuth({
            url: 'http://www.openstreetmap.org',
            oauth_consumer_key: '5A043yRSEugj4DJ5TljuapfnrflWDte8jTOcWLlT',
            oauth_secret: 'aB3jKq1TRsCOUrfOIZ6oQMEDmv2ptV76PA54NGLL',
            loading: authenticating,
            done: authenticated
        }),
        ndStr = 'nd',
        tagStr = 'tag',
        memberStr = 'member',
        nodeStr = 'node',
        wayStr = 'way',
        relationStr = 'relation',
        off,
        notesOff;

    connection.changesetURL = function(changesetId) {
        return url + '/browse/changeset/' + changesetId;
    };

    connection.changesetsURL = function(extent) {
        return url + '/browse/changesets?bbox=' + extent.toParam();
    };

    connection.entityURL = function(entity) {
        return url + '/browse/' + entity.type + '/' + entity.osmId();
    };

    connection.userURL = function(username) {
        return url + "/user/" + username;
    };

    connection.loadNotesFromURL = function(url, callback) {
        function done(data) {
            return callback(null, data);
        }
        return d3.json(url).get().on('load', done);
    };

    connection.loadFromURL = function(url, callback) {
        function done(dom) {
            return callback(null, parse(dom));
        }
        return d3.xml(url).get().on('load', done);
    };

    connection.loadEntity = function(id, callback) {
        var type = iD.Entity.id.type(id),
            osmID = iD.Entity.id.toOSM(id);

        connection.loadFromURL(
            url + '/api/0.6/' + type + '/' + osmID + (type !== 'node' ? '/full' : ''),
            function(err, entities) {
                event.load(err, {data: entities});
                if (callback) callback(err, entities && entities[id]);
            });
    };

    function authenticating() {
        event.authenticating();
    }

    function authenticated() {
        event.authenticated();
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
                user: attrs.user && attrs.user.nodeValue,
                tags: getTags(obj)
            });
        },

        way: function wayData(obj) {
            var attrs = obj.attributes;
            return new iD.Way({
                id: iD.Entity.id.fromOSM(wayStr, attrs.id.nodeValue),
                version: attrs.version.nodeValue,
                user: attrs.user && attrs.user.nodeValue,
                tags: getTags(obj),
                nodes: getNodes(obj)
            });
        },

        relation: function relationData(obj) {
            var attrs = obj.attributes;
            return new iD.Relation({
                id: iD.Entity.id.fromOSM(relationStr, attrs.id.nodeValue),
                version: attrs.version.nodeValue,
                user: attrs.user && attrs.user.nodeValue,
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

    connection.authenticated = function() {
        return oauth.authenticated();
    };

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
    connection.osmChangeJXON = function(changeset_id, changes) {
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

    connection.changesetTags = function(comment, imageryUsed) {
        var tags = {
            imagery_used: imageryUsed.join(';'),
            created_by: 'iD ' + iD.version
        };

        if (comment) {
            tags.comment = comment;
        }

        return tags;
    };

    connection.putChangeset = function(changes, comment, imageryUsed, callback) {
        oauth.xhr({
                method: 'PUT',
                path: '/api/0.6/changeset/create',
                options: { header: { 'Content-Type': 'text/xml' } },
                content: JXON.stringify(connection.changesetJXON(connection.changesetTags(comment, imageryUsed)))
            }, function(err, changeset_id) {
                if (err) return callback(err);
                oauth.xhr({
                    method: 'POST',
                    path: '/api/0.6/changeset/' + changeset_id + '/upload',
                    options: { header: { 'Content-Type': 'text/xml' } },
                    content: JXON.stringify(connection.osmChangeJXON(changeset_id, changes))
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

    var userDetails;

    connection.userDetails = function(callback) {
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
                display_name: u.attributes.display_name.nodeValue,
                image_url: image_url,
                id: u.attributes.id.nodeValue
            };

            callback(undefined, userDetails);
        }

        oauth.xhr({ method: 'GET', path: '/api/0.6/user/details' }, done);
    };

    connection.status = function(callback) {
        function done(capabilities) {
            var apiStatus = capabilities.getElementsByTagName('status');
            callback(undefined, apiStatus[0].getAttribute('api'));
        }
        d3.xml(url + '/api/capabilities').get()
            .on('load', done)
            .on('error', callback);
    };

    function abortRequest(i) { i.abort(); }

    connection.tileZoom = function(_) {
        if (!arguments.length) return tileZoom;
        tileZoom = _;
        return connection;
    };

    function getTiles(projection, dimensions) {
        var s = projection.scale() * 2 * Math.PI,
            z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
            ts = 256 * Math.pow(2, z - tileZoom),
            origin = [
                s / 2 - projection.translate()[0],
                s / 2 - projection.translate()[1]];

        return d3.geo.tile()
            .scaleExtent([tileZoom, tileZoom])
            .scale(s)
            .size(dimensions)
            .translate(projection.translate())()
            .map(function(tile) {
                var x = tile[0] * ts - origin[0],
                    y = tile[1] * ts - origin[1];

                return {
                    id: tile.toString(),
                    extent: iD.geo.Extent(
                        projection.invert([x, y + ts]),
                        projection.invert([x + ts, y]))
                };
            });
    }

    function bboxURL(tile) {
        return url + '/api/0.6/map?bbox=' + tile.extent.toParam();
    }

    function notesBboxURL(tile) {
        return url + '/api/0.6/notes.json?bbox=' + tile.extent.toParam();
    }

    connection.loadNotes = function(projection, dimensions) {

        var tiles = getTiles(projection, dimensions);

        _.filter(inflight, notWanted).map(abortRequest);

        tiles.forEach(loadNotes);

        function notWanted(v, i) {
            var wanted = _.find(tiles, function(tile) {
                return i === tile.id;
            });
            if (!wanted) delete inflightNotes[i];
            return !wanted;
        }

        function loadNotes(tile) {
            var id = tile.id;

            if (loadedNotes[id] || inflightNotes[id]) return;

            inflightNotes[id] = connection.loadNotesFromURL(notesBboxURL(tile), onload);

            function onload(err, notes) {
                loadedTiles[id] = true;
                delete inflight[id];

                event.loadnote(err, notes);
            }
        }
    };

    connection.loadTiles = function(projection, dimensions) {

        if (off) return;

        var tiles = getTiles(projection, dimensions);

        _.filter(inflight, notWanted).map(abortRequest);

        tiles.forEach(loadTile);

        function notWanted(v, i) {
            var wanted = _.find(tiles, function(tile) {
                return i === tile.id;
            });
            if (!wanted) delete inflight[i];
            return !wanted;
        }

        function loadTile(tile) {
            var id = tile.id;

            if (loadedTiles[id] || inflight[id]) return;

            if (_.isEmpty(inflight)) {
                event.loading();
            }

            inflight[id] = connection.loadFromURL(bboxURL(tile), onload);

            function onload(err, parsed) {
                loadedTiles[id] = true;
                delete inflight[id];

                event.load(err, _.extend({data: parsed}, tile));

                if (_.isEmpty(inflight)) event.loaded();
            }
        }
    };

    connection.switch = function(options) {
        url = options.url;
        oauth.options(_.extend({
            loading: authenticating,
            done: authenticated
        }, options));
        event.auth();
        connection.flush();
        return connection;
    };

    connection.toggle = function(_) {
        off = !_;
        return connection;
    };

    connection.toggleNotes = function(_) {
        notesOff = !_;
        return connection;
    };

    connection.flush = function() {
        _.forEach(inflight, abortRequest);
        loadedTiles = {};
        inflight = {};
        return connection;
    };

    connection.loadedTiles = function(_) {
        if (!arguments.length) return loadedTiles;
        loadedTiles = _;
        return connection;
    };

    connection.logout = function() {
        oauth.logout();
        event.auth();
        return connection;
    };

    connection.authenticate = function(callback) {
        function done(err, res) {
            event.auth();
            if (callback) callback(err, res);
        }
        return oauth.authenticate(done);
    };

    return d3.rebind(connection, event, 'on');
};
