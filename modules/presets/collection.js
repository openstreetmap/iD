import _find from 'lodash-es/find';
import _findIndex from 'lodash-es/findIndex';
import _some from 'lodash-es/some';
import _uniq from 'lodash-es/uniq';
import _values from 'lodash-es/values';
import _without from 'lodash-es/without';

import { utilEditDistance } from '../util/index';


export function presetCollection(collection) {
    var maxSearchResults = 50;

    var presets = {

        collection: collection,


        item: function(id) {
            return _find(this.collection, function(d) {
                return d.id === id;
            });
        },

        index: function(id) {
            return _findIndex(this.collection, function(d) {
                return d.id === id;
            });
        },

        matchGeometry: function(geometry) {
            return presetCollection(this.collection.filter(function(d) {
                return d.matchGeometry(geometry);
            }));
        },


        search: function(value, geometry) {
            if (!value) return this;

            value = value.toLowerCase();

            // match at name beginning or just after a space (e.g. "office" -> match "Law Office")
            function leading(a) {
                var index = a.indexOf(value);
                return index === 0 || a[index - 1] === ' ';
            }

            // match at name beginning only
            function leadingStrict(a) {
                var index = a.indexOf(value);
                return index === 0;
            }

            function sortNames(a, b) {
                var aCompare = (a.suggestion ? a.originalName : a.name()).toLowerCase();
                var bCompare = (b.suggestion ? b.originalName : b.name()).toLowerCase();

                // priority if search string matches preset name exactly - #4325
                if (value === aCompare) return -1;
                if (value === bCompare) return 1;

                // priority for higher matchScore
                var i = b.originalScore - a.originalScore;
                if (i !== 0) return i;

                // priority if search string appears earlier in preset name
                i = aCompare.indexOf(value) - bCompare.indexOf(value);
                if (i !== 0) return i;

                // priority for shorter preset names
                return aCompare.length - bCompare.length;
            }


            var searchable = this.collection.filter(function(a) {
                return a.searchable !== false && a.suggestion !== true;
            });
            var suggestions = this.collection.filter(function(a) {
                return a.suggestion === true;
            });

            // matches value to preset.name
            var leading_name = searchable
                .filter(function(a) {
                    return leading(a.name().toLowerCase());
                }).sort(sortNames);

            // matches value to preset.terms values
            var leading_terms = searchable
                .filter(function(a) {
                    return _some(a.terms() || [], leading);
                });

            // matches value to preset.tags values
            var leading_tag_values = searchable
                .filter(function(a) {
                    return _some(_without(_values(a.tags || {}), '*'), leading);
                });

            var leading_suggestions = suggestions
                .filter(function(a) {
                    return leadingStrict(a.originalName.toLowerCase());
                }).sort(sortNames);

            // finds close matches to value in preset.name
            var similar_name = searchable
                .map(function(a) {
                    return { preset: a, dist: utilEditDistance(value, a.name()) };
                }).filter(function(a) {
                    return a.dist + Math.min(value.length - a.preset.name().length, 0) < 3;
                }).sort(function(a, b) {
                    return a.dist - b.dist;
                }).map(function(a) {
                    return a.preset;
                });

            // finds close matches to value in preset.terms
            var similar_terms = searchable
                .filter(function(a) {
                    return _some(a.terms() || [], function(b) {
                        return utilEditDistance(value, b) + Math.min(value.length - b.length, 0) < 3;
                    });
                });

            var similar_suggestions = suggestions
                .map(function(a) {
                    return { preset: a, dist: utilEditDistance(value, a.originalName.toLowerCase()) };
                }).filter(function(a) {
                    return a.dist + Math.min(value.length - a.preset.originalName.length, 0) < 1;
                }).sort(function(a, b) {
                    return a.dist - b.dist;
                }).map(function(a) {
                    return a.preset;
                });

            var other = presets.item(geometry);

            var results = leading_name.concat(
                leading_suggestions,
                leading_terms,
                leading_tag_values,
                similar_name,
                similar_suggestions,
                similar_terms
            ).slice(0, maxSearchResults - 1);

            return presetCollection(_uniq(results.concat(other)));
        }
    };


    return presets;
}
