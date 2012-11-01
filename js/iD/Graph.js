iD.Graph = function() {
};

iD.Graph.prototype = {

    // OSM IDS -> UIDs
    uid: {},
    // UID -> OSM ID
    oid: {},
    // UID -> index in nodes
    index: {},
    // List of nodes
    nodes: [],

    insert: function(o) {
        var obj;
        // Do not reinsert OSM objects
        if (this.uid[o.id]) return;
        if (o.type === 'node') {
            obj = {
                type: 'node',
                id: o.id,
                uid: uuid.v4(),
                lat: o.lat,
                lon: o.lon,
                tags: o.tags
            };
        } else if (o.type === 'way') {
            obj = new iD.Way(
                o.id,
                uuid.v4(),
                o.nodes,
                o.tags);
        } else if (o.type === 'relation') {
            obj = new iD.Relation(
                o.id,
                uuid.v4(),
                o.members,
                o.tags);
        }
        if (!obj) return;
        this.nodes.push(obj);
        this.uid[obj.id] = obj.uid;
        this.oid[obj.uid] = obj.id;
        this.index[obj.uid] = this.nodes.length - 1;
    },

    build: function() {
        for (var i = 0; i < this.nodes.length; i++) {
            var n = this.nodes[i];
            if (n.type === 'way') {
                // Fix references to osm ids with references
                // to UIDs
                for (var j = 0; j < n.children.length; j++) {
                    var uid = this.uid[n.children[j]];
                    if (uid) {
                        n.children[j] = uid;
                    }
                }
            }
        }
    },

    fetch: function(uid) {
        var obj = _.clone(this.nodes[this.index[uid]]);
        if (obj && obj.children && obj.children.length) {
            var children = [];
            for (var i = 0; i < obj.children.length; i++) {
                children.push(this.nodes[this.index[obj.children[i]]]);
            }
            obj.children = children;
        }
        return obj;
    }
};
