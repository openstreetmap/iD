iD.Entity = function(attrs) {
    // For prototypal inheritance.
    if (this instanceof iD.Entity) return;

    // Create the appropriate subtype.
    if (attrs && attrs.type) return iD.Entity[attrs.type].apply(this, arguments);

    // Initialize a generic Entity (used only in tests).
    return (new iD.Entity()).initialize(arguments);
};

iD.Entity.id = function (type) {
    return iD.Entity.id.fromOSM(type, iD.Entity.id.next[type]--);
};

iD.Entity.id.next = {node: -1, way: -1, relation: -1};

iD.Entity.id.fromOSM = function (type, id) {
    return type[0] + id;
};

iD.Entity.id.toOSM = function (id) {
    return +id.slice(1);
};

iD.Entity.prototype = {
    tags: {},

    initialize: function(sources) {
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

        return this;
    },

    osmId: function() {
        return iD.Entity.id.toOSM(this.id);
    },

    update: function(attrs) {
        return iD.Entity(this, attrs, {_updated: true});
    },

    created: function() {
        return this._updated && this.osmId() < 0;
    },

    modified: function() {
        return this._updated && this.osmId() > 0;
    },

    extent: function(resolver) {
        if (this.type === 'node') {
            return [this.loc, this.loc];
        } else if (this.type == 'way') {
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
        } else {
            return [[NaN, NaN], [NaN, NaN]];
        }
    },

    intersects: function(extent, resolver) {
        var _extent = this.extent(resolver);
        return _extent[0][0] > extent[0][0] &&
               _extent[1][0] < extent[1][0] &&
               _extent[0][1] < extent[0][1] &&
               _extent[1][1] > extent[1][1];
    },

    hasInterestingTags: function() {
        return _.keys(this.tags).some(function (key) {
            return key != "attribution" &&
                key != "created_by" &&
                key != "source" &&
                key != 'odbl' &&
                key.indexOf('tiger:') !== 0;
        });
    }
};

iD.Entity.extend = function(properties) {
    var Subclass = function() {
        if (this instanceof Subclass) return;
        return (new Subclass()).initialize(arguments);
    };

    Subclass.prototype = new iD.Entity();
    _.extend(Subclass.prototype, properties);
    iD.Entity[properties.type] = Subclass;

    return Subclass;
};
