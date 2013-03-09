iD.Way = iD.Entity.way = function iD_Way() {
    if (!(this instanceof iD_Way)) {
        return (new iD_Way()).initialize(arguments);
    } else if (arguments.length) {
        this.initialize(arguments);
    }
};

iD.Way.prototype = Object.create(iD.Entity.prototype);

_.extend(iD.Way.prototype, {
    type: "way",
    nodes: [],

    extent: function(resolver) {
        return resolver.transient(this, 'extent', function() {
            return this.nodes.reduce(function(extent, id) {
                return extent.extend(resolver.entity(id).extent(resolver));
            }, iD.geo.Extent());
        });
    },

    first: function() {
        return this.nodes[0];
    },

    last: function() {
        return this.nodes[this.nodes.length - 1];
    },

    contains: function(node) {
        return this.nodes.indexOf(node) >= 0;
    },

    isOneWay: function() {
        return this.tags.oneway === 'yes' ||
            this.tags.waterway === 'river' ||
            this.tags.waterway === 'stream';
    },

    isClosed: function() {
        return this.nodes.length > 0 && this.first() === this.last();
    },

    isArea: function() {
        if (this.tags.area === 'yes')
            return true;
        if (!this.isClosed() || this.tags.area === 'no')
            return false;
        for (var key in this.tags)
            if (key in iD.Way.areaKeys && !(this.tags[key] in iD.Way.areaKeys[key]))
                return true;
        return false;
    },

    isDegenerate: function() {
        return _.uniq(this.nodes).length < (this.isArea() ? 3 : 2);
    },

    geometry: function() {
        return this.isArea() ? 'area' : 'line';
    },

    addNode: function(id, index) {
        var nodes = this.nodes.slice();
        nodes.splice(index === undefined ? nodes.length : index, 0, id);
        return this.update({nodes: nodes});
    },

    updateNode: function(id, index) {
        var nodes = this.nodes.slice();
        nodes.splice(index, 1, id);
        return this.update({nodes: nodes});
    },

    replaceNode: function(needle, replacement) {
        if (this.nodes.indexOf(needle) < 0)
            return this;

        var nodes = this.nodes.slice();
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i] === needle) {
                nodes[i] = replacement;
            }
        }
        return this.update({nodes: nodes});
    },

    removeNode: function(id) {
        var nodes = _.without(this.nodes, id);

        // Preserve circularity
        if (this.nodes.length > 1 && this.first() === id && this.last() === id) {
            nodes.push(nodes[0]);
        }

        return this.update({nodes: nodes});
    },

    asJXON: function(changeset_id) {
        var r = {
            way: {
                '@id': this.osmId(),
                '@version': this.version || 0,
                nd: _.map(this.nodes, function(id) {
                    return { keyAttributes: { ref: iD.Entity.id.toOSM(id) } };
                }),
                tag: _.map(this.tags, function(v, k) {
                    return { keyAttributes: { k: k, v: v } };
                })
            }
        };
        if (changeset_id) r.way['@changeset'] = changeset_id;
        return r;
    },

    asGeoJSON: function(resolver, close) {

        var childnodes = resolver.childNodes(this);

        // Close unclosed way
        if (close && !this.isClosed() && childnodes.length) {
            childnodes = childnodes.concat([childnodes[0]]);
        }

        if (this.isArea() && (close || this.isClosed())) {
            return {
                type: 'Feature',
                properties: this.tags,
                geometry: {
                    type: 'Polygon',
                    coordinates: [_.pluck(childnodes, 'loc')]
                }
            };
        } else {
            return {
                type: 'Feature',
                properties: this.tags,
                geometry: {
                    type: 'LineString',
                    coordinates: _.pluck(childnodes, 'loc')
                }
            };
        }
    }
});

// A closed way is considered to be an area if it has a tag with one
// of the following keys, and the value is _not_ one of the associated
// values for the respective key.
iD.Way.areaKeys = {
    area: {},
    building: {},
    leisure: {},
    tourism: {},
    ruins: {},
    historic: {},
    landuse: {},
    military: {},
    natural: { coastline: true },
    amenity: {},
    shop: {},
    man_made: {},
    public_transport: {},
    place: {},
    aeroway: {}
};
