iD.Connection = function(graph) {
    var apiURL = 'http://www.openstreetmap.org/api/0.6/';

    var connection = {};

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
        d3.xml(url, parse(callback));
    }

    function getNodes(obj) {
        var nodes = [], nelems = obj.getElementsByTagName('nd');
        for (var i = 0, l = nelems.length; i < l; i++) {
            nodes[i] = 'n' + nelems[i].attributes.ref.nodeValue;
        }
        return nodes;
    }

    // <tag k="highway" v="unclassified"/>
    function getTags(obj) {
        var tags = {}, tagelems = obj.getElementsByTagName('tag');
        for (var i = 0, l = tagelems.length; i < l; i++) {
            var item = tagelems[i];
            tags[item.attributes.k.nodeValue] = item.attributes.v.nodeValue;
        }
        return tags;
    }

    // <member type="node" ref="364933006" role=""/>
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

    // <node id="1831881213"
    //     version="1"
    //     changeset="12370172"
    //     lat="54.0900666"
    //     lon="12.2539381"
    //     user="lafkor"
    //     uid="75625"
    //     visible="true"
    //     timestamp="2012-07-20T09:43:19Z">
    function objectData(obj) {
        var o = {
            type: obj.nodeName,
            members: getMembers(obj),
            nodes: getNodes(obj),
            tags: getTags(obj)
        };
        for (var i = 0; i < obj.attributes.length; i++) {
            var n = obj.attributes[i].nodeName;
            var v = obj.attributes[i].nodeValue;
            o[n] = v;
        }
        if (o.lat) o.lat = parseFloat(o.lat);
        if (o.lon) o.lon = parseFloat(o.lon);
        o._id = o.id;
        o.id = o.type[0] + o.id;
        return o;
    }

    function parse(callback) {
        return function(dom) {
            if (!dom.childNodes) return callback(new Error('Bad request'));
            var root = dom.childNodes[0];
            connection.graph.insert(_.map(root.getElementsByTagName('way'), objectData));
            connection.graph.insert(_.map(root.getElementsByTagName('node'), objectData));
            connection.graph.insert(_.map(root.getElementsByTagName('relation'), objectData));
            callback(null);
        };
    }

    connection.graph = graph;

    connection.bboxFromAPI = bboxFromAPI;
    connection.wayFromAPI = wayFromAPI;
    connection.loadFromURL = loadFromURL;

    connection.objectData = objectData;
    connection.apiURL = apiURL;

    return connection;
};
