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
            var extent = [[-Infinity, Infinity], [Infinity, -Infinity]];
            for (var i = 0, l = this.nodes.length; i < l; i++) {
                var node = resolver.entity(this.nodes[i]);
                if (node.loc[0] > extent[0][0]) extent[0][0] = node.loc[0];
                if (node.loc[0] < extent[1][0]) extent[1][0] = node.loc[0];
                if (node.loc[1] < extent[0][1]) extent[0][1] = node.loc[1];
                if (node.loc[1] > extent[1][1]) extent[1][1] = node.loc[1];
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
};

iD.Entity.simpleExtend(iD.Way, iD.Entity);
iD.Entity.way = iD.Way;
