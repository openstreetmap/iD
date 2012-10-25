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
        return _.values(entities);
    }

    function assign(obj) {
        // summary:	Save an entity to the data store.
        if (obj.entityType === 'node') { // never reassign nodes
            if (!entities[obj.id]) entities[obj.id] = obj;
        } else if (obj.entityType === 'way') {
            if (!entities[obj.id]) {
                entities[obj.id] = obj;
            } else {
                entities[obj.id].nodes = obj.nodes;
            }
        } else if (obj.entityType === 'relation') {
            if (!relations[obj.id]) relations[obj.id] = obj;
        }
    }

    function getOrCreate(id, type) {
        // summary:		Return an entity if it exists: if not, create an empty one with the given id, and return that.
        if (type === 'node') {
            if (!entities[id]) assign(new iD.Node(connection, id, NaN, NaN, {}, false));
            return entities[id];
        } else if (type === 'way') {
            if (!entities[id]) assign(new iD.Way(connection, id, [], {}, false));
            return entities[id];
        } else if (type === 'relation') {
            if (!relations[id]) assign(new iD.Relation(connection, id, [], {}, false));
            return relations[id];
        }
    }

    function doCreateNode(tags, lat, lon, perform) {
        // summary:		Create a new node and save it in the data store, using an undo stack.
        var node = new iD.Node(connection, nextNode--, lat, lon, tags, true);
        perform(new iD.actions.CreateEntityAction(node, assign));
        return node;	// iD.Node
    }

    function doCreateWay(tags, nodes, perform) {
        // summary:		Create a new way and save it in the data store, using an undo stack.
        var way = new iD.Way(connection, nextWay--, nodes.concat(), tags, true);
        perform(new iD.actions.CreateEntityAction(way, assign));
        return way;
    }

    function doCreateRelation(tags, members, perform) {
        // summary:		Create a new relation and save it in the data store, using an undo stack.
        var relation = new iD.Relation(connection, nextRelation--, members.concat(), tags, true);
        perform(new iD.actions.CreateEntityAction(relation, assign));
        return relation;
    }

    function getObjectsByBbox(extent) {
        // summary:	Find all drawable entities that are within a given bounding box.
        // Each one is an array of entities.
        return _.filter(this.entities, function(e, id) {
            return e.within(extent);
        });
    }

    // ----------
    // OSM parser
    function loadFromAPI(box, callback) {
        // summary:		Request data within the bbox from an external OSM server. Currently hardcoded
        // to use Overpass API (which has the relevant CORS headers).
        loadFromURL("http://www.overpass-api.de/api/xapi?map?bbox=" +
            [box[0][0], box[1][1], box[1][0], box[0][1]], callback);
    }

    function loadFromURL(url, callback) {
        // summary:		Load all data from a given URL.
        $.ajax({
            url: url,
            success: parse(callback)
        });
    }

    // Private functions to parse DOM created from XML file
    function filterNodeName(n) {
        return function(item) { return item.nodeName === n; };
    }

    function attributeObject(obj) {
        var o = {};
        for (var i = 0; i < obj.attributes.length; i++) {
            o[obj.attributes[i].nodeName] = obj.attributes[i].nodeValue;
        }
        return o;
    }

    function getAttribute(obj, name) {
        for (var i = 0; i < obj.attributes.length; i++) {
            if (obj.attributes[i].nodeName === name) {
                return obj.attributes[i].nodeValue;
            }
        }
    }

    function getTags(obj) {
        var tags = {};
        // Doesn't use underscore for performance reasons
        for (var i = 0; i < obj.childNodes.length; i++) {
            var item = obj.childNodes[i];
            if (item.nodeName === 'tag') {
                tags[getAttribute(item,'k')] = getAttribute(item,'v');
            }
        }
        return tags;
    }

    function getNodes(obj) {
        var nodes = [];
        // Doesn't use underscore for performance reasons
        for (var i = 0; i < obj.childNodes.length; i++) {
            var item = obj.childNodes[i];
            if (item.nodeName === 'nd') {
                nodes.push(entities[getAttribute(item,'ref')]);
            }
        }
        return nodes;
    }

    function getMembers(obj) {
        return _(obj.childNodes).chain()
            .filter(filterNodeName('member'))
            .map(function(item) {
                var id = getAttribute(item,'ref'),
                type = getAttribute(item,'type'),
                role = getAttribute(item,'role');

                var obj = getOrCreate(id, type);
                return new iD.RelationMember(obj, role);
            }).value();
    }

    function parse(callback) {
        return function(dom) {
            for (var i = 0; i < dom.childNodes[0].childNodes.length; i++) {
                var obj = dom.childNodes[0].childNodes[i], attrib;
                if (obj.nodeName === 'node') {
                    attrib = attributeObject(obj);
                    var node = new iD.Node(connection,
                        +attrib.id,
                        +attrib.lat,
                        +attrib.lon,
                        getTags(obj));
                    assign(node);
                } else if (obj.nodeName === 'way') {
                    attrib = attributeObject(obj);
                    var way = new iD.Way(connection,
                        attrib.id,
                        getNodes(obj, connection),
                        getTags(obj));
                    assign(way);
                } else if (obj.nodeName === 'relation') {
                    attrib = attributeObject(obj);
                    var relation = new iD.Relation(connection,
                        attrib.id,
                        getMembers(obj, connection),
                        getTags(obj));
                    assign(relation);
                }
            }
            callback();
        };
    }

    connection.entities = entities;
    connection.all = all;
    connection.relations = relations;
    connection.loadFromAPI = loadFromAPI;
    connection.loadFromURL = loadFromURL;
    connection.getObjectsByBbox = getObjectsByBbox;
    connection.doCreateNode = doCreateNode;
    connection.doCreateWay = doCreateWay;
    connection.doCreateRelation = doCreateRelation;

    return connection;
};
