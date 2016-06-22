(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.iD = global.iD || {}, global.iD.presets = global.iD.presets || {})));
}(this, function (exports) { 'use strict';

    function Collection(collection) {
        var maxSearchResults = 50,
            maxSuggestionResults = 10;

        var presets = {

            collection: collection,

            item: function(id) {
                return _.find(collection, function(d) {
                    return d.id === id;
                });
            },

            matchGeometry: function(geometry) {
                return Collection(collection.filter(function(d) {
                    return d.matchGeometry(geometry);
                }));
            },

            search: function(value, geometry) {
                if (!value) return this;

                value = value.toLowerCase();

                var searchable = _.filter(collection, function(a) {
                        return a.searchable !== false && a.suggestion !== true;
                    }),
                    suggestions = _.filter(collection, function(a) {
                        return a.suggestion === true;
                    });

                function leading(a) {
                    var index = a.indexOf(value);
                    return index === 0 || a[index - 1] === ' ';
                }

                // matches value to preset.name
                var leading_name = _.filter(searchable, function(a) {
                        return leading(a.name().toLowerCase());
                    }).sort(function(a, b) {
                        var i = a.name().toLowerCase().indexOf(value) - b.name().toLowerCase().indexOf(value);
                        if (i === 0) return a.name().length - b.name().length;
                        else return i;
                    });

                // matches value to preset.terms values
                var leading_terms = _.filter(searchable, function(a) {
                        return _.some(a.terms() || [], leading);
                    });

                // matches value to preset.tags values
                var leading_tag_values = _.filter(searchable, function(a) {
                        return _.some(_.without(_.values(a.tags || {}), '*'), leading);
                    });


                // finds close matches to value in preset.name
                var levenstein_name = searchable.map(function(a) {
                        return {
                            preset: a,
                            dist: iD.util.editDistance(value, a.name().toLowerCase())
                        };
                    }).filter(function(a) {
                        return a.dist + Math.min(value.length - a.preset.name().length, 0) < 3;
                    }).sort(function(a, b) {
                        return a.dist - b.dist;
                    }).map(function(a) {
                        return a.preset;
                    });

                // finds close matches to value in preset.terms
                var leventstein_terms = _.filter(searchable, function(a) {
                        return _.some(a.terms() || [], function(b) {
                            return iD.util.editDistance(value, b) + Math.min(value.length - b.length, 0) < 3;
                        });
                    });

                function suggestionName(name) {
                    var nameArray = name.split(' - ');
                    if (nameArray.length > 1) {
                        name = nameArray.slice(0, nameArray.length-1).join(' - ');
                    }
                    return name.toLowerCase();
                }

                var leading_suggestions = _.filter(suggestions, function(a) {
                        return leading(suggestionName(a.name()));
                    }).sort(function(a, b) {
                        a = suggestionName(a.name());
                        b = suggestionName(b.name());
                        var i = a.indexOf(value) - b.indexOf(value);
                        if (i === 0) return a.length - b.length;
                        else return i;
                    });

                var leven_suggestions = suggestions.map(function(a) {
                        return {
                            preset: a,
                            dist: iD.util.editDistance(value, suggestionName(a.name()))
                        };
                    }).filter(function(a) {
                        return a.dist + Math.min(value.length - suggestionName(a.preset.name()).length, 0) < 1;
                    }).sort(function(a, b) {
                        return a.dist - b.dist;
                    }).map(function(a) {
                        return a.preset;
                    });

                var other = presets.item(geometry);

                var results = leading_name.concat(
                                leading_terms,
                                leading_tag_values,
                                leading_suggestions.slice(0, maxSuggestionResults+5),
                                levenstein_name,
                                leventstein_terms,
                                leven_suggestions.slice(0, maxSuggestionResults)
                            ).slice(0, maxSearchResults-1);

                return Collection(_.uniq(
                        results.concat(other)
                    ));
            }
        };

        return presets;
    }

    function Category(id, category, all) {
        category = _.clone(category);

        category.id = id;

        category.members = Collection(category.members.map(function(id) {
            return all.item(id);
        }));

        category.matchGeometry = function(geometry) {
            return category.geometry.indexOf(geometry) >= 0;
        };

        category.matchScore = function() { return -1; };

        category.name = function() {
            return t('presets.categories.' + id + '.name', {'default': id});
        };

        category.terms = function() {
            return [];
        };

        return category;
    }

    function Field(id, field) {
        field = _.clone(field);

        field.id = id;

        field.matchGeometry = function(geometry) {
            return !field.geometry || field.geometry === geometry;
        };

        field.t = function(scope, options) {
            return t('presets.fields.' + id + '.' + scope, options);
        };

        field.label = function() {
            return field.t('label', {'default': id});
        };

        var placeholder = field.placeholder;
        field.placeholder = function() {
            return field.t('placeholder', {'default': placeholder});
        };

        return field;
    }

    function Preset(id, preset, fields) {
        preset = _.clone(preset);

        preset.id = id;
        preset.fields = (preset.fields || []).map(getFields);
        preset.geometry = (preset.geometry || []);

        function getFields(f) {
            return fields[f];
        }

        preset.matchGeometry = function(geometry) {
            return preset.geometry.indexOf(geometry) >= 0;
        };

        var matchScore = preset.matchScore || 1;
        preset.matchScore = function(entity) {
            var tags = preset.tags,
                score = 0;

            for (var t in tags) {
                if (entity.tags[t] === tags[t]) {
                    score += matchScore;
                } else if (tags[t] === '*' && t in entity.tags) {
                    score += matchScore / 2;
                } else {
                    return -1;
                }
            }

            return score;
        };

        preset.t = function(scope, options) {
            return t('presets.presets.' + id + '.' + scope, options);
        };

        var name = preset.name;
        preset.name = function() {
            if (preset.suggestion) {
                id = id.split('/');
                id = id[0] + '/' + id[1];
                return name + ' - ' + t('presets.presets.' + id + '.name');
            }
            return preset.t('name', {'default': name});
        };

        preset.terms = function() {
            return preset.t('terms', {'default': ''}).toLowerCase().trim().split(/\s*,+\s*/);
        };

        preset.isFallback = function() {
            var tagCount = Object.keys(preset.tags).length;
            return tagCount === 0 || (tagCount === 1 && preset.tags.hasOwnProperty('area'));
        };

        preset.reference = function(geometry) {
            var key = Object.keys(preset.tags)[0],
                value = preset.tags[key];

            if (geometry === 'relation' && key === 'type') {
                return { rtype: value };
            } else if (value === '*') {
                return { key: key };
            } else {
                return { key: key, value: value };
            }
        };

        var removeTags = preset.removeTags || preset.tags;
        preset.removeTags = function(tags, geometry) {
            tags = _.omit(tags, _.keys(removeTags));

            for (var f in preset.fields) {
                var field = preset.fields[f];
                if (field.matchGeometry(geometry) && field.default === tags[field.key]) {
                    delete tags[field.key];
                }
            }

            delete tags.area;
            return tags;
        };

        var applyTags = preset.addTags || preset.tags;
        preset.applyTags = function(tags, geometry) {
            var k;

            tags = _.clone(tags);

            for (k in applyTags) {
                if (applyTags[k] === '*') {
                    tags[k] = 'yes';
                } else {
                    tags[k] = applyTags[k];
                }
            }

            // Add area=yes if necessary.
            // This is necessary if the geometry is already an area (e.g. user drew an area) AND any of:
            // 1. chosen preset could be either an area or a line (`barrier=city_wall`)
            // 2. chosen preset doesn't have a key in areaKeys (`railway=station`)
            if (geometry === 'area') {
                var needsAreaTag = true;
                if (preset.geometry.indexOf('line') === -1) {
                    for (k in applyTags) {
                        if (k in iD.areaKeys) {
                            needsAreaTag = false;
                            break;
                        }
                    }
                }
                if (needsAreaTag) {
                    tags.area = 'yes';
                }
            }

            for (var f in preset.fields) {
                var field = preset.fields[f];
                if (field.matchGeometry(geometry) && field.key && !tags[field.key] && field.default) {
                    tags[field.key] = field.default;
                }
            }

            return tags;
        };

        return preset;
    }

    function presets() {
        // an iD.presets.Collection with methods for
        // loading new data and returning defaults

        var all = Collection([]),
            defaults = { area: all, line: all, point: all, vertex: all, relation: all },
            fields = {},
            universal = [],
            recent = Collection([]);

        // Index of presets by (geometry, tag key).
        var index = {
            point: {},
            vertex: {},
            line: {},
            area: {},
            relation: {}
        };

        all.match = function(entity, resolver) {
            var geometry = entity.geometry(resolver),
                geometryMatches = index[geometry],
                best = -1,
                match;

            for (var k in entity.tags) {
                var keyMatches = geometryMatches[k];
                if (!keyMatches) continue;

                for (var i = 0; i < keyMatches.length; i++) {
                    var score = keyMatches[i].matchScore(entity);
                    if (score > best) {
                        best = score;
                        match = keyMatches[i];
                    }
                }
            }

            return match || all.item(geometry);
        };

        // Because of the open nature of tagging, iD will never have a complete
        // list of tags used in OSM, so we want it to have logic like "assume
        // that a closed way with an amenity tag is an area, unless the amenity
        // is one of these specific types". This function computes a structure
        // that allows testing of such conditions, based on the presets designated
        // as as supporting (or not supporting) the area geometry.
        //
        // The returned object L is a whitelist/blacklist of tags. A closed way
        // with a tag (k, v) is considered to be an area if `k in L && !(v in L[k])`
        // (see `iD.Way#isArea()`). In other words, the keys of L form the whitelist,
        // and the subkeys form the blacklist.
        all.areaKeys = function() {
            var areaKeys = {},
                ignore = ['barrier', 'highway', 'footway', 'railway', 'type'],
                presets = _.reject(all.collection, 'suggestion');

            // whitelist
            presets.forEach(function(d) {
                for (var key in d.tags) break;
                if (!key) return;
                if (ignore.indexOf(key) !== -1) return;

                if (d.geometry.indexOf('area') !== -1) {
                    areaKeys[key] = areaKeys[key] || {};
                }
            });

            // blacklist
            presets.forEach(function(d) {
                for (var key in d.tags) break;
                if (!key) return;
                if (ignore.indexOf(key) !== -1) return;

                var value = d.tags[key];
                if (d.geometry.indexOf('area') === -1 &&
                    d.geometry.indexOf('line') !== -1 &&
                    key in areaKeys && value !== '*') {
                    areaKeys[key][value] = true;
                }
            });

            return areaKeys;
        };

        all.load = function(d) {

            if (d.fields) {
                _.forEach(d.fields, function(d, id) {
                    fields[id] = Field(id, d);
                    if (d.universal) universal.push(fields[id]);
                });
            }

            if (d.presets) {
                _.forEach(d.presets, function(d, id) {
                    all.collection.push(Preset(id, d, fields));
                });
            }

            if (d.categories) {
                _.forEach(d.categories, function(d, id) {
                    all.collection.push(Category(id, d, all));
                });
            }

            if (d.defaults) {
                var getItem = _.bind(all.item, all);
                defaults = {
                    area: Collection(d.defaults.area.map(getItem)),
                    line: Collection(d.defaults.line.map(getItem)),
                    point: Collection(d.defaults.point.map(getItem)),
                    vertex: Collection(d.defaults.vertex.map(getItem)),
                    relation: Collection(d.defaults.relation.map(getItem))
                };
            }

            for (var i = 0; i < all.collection.length; i++) {
                var preset = all.collection[i],
                    geometry = preset.geometry;

                for (var j = 0; j < geometry.length; j++) {
                    var g = index[geometry[j]];
                    for (var k in preset.tags) {
                        (g[k] = g[k] || []).push(preset);
                    }
                }
            }

            return all;
        };

        all.field = function(id) {
            return fields[id];
        };

        all.universal = function() {
            return universal;
        };

        all.defaults = function(geometry, n) {
            var rec = recent.matchGeometry(geometry).collection.slice(0, 4),
                def = _.uniq(rec.concat(defaults[geometry].collection)).slice(0, n - 1);
            return Collection(_.uniq(rec.concat(def).concat(all.item(geometry))));
        };

        all.choose = function(preset) {
            if (!preset.isFallback()) {
                recent = Collection(_.uniq([preset].concat(recent.collection)));
            }
            return all;
        };

        return all;
    }

    exports.Category = Category;
    exports.Collection = Collection;
    exports.Field = Field;
    exports.Preset = Preset;
    exports.presets = presets;

    Object.defineProperty(exports, '__esModule', { value: true });

}));