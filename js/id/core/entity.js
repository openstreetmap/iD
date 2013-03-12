iD.Entity = function(attrs) {
    // For prototypal inheritance.
    if (this instanceof iD.Entity) return;

    // Create the appropriate subtype.
    if (attrs && attrs.type) {
        return iD.Entity[attrs.type].apply(this, arguments);
    }

    // Initialize a generic Entity (used only in tests).
    return (new iD.Entity()).initialize(arguments);
};

iD.Entity.id = function(type) {
    return iD.Entity.id.fromOSM(type, iD.Entity.id.next[type]--);
};

iD.Entity.id.next = {node: -1, way: -1, relation: -1};

iD.Entity.id.fromOSM = function(type, id) {
    return type[0] + id;
};

iD.Entity.id.toOSM = function(id) {
    return id.slice(1);
};

// A function suitable for use as the second argument to d3.selection#data().
iD.Entity.key = function(entity) {
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
        return iD.Entity(this, attrs);
    },

    mergeTags: function(tags) {
        var merged = _.clone(this.tags);
        for (var k in tags) {
            var t1 = merged[k],
                t2 = tags[k];
            if (t1 && t1 !== t2) {
                merged[k] = _.union(t1.split(/;\s*/), t2.split(/;\s*/)).join(';');
            } else {
                merged[k] = t2;
            }
        }
        return this.update({tags: merged});
    },

    intersects: function(extent, resolver) {
        return this.extent(resolver).intersects(extent);
    },

    hasInterestingTags: function() {
        return _.keys(this.tags).some(function(key) {
            return key != 'attribution' &&
                key != 'created_by' &&
                key != 'source' &&
                key != 'odbl' &&
                key.indexOf('tiger:') !== 0;
        });
    },

    deprecatedTags: function() {
        var tags = _.pairs(this.tags);
        var deprecated = {};

        iD.data.deprecated.forEach(function(d) {
            var match = _.pairs(d.old)[0];
            tags.forEach(function(t) {
                if (t[0] == match[0] &&
                    (t[1] == match[1] || match[1] == '*')) {
                    deprecated[t[0]] = t[1];
                }
            });
        });

        return deprecated;
    },

    friendlyName: function() {
        // Generate a string such as 'river' or 'Fred's House' for an entity.
        if (!this.tags || !Object.keys(this.tags).length) { return ''; }

        var mainkeys = ['highway', 'amenity', 'railway', 'waterway', 'natural'],
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
