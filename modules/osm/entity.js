import _ from 'lodash';
import { debug } from '../index';
import { osmIsInterestingTag } from './tags';
import { dataDeprecated } from '../../data/index';
import { freezeMap, getKeys } from '../util/map_collection';
export function osmEntity(attrs) {
    // For prototypal inheritance.
    if (this instanceof osmEntity) return;

    // Create the appropriate subtype.
    if (attrs && attrs.type) {
        return osmEntity[attrs.type].apply(this, arguments);
    } else if (attrs && attrs.id) {
        return osmEntity[osmEntity.id.type(attrs.id)].apply(this, arguments);
    }

    // Initialize a generic Entity (used only in tests).
    return (new osmEntity()).initialize(arguments);
}


osmEntity.id = function(type) {
    return osmEntity.id.fromOSM(type, osmEntity.id.next[type]--);
};


osmEntity.id.next = {
    changeset: -1, node: -1, way: -1, relation: -1
};


osmEntity.id.fromOSM = function(type, id) {
    return type[0] + id;
};


osmEntity.id.toOSM = function(id) {
    return id.slice(1);
};


osmEntity.id.type = function(id) {
    return { 'c': 'changeset', 'n': 'node', 'w': 'way', 'r': 'relation' }[id[0]];
};


// A function suitable for use as the second argument to d3.selection#data().
osmEntity.key = function(entity) {
    return entity.id + 'v' + (entity.v || 0);
};


osmEntity.prototype = {

    tags: new Map(),


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
            this.id = osmEntity.id(this.type);
        }
        if (!this.hasOwnProperty('visible')) {
            this.visible = true;
        }

        if (debug) {
            Object.freeze(this);
            window.ifNotMap(this.tags);
            freezeMap(this.tags);

            if (this.loc) Object.freeze(this.loc);
            if (this.nodes) Object.freeze(this.nodes);
            if (this.members) Object.freeze(this.members);
        }

        return this;
    },


    copy: function(resolver, copies) {
        if (copies[this.id])
            return copies[this.id];

        var copy = osmEntity(this, {id: undefined, user: undefined, version: undefined});
        copies[this.id] = copy;

        return copy;
    },


    osmId: function() {
        return osmEntity.id.toOSM(this.id);
    },


    isNew: function() {
        return this.osmId() < 0;
    },


    update: function(attrs) {
        return osmEntity(this, attrs, {v: 1 + (this.v || 0)});
    },


    mergeTags: function(tags) {
        window.ifNotMap(tags);
        var merged = _.clone(this.tags), changed = false;
        tags.forEach(function (v, k) {
            var t1 = merged.get(k),
                t2 = tags.get(k);
            if (!t1) {
                changed = true;
                merged.set(k, t2);
            } else if (t1 !== t2) {
                changed = true;
                merged.set(k, _.union(t1.split(/;\s*/), t2.split(/;\s*/)).join(';'));
            }
        });
        return changed ? this.update({tags: merged}) : this;
    },


    intersects: function(extent, resolver) {
        return this.extent(resolver).intersects(extent);
    },


    isUsed: function(resolver) {
        window.ifNotMap(this.tags);
        return _.without(getKeys(this.tags), 'area').length > 0 ||
            resolver.parentRelations(this).length > 0;
    },


    hasInterestingTags: function() {
        window.ifNotMap(this.tags);
        return getKeys(this.tags).some(osmIsInterestingTag);
    },


    isHighwayIntersection: function() {
        return false;
    },

    isDegenerate: function() {
        return true;
    },

    deprecatedTags: function() {
        window.ifNotMap(this.tags);
        var tags = _.toPairs(this.tags);
        var deprecated = new Map();

        dataDeprecated.forEach(function(d) {
            var match = _.toPairs(d.old)[0];
            tags.forEach(function(t) {
                if (t[0] === match[0] &&
                    (t[1] === match[1] || match[1] === '*')) {
                    deprecated.set(t[0], t[1]);
                }
            });
        });

        return deprecated;
    }
};
