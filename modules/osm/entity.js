import { osmIsInterestingTag } from './tags';
import { dataDeprecated } from '../../data/index';


export function osmEntity() {}

var _deprecatedTagValuesByKey;

osmEntity.deprecatedTagValuesByKey = function() {
    if (!_deprecatedTagValuesByKey) {
        _deprecatedTagValuesByKey = {};
        dataDeprecated.forEach(function(d) {
            var oldKeys = Object.keys(d.old);
            if (oldKeys.length === 1) {
                var oldKey = oldKeys[0];
                var oldValue = d.old[oldKey];
                if (oldValue !== '*') {
                    if (!_deprecatedTagValuesByKey[oldKey]) {
                        _deprecatedTagValuesByKey[oldKey] = [oldValue];
                    } else {
                        _deprecatedTagValuesByKey[oldKey].push(oldValue);
                    }
                }
            }
        });
    }
    return _deprecatedTagValuesByKey;
};

osmEntity.prototype = {

    hasNonGeometryTags: function() {
        return Object.keys(this.tags).some(function(k) { return k !== 'area'; });
    },

    hasInterestingTags: function() {
        return Object.keys(this.tags).some(osmIsInterestingTag);
    },

    hasWikidata: function() {
        return !!this.tags.wikidata || !!this.tags['brand:wikidata'];
    },

    isHighwayIntersection: function() {
        return false;
    },

    deprecatedTags: function() {
        var tags = this.tags;

        // if there are no tags, none can be deprecated
        if (Object.keys(tags).length === 0) return [];

        var deprecated = [];
        dataDeprecated.forEach(function(d) {
            var matchesDeprecatedTags = Object.keys(d.old).every(function(key) {
                if (!tags[key]) return false;
                if (d.old[key] === '*') return true;

                var vals = tags[key].split(';').filter(Boolean);
                if (vals.length === 0) {
                    return false;
                } else if (vals.length > 1) {
                    return vals.indexOf(d.old[key]) !== -1;
                } else {
                    if (tags[key] === d.old[key]) {
                        if (d.old[key] === d.replace[key]) {
                            return !Object.keys(d.replace).every(function(key) {
                                return tags[key] === d.replace[key];
                            });
                        } else {
                            return true;
                        }
                    }
                }
                return false;
            });
            if (matchesDeprecatedTags) {
                deprecated.push(d);
            }
        });

        return deprecated;
    }

};
