iD.Connection = function(graph) {
    var nextNode = -1,
        nextWay = -1,
        nextRelation = -1,
        apiURL = 'http://www.openstreetmap.org/api/0.6/';

    var connection = {};

    function all() {
        return graph.nodes;
    }

    function intersects(extent) {
        // summary:	Find all drawable entities that are within a given bounding box.
        // Each one is an array of entities.
        return graph.nodes.filter(function(e, id) {
            if (e.lon !== undefined) {
                return (e.lon >= extent[0][0]) &&
                    (e.lon <= extent[1][0]) &&
                    (e.lat <= extent[0][1]) &&
                    (e.lat >= extent[1][1]);
            } else {
                return e.intersects(extent);
            }
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
        var members = [],
            elems = obj.getElementsByTagName('member');

        for (var i = 0; i < elems.length; i++) {
            members.push({
                id: +elems[i].attributes.ref.nodeValue,
                type: elems[i].attributes.type.nodeValue,
                role: elems[i].attributes.role.nodeValue
            });
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
            var root = dom.childNodes[0],
                ways = root.getElementsByTagName('way'),
                relations = root.getElementsByTagName('relation'),
                nodes = root.getElementsByTagName('node');
            var i;
            for (i = 0; i < ways.length; i++) graph.insert(objectData(ways[i]));
            for (i = 0; i < relations.length; i++) graph.insert(objectData(relations[i]));
            for (i = 0; i < nodes.length; i++) graph.insert(objectData(nodes[i]));
            graph.build();
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
