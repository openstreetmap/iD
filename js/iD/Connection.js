iD.Connection = function(graph) {
    // summary:	The data store, including methods to fetch data from (and, eventually, save data to)
    // an OSM API server.
    var nextNode = -1,
        nextWay = -1,
        nextRelation = -1,
        apiURL = 'http://www.openstreetmap.org/api/0.6/';

    var connection = {};

    function all() {
        return d3.values(graph.index);
    }

    function intersects(extent) {
        // summary:	Find all drawable entities that are within a given bounding box.
        // Each one is an array of entities.
        return d3.values(graph.index).filter(function(e, id) {
            return e.intersects(extent);
        });
    }

    // Request data within the bbox from an external OSM server.
    function loadFromAPI(box, callback) {
        loadFromURL(apiURL + 'map?bbox=' +
            [box[0][0], box[1][1], box[1][0], box[0][1]], callback);
    }

    function loadFromURL(url, callback) {
        d3.xml(url, parse(callback));
    }

    function getNodes(obj) {
        var nodes = [], nelems = obj.getElementsByTagName('nd');
        for (var i = 0; i < nelems.length; i++) {
            var item = nelems[i];
            nodes.push(+item.attributes.ref.nodeValue);
        }
        return nodes;
    }

    function getTags(obj) {
        var tags = {}, tagelems = obj.getElementsByTagName('tag');
        for (var i = 0; i < tagelems.length; i++) {
            var item = tagelems[i];
            tags[item.attributes.k.nodeValue] = item.attributes.v.nodeValue;
        }
        return tags;
    }

    function getMembers(obj) {
        var members = [];
        var elems = obj.getElementsByTagName('member');

        for (var i = 0; i < elems.length; i++) {
            var item = elems[i];
            var id = +item.attributes.ref.nodeValue,
                type = item.attributes.type.nodeValue,
                role = item.attributes.role.nodeValue;

            var o = {
                id: id,
                type: type,
                role: role
            };

            members.push(o);
        }

        return members;
    }

    function objectData(obj) {
        return {
            type: obj.nodeName,
            id: +obj.attributes.id.nodeValue,
            tags: getTags(obj),
            lat: (obj.attributes.lat) ? +obj.attributes.lat.nodeValue : null,
            lon: (obj.attributes.lon) ? +obj.attributes.lon.nodeValue : null,
            members: getMembers(obj),
            nodes: getNodes(obj)
        };
    }

    function parse(callback) {
        return function(dom) {
            if (!dom.childNodes) {
                return callback(new Error('Bad request'));
            }
            var ways = dom.childNodes[0].getElementsByTagName('way'),
                relations = dom.childNodes[0].getElementsByTagName('relation'),
                nodes = dom.childNodes[0].getElementsByTagName('node');
            var i;
            for (i = 0; i < ways.length; i++) graph.insert(objectData(ways[i]));
            for (i = 0; i < relations.length; i++) graph.insert(objectData(relations[i]));
            for (i = 0; i < nodes.length; i++) graph.insert(objectData(nodes[i]));
            callback(null);
        };
    }

    connection.graph = graph;
    connection.all = all;
    connection.loadFromAPI = loadFromAPI;
    connection.loadFromURL = loadFromURL;
    connection.apiURL = apiURL;
    connection.intersects = intersects;

    return connection;
};
