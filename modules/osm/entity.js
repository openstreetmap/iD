import { debug, osmIdManager } from '../index';
import { osmIsInterestingTag } from './tags';
import { utilArrayUnion } from '../util/array';
import { utilUnicodeCharsTruncated } from '../util/util';


export function osmEntity(attrs) {
    // For prototypal inheritance.
    if (this instanceof osmEntity) return;

    // Create the appropriate subtype.
    if (attrs && attrs.type) {
        return new osmEntity[attrs.type](...arguments);
    } else if (attrs && attrs.id) {
        return new osmEntity[osmIdManager.type(attrs.id)](...arguments);
    }

    // Initialize a generic Entity (used only in tests).
    return (new osmEntity()).initialize(arguments);
}


// A function suitable for use as the second argument to d3.selection#data().
osmEntity.key = function(entity) {
    return entity.id + 'v' + (entity.v || 0);
};


osmEntity.prototype = {

    /** @type {Tags} */
    tags: {},

    /** @type {String} */
    id: undefined,

    /** @type {number | undefined} */
    v: undefined,

    /** @type {boolean | undefined} */
    visible: undefined,

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
            this.id = osmIdManager.newId(this.type);
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
        if (copies[this.id]) return copies[this.id];

        var copy = osmEntity(this, { id: undefined, user: undefined, version: undefined });
        copies[this.id] = copy;

        return copy;
    },


    osmId: function() {
        return osmIdManager.toOSM(this.id);
    },


    isNew: function() {
        var osmId = osmIdManager.toOSM(this.id);
        return osmId.length === 0 || osmId[0] === '-';
    },


    update: function(attrs) {
        return osmEntity(this, attrs, { v: 1 + (this.v || 0) });
    },


    /**
     *
     * @param {Tags} tags tags to merge into this entity's tags
     * @param {Tags} setTags (optional) a set of tags to overwrite in this entity's tags
     * @returns {typeof this}
     */
    mergeTags: function(tags, setTags = {}) {
        const merged = Object.assign({}, this.tags);   // shallow copy
        let changed = false;

        for (const k in tags) {
            if (setTags.hasOwnProperty(k)) continue;
            const t1 = this.tags[k];
            const t2 = tags[k];
            if (!t1) {
                changed = true;
                merged[k] = t2;
            } else if (t1 !== t2) {
                changed = true;
                merged[k] = utilUnicodeCharsTruncated(
                    utilArrayUnion(t1.split(/;\s*/), t2.split(/;\s*/)).join(';'),
                    255 // avoid exceeding character limit; see also context.maxCharsForTagValue()
                );
            }
        }
        for (const k in setTags) {
            if (this.tags[k] !== setTags[k]) {
                changed = true;
                merged[k] = setTags[k];
            }
        }

        return changed ? this.update({ tags: merged }) : this;
    },


    intersects: function(extent, resolver) {
        return this.extent(resolver).intersects(extent);
    },


    hasNonGeometryTags: function() {
        return Object.keys(this.tags).some(function(k) { return k !== 'area'; });
    },

    hasParentRelations: function(resolver) {
        return resolver.parentRelations(this).length > 0;
    },

    hasInterestingTags: function() {
        return Object.keys(this.tags).some(osmIsInterestingTag);
    },

    isDegenerate: function() {
        return true;
    },
};
