iD.Connection = function() {
    // summary:	The data store, including methods to fetch data from (and, eventually, save data to)
    // an OSM API server.
    var nextNode = -1,
        nextWay = -1,
        nextRelation = -1,
        graph = {},
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

    function parse(callback) {
        return function(dom) {
            if (!dom.childNodes) {
                return callback(new Error('Bad request'));
            }
            for (var i = 0; i < dom.childNodes[0].childNodes.length; i++) {
                var obj = dom.childNodes[0].childNodes[i];
                graph.process(obj);
            }
            callback(null);
        };
    }

    connection.graph = function(x) {
        graph = x;
        return connection;
    };

    connection.all = all;
    connection.loadFromAPI = loadFromAPI;
    connection.loadFromURL = loadFromURL;
    connection.apiURL = apiURL;
    connection.intersects = intersects;

    return connection;
};
