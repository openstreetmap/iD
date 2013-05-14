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
        return new iD.geo.Extent(this.loc);
    },

    geometry: function(graph) {
        return graph.isPoi(this) ? 'point' : 'vertex';
    },

    move: function(loc) {
        return this.update({loc: loc});
    },

    isIntersection: function(resolver) {
        return resolver.transient(this, 'isIntersection', function() {
            return resolver.parentWays(this).filter(function(parent) {
                return parent.geometry(resolver) === 'line';
            }).length > 1;
        });
    },

    asJXON: function(changeset_id) {
        var r = {
            node: {
                '@id': this.osmId(),
                '@lon': this.loc[0],
                '@lat': this.loc[1],
                '@version': (this.version || 0),
                tag: _.map(this.tags, function(v, k) {
                    return { keyAttributes: { k: k, v: v } };
                })
            }
        };
        if (changeset_id) r.node['@changeset'] = changeset_id;
        return r;
    },

    asGeoJSON: function() {
        return {
            type: 'Feature',
            properties: this.tags,
            geometry: {
                type: 'Point',
                coordinates: this.loc
            }
        };
    }
});
