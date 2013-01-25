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
            return this.nodes.reduce(function (extent, id) {
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
        return this.tags.oneway === 'yes';
    },

    isClosed: function() {
        return this.nodes.length > 0 && this.first() === this.last();
    },

    // a way is an area if:
    //
    // - area=yes
    // - closed and
    //   - doesn't have area=no
    //   - doesn't have highway tag
    isArea: function() {
        return this.tags.area === 'yes' ||
            (this.isClosed() &&
                this.tags.area !== 'no' &&
                !this.tags.highway &&
                !this.tags.barrier);
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

    removeNode: function(id) {
        var nodes = _.without(this.nodes, id);

        // Preserve circularity
        if (this.nodes.length > 1 && this.first() === id && this.last() === id) {
            nodes.push(nodes[0]);
        }

        return this.update({nodes: nodes});
    }
});
