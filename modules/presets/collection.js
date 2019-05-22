import { utilEditDistance, utilArrayMapTruthy } from '../util';


export function presetCollection(collection) {
    var maxSearchResults = 50;

    var presets = {

        collection: collection,


        item: function(id) {
            return this.collection.find(function(d) {
                return d.id === id;
            });
        },

        index: function(id) {
            return this.collection.findIndex(function(d) {
                return d.id === id;
            });
        },

        matchGeometry: function(geometry) {
            return presetCollection(this.collection.filter(function(d) {
                return d.matchGeometry(geometry);
            }));
        },

        matchAnyGeometry: function(geometries) {
            return presetCollection(this.collection.filter(function(d) {
                return geometries.some(function(geometry) {
                    return d.matchGeometry(geometry);
                });
            }));
        },

        fallback: function(geometry) {
            var id = geometry;
            if (id === 'vertex') id = 'point';
            return this.item(id);
        },

        search: function(value, geometry, countryCode) {
            if (!value) return [];

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

            function getMatchWord(match) {
                if (match.alias) return match.alias;
                if (match.term) return match.term;
                if (match.tagValue) return match.tagValue;
                if (match.preset.suggestion) return match.preset.originalName;
                return match.preset.name();
            }

            function sortMatches(a, b) {
                var aCompare = getMatchWord(a).toLowerCase();
                var bCompare = getMatchWord(b).toLowerCase();

                // priority if search string matches word exactly - #4325
                if (value === aCompare) return -1;
                if (value === bCompare) return 1;

                // priority for smaller edit distance
                var i = a.fuzziness - b.fuzziness;
                if (i !== 0) return i;

                // priority for higher matchScore
                i = b.preset.originalScore - a.preset.originalScore;
                if (i !== 0) return i;

                // priority if search string appears earlier in word
                i = aCompare.indexOf(value) - bCompare.indexOf(value);
                if (i !== 0) return i;

                // priority for shorter words
                return aCompare.length - bCompare.length;
            }

            // take those presets from the source array for which the given function
            // returns a match and sort the resulting list of matches
            function take(array, fn) {
                return utilArrayMapTruthy(array, function (val, i) {
                    var r = fn.call(null, val, i, array);
                    if (r) array[i] = null;
                    return r;
                }).sort(sortMatches);
            }

            var pool = this.collection;
            if (countryCode) {
                pool = pool.filter(function(a) {
                    if (!a.countryCodes) return true;
                    return a.countryCodes.indexOf(countryCode) !== -1;
                });
            }
            var searchable = pool.filter(function(a) {
                return a.searchable !== false && a.suggestion !== true;
            });
            var suggestions = pool.filter(function(a) {
                return a.suggestion === true;
            });

            // matches value to preset.name
            var leading_name = take(searchable, function(a) {
                if (leading(a.name().toLowerCase())) return { preset: a };
            });

            // matches value to preset.aliases values
            var leading_aliases = take(searchable, function(a) {
                var aliases = a.aliases();
                for (var i = 0; i < aliases.length; i++) {
                    var alias = aliases[i];
                    if (leading(alias.toLowerCase())) return { preset: a, alias: alias };
                }
            });

            // matches value to preset.terms values
            var leading_terms = take(searchable, function(a) {
                var terms = a.terms();
                for (var i = 0; i < terms.length; i++) {
                    var term = terms[i];
                    if (leading(term)) return { preset: a, term: term };
                }
            });

            // matches value to preset.tags values
            var leading_tag_values = take(searchable, function(a) {
                var tagValues = Object.values(a.tags || []);
                for (var i = 0; i < tagValues.length; i++) {
                    var tagValue = tagValues[i];
                    if (tagValue !== '*' && leading(tagValue)) {
                        return { preset: a, tagValue: tagValue };
                    }
                }
            });

            var leading_suggestions = take(suggestions, function(a) {
                if (leadingStrict(a.originalName.toLowerCase())) return { preset: a };
            });

            // finds close matches to value in preset.name
            var similar_name = take(searchable, function(a) {
                var dist = utilEditDistance(value, a.name());
                if (dist + Math.min(value.length - a.name().length, 0) < 3) {
                    return { preset: a, fuzziness: dist };
                }
            });

            // finds close matches to value in preset.aliases
            var similar_aliases = take(searchable, function(a) {
                return utilArrayMapTruthy(a.aliases(), function(alias) {
                    var dist = utilEditDistance(value, alias);
                    if (dist + Math.min(value.length - alias.length, 0) < 3) {
                        return { preset: a, alias: alias, fuzziness: dist };
                    }
                // only keep the one match with the lowest fuzziness
                }).sort(function(a,b) { return a.fuzziness - b.fuzziness; })[0];
            });

            // finds close matches to value in preset.terms
            var similar_terms = take(searchable, function(a) {
                return utilArrayMapTruthy(a.terms(), function(term) {
                    var dist = utilEditDistance(value, term);
                    if (dist + Math.min(value.length - term.length, 0) < 3) {
                        return { preset: a, term: term, fuzziness: dist };
                    }
                // only keep the one match with the lowest fuzziness
                }).sort(function(a,b) { return a.fuzziness - b.fuzziness; })[0];
            });

            var similar_suggestions = take(suggestions, function(a) {
                var dist = utilEditDistance(value, a.originalName);
                if (dist + Math.min(value.length - a.originalName.length, 0) < 1) {
                    return { preset: a, fuzziness: dist };
                }
            });

            var results = leading_name.concat(
                leading_aliases,
                leading_suggestions,
                leading_terms,
                leading_tag_values,
                similar_name,
                similar_aliases,
                similar_suggestions,
                similar_terms
            ).slice(0, maxSearchResults - 1);

            if (geometry) {
                if (typeof geometry === 'string') {
                    results.push({ preset: presets.fallback(geometry) });
                } else {
                    geometry.forEach(function(geom) {
                        results.push({ preset: presets.fallback(geom) });
                    });
                }
            }

            return results;
        }
    };


    return presets;
}
