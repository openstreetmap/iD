iD.Connection = function() {
    var apiURL = 'http://www.openstreetmap.org/api/0.6/',
        connection = {},
        refNodes = {},
        user = {},
        oauth = iD.OAuth().setAPI(apiURL);

    // Request data within the bbox from an external OSM server.
    function bboxFromAPI(box, callback) {
        loadFromURL(apiURL + 'map?bbox=' +
            [box[0][0], box[1][1], box[1][0], box[0][1]], callback);
    }

    // Request data within the bbox from an external OSM server.
    function wayFromAPI(id, callback) {
        loadFromURL(apiURL + 'way/' + id + '/full', callback);
    }

    function loadFromURL(url, callback) {
        d3.xml(url, function(err, dom) { callback(parse(dom)); });
    }

    function getNodes(obj) {
        var nodes = [], nelems = obj.getElementsByTagName('nd');
        for (var i = 0, l = nelems.length; i < l; i++) {
            nodes[i] = 'n' + nelems[i].attributes.ref.nodeValue;
            refNodes['n' + nelems[i].attributes.ref.nodeValue] = true;
        }
        return nodes;
    }

    function getTags(obj) {
        var tags = {}, tagelems = obj.getElementsByTagName('tag');
        for (var i = 0, l = tagelems.length; i < l; i++) {
            var item = tagelems[i];
            tags[item.attributes.k.nodeValue] = item.attributes.v.nodeValue;
        }
        return tags;
    }

    function getMembers(obj) {
        var members = [],
            elems = obj.getElementsByTagName('member');

        for (var i = 0, l = elems.length; i < l; i++) {
            members[i] = {
                id: elems[i].attributes.type.nodeValue[0] + elems[i].attributes.ref.nodeValue,
                type: elems[i].attributes.type.nodeValue,
                role: elems[i].attributes.role.nodeValue
            };
        }
        return members;
    }

    function objectData(obj) {
        var o = {
            type: obj.nodeName,
            members: getMembers(obj),
            nodes: getNodes(obj),
            tags: getTags(obj)
        };
        for (var i = 0, l = obj.attributes.length; i < l; i++) {
            var n = obj.attributes[i].nodeName;
            var v = obj.attributes[i].nodeValue;
            o[n] = v;
        }
        if (o.lat) o.lat = parseFloat(o.lat);
        if (o.lon) o.lon = parseFloat(o.lon);
        o._id = o.id;
        o.id = o.type[0] + o.id;
        return iD.Entity(o);
    }

    function parse(dom) {
        if (!dom.childNodes) return new Error('Bad request');
        var root = dom.childNodes[0];
        var entities = {};
        refNodes = {};
        function addEntity(obj) {
            var o = objectData(obj);
            if (o.type === 'node') o._poi = !refNodes[o.id];
            entities[o.id] = o;
        }

        _.forEach(root.getElementsByTagName('way'), addEntity);
        _.forEach(root.getElementsByTagName('node'), addEntity);
        _.forEach(root.getElementsByTagName('relation'), addEntity);

        return iD.Graph(entities);
    }

    function authenticate(callback) {
        return oauth.authenticate(callback);
    }

    function authenticated() {
        return oauth.authenticated();
    }

    function createChangeset(changes) {
        oauth.xhr({
                method: 'PUT',
                path: '/changeset/create',
                options: { header: { 'Content-Type': 'text/xml' } },
                content: iD.format.XML.changeset()
            },
            function (changeset_id) {
                oauth.xhr({
                    method: 'POST',
                    path: '/changeset/' + changeset_id + '/upload',
                    options: { header: { 'Content-Type': 'text/xml' } },
                    content: iD.format.XML.osmChange(user.id, changeset_id, changes)
                }, function () {
                    oauth.xhr({
                        method: 'PUT',
                        path: '/changeset/' + changeset_id + '/close'
                    }, function () {
                        alert('saved! ' + apiURL.replace('/api/0.6/', '/browse') + '/changeset/' + changeset_id);
                    });
                });
            });
    }

    function userDetails(callback) {
        oauth.xhr({ method: 'GET', path: '/user/details' }, function(user_details) {
            var u = user_details.getElementsByTagName('user')[0];
            callback({
                display_name: u.attributes.display_name.nodeValue,
                id: u.attributes.id.nodeValue
            });
        });
    }

    connection.url = function(x) {
        if (!arguments.length) return apiURL;
        apiURL = x;
        oauth.setAPI(x);
        return connection;
    };

    connection.user = function(x) {
        if (!arguments.length) return user;
        user = x;
        return connection;
    };

    connection.bboxFromAPI = bboxFromAPI;
    connection.wayFromAPI = wayFromAPI;
    connection.loadFromURL = loadFromURL;
    connection.userDetails = userDetails;
    connection.authenticate = authenticate;
    connection.authenticated = authenticated;
    connection.createChangeset = createChangeset;

    connection.objectData = objectData;
    connection.apiURL = apiURL;

    return connection;
};
