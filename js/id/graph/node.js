iD.Node = iD.Entity.node = function iD_Node() {
    if (!(this instanceof iD_Node)) {
        return (new iD_Node()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
};

iD.Node.prototype = Object.create(iD.Entity.prototype);

_.extend(iD.Node.prototype, {
    type: "node",

    extent: function() {
        return iD.geo.Extent(this.loc);
    },

    geometry: function(graph) {
        return graph.isPoi(this) ? 'point' : 'vertex';
    },

    move: function(loc) {
        return this.update({loc: loc});
    }
});
