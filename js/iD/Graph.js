iD.Graph = function() {
    this.index = {};
    this.nodes = [];
};

iD.Graph.prototype = {

    getTags: function(obj) {
        var tags = {}, tagelems = obj.getElementsByTagName('tag');
        for (var i = 0; i < tagelems.length; i++) {
            var item = tagelems[i];
            tags[item.attributes.k.nodeValue] = item.attributes.v.nodeValue;
        }
        return tags;
    },

    getNodes: function(obj) {
        var nodes = [], nelems = obj.getElementsByTagName('nd');
        for (var i = 0; i < nelems.length; i++) {
            var item = nelems[i];
            nodes.push(this.index[item.attributes.ref.nodeValue]);
        }
        return nodes;
    },

    getMembers: function(obj) {
        var members = [];
        var elems = obj.getElementsByTagName('member');

        for (var i = 0; i < elems.length; i++) {
            var item = elems[i];
            var id = item.attributes.ref.nodeValue,
                type = item.attributes.type.nodeValue,
                role = item.attributes.role.nodeValue;

            var o = this.getOrCreate(id, type);
            members.push(new iD.RelationMember(o, role));
        }

        return members;
    },

    assign: function(obj) {
        // summary:	Save an entity to the data store.
        if (obj.type === 'relation') {
            if (!this.index[obj.id]) this.index[obj.id] = obj;
        } else if (!this.index[obj.id] || !this.index[obj.id].loaded) {
            this.index[obj.id] = obj;
        }
    },

    getOrCreate: function(id, type) {
        // summary:		Return an entity if it exists: if not, create an empty one with the given id, and return that.
        if (type === 'node') {
            if (!this.index[id]) this.assign(new iD.Node(id));
            return this.index[id];
        } else if (type === 'way') {
            if (!this.index[id]) {
                this.assign(new iD.Way(id));
            }
            return this.index[id];
        } else if (type === 'relation') {
            if (!this.index[id]) this.assign(new iD.Relation(id));
            return this.index[id];
        }
    },

    process: function(obj) {
        if (obj.nodeName === 'node') {
            var node = new iD.Node(
                obj.attributes.id.nodeValue,
                +obj.attributes.lat.nodeValue,
                +obj.attributes.lon.nodeValue,
                this.getTags(obj));
            this.assign(node);
        } else if (obj.nodeName === 'way') {
            var way = new iD.Way(
                obj.attributes.id.nodeValue,
                this.getNodes(obj),
                this.getTags(obj));
            this.assign(way);
        } else if (obj.nodeName === 'relation') {
            var relation = new iD.Relation(
                obj.attributes.id.nodeValue,
                this.getMembers(obj, connection),
                this.getTags(obj));
            this.assign(relation);
        }
    }
};
