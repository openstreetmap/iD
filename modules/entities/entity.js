import { debug } from '../index';
import { utilArrayUnion } from '../util';


export function entityEntity(attrs) {
    // For prototypal inheritance.
    if (this instanceof entityEntity) return;

    // Create the appropriate subtype.
    if (attrs && attrs.type) {
        return entityEntity[attrs.type].apply(this, arguments);
    } else if (attrs && attrs.id) {
        return entityEntity[entityEntity.id.type(attrs.id)].apply(this, arguments);
    }

    // Initialize a generic Entity (used only in tests).
    return (new entityEntity()).initialize(arguments);
}


entityEntity.id = function(type) {
    return entityEntity.id.toTyped(type, entityEntity.id.next[type]--);
};


entityEntity.id.next = {
    changeset: -1, node: -1, way: -1, relation: -1
};


entityEntity.id.toTyped = function(type, id) {
    return type[0] + id;
};


entityEntity.id.toUntyped = function(id) {
    return id.slice(1);
};


entityEntity.id.type = function(id) {
    return { 'c': 'changeset', 'n': 'node', 'w': 'way', 'r': 'relation' }[id[0]];
};


entityEntity.prototype = {

    tags: {},

    // the `id` combined with the local version
    key: function() {
        return this.id + 'v' + (this.v || 0);
    },

    initialize: function(sources) {
        for (var i = 0; i < sources.length; ++i) {
            var source = sources[i];
            for (var prop in source) {
                if (Object.prototype.hasOwnProperty.call(source, prop)) {
                    if (source[prop] === undefined) {
                        delete this[prop];
                    } else {
                        this[prop] = source[prop];
                    }
                }
            }
        }

        if (!this.id && this.type) {
            this.id = entityEntity.id(this.type);
        }
        if (!this.hasOwnProperty('visible')) {
            this.visible = true;
        }

        if (debug) {
            Object.freeze(this);
            Object.freeze(this.tags);

            if (this.loc) Object.freeze(this.loc);
            if (this.nodes) Object.freeze(this.nodes);
            if (this.members) Object.freeze(this.members);
        }

        return this;
    },

    copy: function(resolver, copies) {
        if (copies[this.id])
            return copies[this.id];

        var copy = entityEntity(this, { id: undefined, user: undefined, version: undefined });
        copies[this.id] = copy;

        return copy;
    },

    // The raw numeric ID without the type prefix.
    // This could collide with untyped IDs from entities of other types.
    untypedID: function() {
        return entityEntity.id.toUntyped(this.id);
    },

    isNew: function() {
        return this.untypedID() < 0;
    },

    update: function(attrs) {
        return entityEntity(this, attrs, { v: 1 + (this.v || 0) });
    },

    mergeTags: function(tags) {
        var merged = Object.assign({}, this.tags);   // shallow copy
        var changed = false;
        for (var k in tags) {
            var t1 = merged[k];
            var t2 = tags[k];
            if (!t1) {
                changed = true;
                merged[k] = t2;
            } else if (t1 !== t2) {
                changed = true;
                merged[k] = utilArrayUnion(t1.split(/;\s*/), t2.split(/;\s*/)).join(';');
            }
        }
        return changed ? this.update({ tags: merged }) : this;
    },

    intersects: function(extent, resolver) {
        return this.extent(resolver).intersects(extent);
    },

    hasParentRelations: function(resolver) {
        return resolver.parentRelations(this).length > 0;
    },

    hasInterestingTags: function() {
        return Object.keys(this.tags).length > 0;
    },

    hasNonGeometryTags: function() {
        return Object.keys(this.tags).length > 0;
    },

    isDegenerate: function() {
        return true;
    }

};
