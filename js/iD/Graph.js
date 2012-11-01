iD.Graph = function() {
    this.index = {};
};

iD.Graph.prototype = {
    insert: function(o) {
        var obj;
        if (o.type === 'node') {
            obj = new iD.Node(
                o.id,
                o.lat,
                o.lon,
                o.tags);
        } else if (o.type === 'way') {
            obj = new iD.Way(
                o.id,
                o.nodes,
                o.tags);
        } else if (o.type === 'relation') {
            obj = new iD.Relation(
                o.id,
                o.members,
                o.tags);
        }
        if (obj && (!this.index[obj.id] || !this.index[obj.id].loaded)) {
            this.index[obj.id] = obj;
        }
    },

    fetch: function(id) {
        var obj = _.clone(this.index[id]);
        var children = [];
        for (var i = 0; i < obj.children.length; i++) {
            children.push(this.index[obj.children[i]]);
        }
        obj.children = children;
        return obj;
    }
};
