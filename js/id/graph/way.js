iD.Way = iD.Entity.extend({
    type: "way",
    nodes: [],

    extent: function(resolver) {
        return resolver.transient(this, 'extent', function() {
            var extent = iD.geo.Extent();
            for (var i = 0, l = this.nodes.length; i < l; i++) {
                var node = this.nodes[i];
                if (node.loc === undefined) node = resolver.entity(node);
                extent = extent.extend(node.loc);
            }
            return extent;
        });
    },

    isOneWay: function() {
        return this.tags.oneway === 'yes';
    },

    isClosed: function() {
        return this.nodes.length > 0 && this.nodes[this.nodes.length - 1] === this.nodes[0];
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

    geometry: function() {
        return this.isArea() ? 'area' : 'line';
    }
});
