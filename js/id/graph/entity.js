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

// A function suitable for use as the second argument to d3.selection#data().
iD.Entity.key = function (entity) {
    return entity.id;
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

            if (this.loc) Object.freeze(this.loc);
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

    intersects: function(extent, resolver) {
        return this.extent(resolver).intersects(extent);
    },

    hasInterestingTags: function() {
        return _.keys(this.tags).some(function (key) {
            return key != "attribution" &&
                key != "created_by" &&
                key != "source" &&
                key != 'odbl' &&
                key.indexOf('tiger:') !== 0;
        });
    },

    friendlyName: function() {
        // Generate a string such as 'river' or 'Fred's House' for an entity.
        if (!this.tags || !Object.keys(this.tags).length) { return ''; }

        var mainkeys = ['highway','amenity','railway','waterway','natural'],
            n = [];

        if (this.tags.name) n.push(this.tags.name);
        if (this.tags.ref) n.push(this.tags.ref);

        if (!n.length) {
            for (var k in this.tags) {
                if (mainkeys.indexOf(k) !== -1) {
                    n.push(this.tags[k]);
                    break;
                }
            }
        }

        return n.length === 0 ? 'unknown' : n.join('; ');
    }
};
