iD.Way = function(sources) {
    if (!sources.length || sources.length === 0) sources = [sources];
    for (var i = 0; i < sources.length; ++i) {
        var source = sources[i];
        for (var prop in source) {
            if (Object.prototype.hasOwnProperty.call(source, prop)) {
                this[prop] = source[prop];
            }
        }
    }

    if (!this.id && this.type) {
        this.id = iD.Entity.id(this.type);
        this._updated = true;
    }

    if (iD.debug) {
        Object.freeze(this);
        Object.freeze(this.tags);

        if (this.nodes) Object.freeze(this.nodes);
        if (this.members) Object.freeze(this.members);
    }
};

iD.Way.prototype = {
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

    geometry: function() {
        return this.isArea() ? 'area' : 'line';
    }
};

iD.Entity.simpleExtend(iD.Way, iD.Entity);
iD.Entity.way = iD.Way;
