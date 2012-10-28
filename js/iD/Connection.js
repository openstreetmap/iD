if (typeof iD === 'undefined') iD = {};

iD.Connection = function(apiURL) {
    // summary:		The data store, including methods to fetch data from (and, eventually, save data to)
    // an OSM API server.
    var nextNode = -1,		// next negative ids
        nextWay = -1,		//  |
        nextRelation = -1,	//  |
        entities = {},
        relations = {},
        pois = {},
        modified = false,
        apiBaseURL = apiURL;

    var connection = {};

    function all() {
        return d3.values(entities);
    }

    function assign(obj) {
        // summary:	Save an entity to the data store.
        if (obj.entityType === 'relation') {
            if (!relations[obj.id]) relations[obj.id] = obj;
        } else if (!entities[obj.id] || !entities[obj.id].loaded) {
            entities[obj.id] = obj;
        }
    }

    function getOrCreate(id, type) {
        // summary:		Return an entity if it exists: if not, create an empty one with the given id, and return that.
        if (type === 'node') {
            if (!entities[id]) assign(new iD.Node(id, NaN, NaN, {}, false));
            return entities[id];
        } else if (type === 'way') {
            if (!entities[id]) {
                assign(new iD.Way(id, [], {}, false));
            }
            return entities[id];
        } else if (type === 'relation') {
            if (!relations[id]) assign(new iD.Relation(id, [], {}, false));
            return relations[id];
        }
    }

    function doCreateNode(tags, lat, lon, perform) {
        // summary:		Create a new node and save it in the data store, using an undo stack.
        var node = new iD.Node(nextNode--, lat, lon, tags, true);
        perform(new iD.actions.CreateEntityAction(node, assign));
        return node;	// iD.Node
    }

    function doCreateWay(tags, nodes, perform) {
        // summary:		Create a new way and save it in the data store, using an undo stack.
        var way = new iD.Way(nextWay--, nodes.concat(), tags, true);
        perform(new iD.actions.CreateEntityAction(way, assign));
        return way;
    }

    function doCreateRelation(tags, members, perform) {
        // summary:		Create a new relation and save it in the data store, using an undo stack.
        var relation = new iD.Relation(nextRelation--, members.concat(), tags, true);
        perform(new iD.actions.CreateEntityAction(relation, assign));
        return relation;
    }

    function intersects(extent) {
        // summary:	Find all drawable entities that are within a given bounding box.
        // Each one is an array of entities.
        return d3.values(entities).filter(function(e, id) {
            return e.intersects(extent);
        });
    }

    // Request data within the bbox from an external OSM server.
    function loadFromAPI(box, callback) {
        loadFromURL('http://www.overpass-api.de/api/xapi?map?bbox=' +
            [box[0][0], box[1][1], box[1][0], box[0][1]], callback);
    }

    function loadFromURL(url, callback) {
        d3.xml(url, parse(callback));
    }

    function getTags(obj) {
        var tags = {};
        var tagelems = obj.getElementsByTagName('tag');
        // Doesn't use underscore for performance reasons
        for (var i = 0; i < tagelems.length; i++) {
            var item = tagelems[i];
            tags[item.attributes.k.nodeValue] = item.attributes.v.nodeValue;
        }
        return tags;
    }

    function getNodes(obj) {
        var nodes = [];
        var nelems = obj.getElementsByTagName('nd');
        // Doesn't use underscore for performance reasons
        for (var i = 0; i < nelems.length; i++) {
            var item = nelems[i];
            nodes.push(entities[item.attributes.ref.nodeValue]);
        }
        return nodes;
    }

    function getMembers(obj) {
        var members = [];
        var elems = obj.getElementsByTagName('member');
        for (var i = 0; i < elems.length; i++) {
            var item = elems[i];
            var id = item.attributes.ref.nodeValue,
                type = item.attributes.type.nodeValue,
                role = item.attributes.role.nodeValue;

            var o = getOrCreate(id, type);
            members.push(new iD.RelationMember(o, role));
        }

        return members;
    }

    function parse(callback) {
        return function(dom) {
            if (!dom.childNodes) {
                return callback(new Error('Bad request'));
            }
            for (var i = 0; i < dom.childNodes[0].childNodes.length; i++) {
                var obj = dom.childNodes[0].childNodes[i], attrib;
                if (obj.nodeName === 'node') {
                    var node = new iD.Node(
                        +obj.attributes.id.nodeValue,
                        +obj.attributes.lat.nodeValue,
                        +obj.attributes.lon.nodeValue,
                        getTags(obj));
                    assign(node);
                } else if (obj.nodeName === 'way') {
                    var way = new iD.Way(
                        obj.attributes.id.nodeValue,
                        getNodes(obj),
                        getTags(obj));
                    assign(way);
                } else if (obj.nodeName === 'relation') {
                    var relation = new iD.Relation(
                        obj.attributes.id.nodeValue,
                        getMembers(obj, connection),
                        getTags(obj));
                    assign(relation);
                }
            }
            callback(null);
        };
    }

    connection.entities = entities;
    connection.all = all;
    connection.relations = relations;
    connection.loadFromAPI = loadFromAPI;
    connection.loadFromURL = loadFromURL;
    connection.intersects = intersects;
    connection.doCreateNode = doCreateNode;
    connection.doCreateWay = doCreateWay;
    connection.doCreateRelation = doCreateRelation;

    return connection;
};
