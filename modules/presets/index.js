import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import { data } from '../../data/index';
import { osmNodeGeometriesForTags } from '../osm/tags';
import { presetCategory } from './category';
import { presetCollection } from './collection';
import { presetField } from './field';
import { presetPreset } from './preset';
import { utilArrayUniq, utilRebind } from '../util';

export { presetCategory };
export { presetCollection };
export { presetField };
export { presetPreset };


export function presetIndex(context) {
    // a presetCollection with methods for
    // loading new data and returning defaults

    var dispatch = d3_dispatch('recentsChange');

    var all = presetCollection([]);
    var _defaults = { area: all, line: all, point: all, vertex: all, relation: all };
    var _fields = {};
    var _universal = [];
    var _recents;
    // presets that the user can add
    var _addablePresetIDs;

    // Index of presets by (geometry, tag key).
    var _index = {
        point: {},
        vertex: {},
        line: {},
        area: {},
        relation: {}
    };

    all.match = function(entity, resolver) {
        return resolver.transient(entity, 'presetMatch', function() {
            var geometry = entity.geometry(resolver);

            // Treat entities on addr:interpolation lines as points, not vertices - #3241
            if (geometry === 'vertex' && entity.isOnAddressLine(resolver)) {
                geometry = 'point';
            }

            return all.matchTags(entity.tags, geometry);
        });
    };

    all.matchTags = function(tags, geometry) {

        var address;
        var geometryMatches = _index[geometry];
        var best = -1;
        var match;

        for (var k in tags) {
            // If any part of an address is present,
            // allow fallback to "Address" preset - #4353
            if (/^addr:/.test(k) && geometryMatches['addr:*']) {
                address = geometryMatches['addr:*'][0];
            }

            var keyMatches = geometryMatches[k];
            if (!keyMatches) continue;

            for (var i = 0; i < keyMatches.length; i++) {
                var score = keyMatches[i].matchScore(tags);
                if (score > best) {
                    best = score;
                    match = keyMatches[i];
                }
            }

        }

        if (address && (!match || match.isFallback())) {
            match = address;
        }
        return match || all.fallback(geometry);
    };

    all.allowsVertex = function(entity, resolver) {
        if (entity.type !== 'node') return false;
        if (Object.keys(entity.tags).length === 0) return true;

        return resolver.transient(entity, 'vertexMatch', function() {
            // address lines allow vertices to act as standalone points
            if (entity.isOnAddressLine(resolver)) return true;

            var geometries = osmNodeGeometriesForTags(entity.tags);
            if (geometries.vertex) return true;
            if (geometries.point) return false;
            // allow vertices for unspecified points
            return true;
        });
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
    // (see `Way#isArea()`). In other words, the keys of L form the whitelist,
    // and the subkeys form the blacklist.
    all.areaKeys = function() {
        var areaKeys = {};
        var ignore = ['barrier', 'highway', 'footway', 'railway', 'junction', 'type'];  // probably a line..

        // ignore name-suggestion-index and deprecated presets
        var presets = all.collection.filter(function(p) {
            return !p.suggestion && !p.replacement;
        });

        // whitelist
        presets.forEach(function(d) {
            for (var key in d.tags) break;
            if (!key) return;
            if (ignore.indexOf(key) !== -1) return;

            if (d.geometry.indexOf('area') !== -1) {    // probably an area..
                areaKeys[key] = areaKeys[key] || {};
            }
        });

        // blacklist
        presets.forEach(function(d) {
            for (var key in d.addTags) {
                // examine all addTags to get a better sense of what can be tagged on lines - #6800
                var value = d.addTags[key];
                if (key in areaKeys &&                      // probably an area...
                    d.geometry.indexOf('line') !== -1 &&    // but sometimes a line
                    value !== '*') {
                    areaKeys[key][value] = true;
                }
            }
        });

        return areaKeys;
    };

    all.pointTags = function() {
        return all.collection.reduce(function(pointTags, d) {
            // ignore name-suggestion-index, deprecated, and generic presets
            if (d.suggestion || d.replacement || d.searchable === false) return pointTags;

            // only care about the primary tag
            for (var key in d.tags) break;
            if (!key) return pointTags;

            // if this can be a point
            if (d.geometry.indexOf('point') !== -1) {
                pointTags[key] = pointTags[key] || {};
                pointTags[key][d.tags[key]] = true;
            }
            return pointTags;
        }, {});
    };

    all.vertexTags = function() {
        return all.collection.reduce(function(vertexTags, d) {
            // ignore name-suggestion-index, deprecated, and generic presets
            if (d.suggestion || d.replacement || d.searchable === false) return vertexTags;

            // only care about the primary tag
            for (var key in d.tags) break;
            if (!key) return vertexTags;

            // if this can be a vertex
            if (d.geometry.indexOf('vertex') !== -1) {
                vertexTags[key] = vertexTags[key] || {};
                vertexTags[key][d.tags[key]] = true;
            }
            return vertexTags;
        }, {});
    };

    all.build = function(d, addable) {
        if (d.fields) {
            Object.keys(d.fields).forEach(function(id) {
                var f = d.fields[id];
                _fields[id] = presetField(id, f);
                if (f.universal) {
                    _universal.push(_fields[id]);
                }
            });
        }

        if (d.presets) {
            var rawPresets = d.presets;
            Object.keys(d.presets).forEach(function(id) {
                var p = d.presets[id];
                var existing = all.index(id);
                var isAddable = typeof addable === 'function' ? addable(id, p) : addable;
                if (existing !== -1) {
                    all.collection[existing] = presetPreset(id, p, _fields, isAddable, rawPresets);
                } else {
                    all.collection.push(presetPreset(id, p, _fields, isAddable, rawPresets));
                }
            });
        }

        if (d.categories) {
            Object.keys(d.categories).forEach(function(id) {
                var c = d.categories[id];
                var existing = all.index(id);
                if (existing !== -1) {
                    all.collection[existing] = presetCategory(id, c, all);
                } else {
                    all.collection.push(presetCategory(id, c, all));
                }
            });
        }

        var getItem = (all.item).bind(all);
        if (_addablePresetIDs) {
            ['area', 'line', 'point', 'vertex', 'relation'].forEach(function(geometry) {
                _defaults[geometry] = presetCollection(_addablePresetIDs.map(getItem).filter(function(preset) {
                    return preset.geometry.indexOf(geometry) !== -1;
                }));
            });
        } else if (d.defaults) {
            _defaults = {
                area: presetCollection(d.defaults.area.map(getItem)),
                line: presetCollection(d.defaults.line.map(getItem)),
                point: presetCollection(d.defaults.point.map(getItem)),
                vertex: presetCollection(d.defaults.vertex.map(getItem)),
                relation: presetCollection(d.defaults.relation.map(getItem))
            };
        }

        for (var i = 0; i < all.collection.length; i++) {
            var preset = all.collection[i];
            var geometry = preset.geometry;

            for (var j = 0; j < geometry.length; j++) {
                var g = _index[geometry[j]];
                for (var k in preset.tags) {
                    (g[k] = g[k] || []).push(preset);
                }
            }
        }
        return all;
    };

    all.init = function(addablePresetIDs) {
        all.collection = [];
        _recents = null;
        _addablePresetIDs = addablePresetIDs;
        _fields = {};
        _universal = [];
        _index = { point: {}, vertex: {}, line: {}, area: {}, relation: {} };

        var addable = true;
        if (addablePresetIDs) {
            addable = function(presetID) {
                return addablePresetIDs.indexOf(presetID) !== -1;
            };
        }

        return all.build(data.presets, addable);
    };


    all.reset = function() {
        all.collection = [];
        _defaults = { area: all, line: all, point: all, vertex: all, relation: all };
        _fields = {};
        _universal = [];
        _recents = null;

        // Index of presets by (geometry, tag key).
        _index = {
            point: {},
            vertex: {},
            line: {},
            area: {},
            relation: {}
        };

        return all;
    };

    all.fromExternal = function(external, done) {
        all.reset();
        d3_json(external)
            .then(function(externalPresets) {
                all.build(data.presets, false);    // load the default presets as non-addable to start

                _addablePresetIDs = externalPresets.presets && Object.keys(externalPresets.presets);

                all.build(externalPresets, true);  // then load the external presets as addable
            })
            .catch(function() {
                all.init();
            })
            .finally(function() {
                done(all);
            });
    };

    all.field = function(id) {
        return _fields[id];
    };

    all.universal = function() {
        return _universal;
    };

    all.defaults = function(geometry, n) {
        var rec = [];
        if (!context.inIntro()) {
            rec = all.recent().matchGeometry(geometry).collection.slice(0, 4);
        }
        var def = utilArrayUniq(rec.concat(_defaults[geometry].collection)).slice(0, n - 1);
        return presetCollection(utilArrayUniq(rec.concat(def).concat(all.fallback(geometry))));
    };

    all.recent = function() {
        return presetCollection(utilArrayUniq(all.getRecents().map(function(d) {
            return d.preset;
        })));
    };

    function RibbonItem(preset, geometry, source) {
        var item = {};
        item.preset = preset;
        item.geometry = geometry;
        item.source = source;

        item.isRecent = function() {
            return item.source === 'recent';
        };
        item.matches = function(preset, geometry) {
            return item.preset.id === preset.id && item.geometry === geometry;
        };
        item.minified = function() {
            return {
                pID: item.preset.id,
                geom: item.geometry
            };
        };
        return item;
    }

    function ribbonItemForMinified(d, source) {
        if (d && d.pID && d.geom) {
            var preset = all.item(d.pID);
            if (!preset) return null;

            var geom = d.geom;
            // treat point and vertex features as one geometry
            if (geom === 'vertex') geom = 'point';

            // iD's presets could have changed since this was saved,
            // so make sure it's still valid.
            if (preset.matchGeometry(geom) || (geom === 'point' && preset.matchGeometry('vertex'))) {
                return RibbonItem(preset, geom, source);
            }
        }
        return null;
    }

    function setRecents(items) {
        _recents = items;
        var minifiedItems = items.map(function(d) { return d.minified(); });
        context.storage('preset_recents', JSON.stringify(minifiedItems));

        dispatch.call('recentsChange');
    }

    all.getRecents = function() {
        if (!_recents) {
            // fetch from local storage
            _recents = (JSON.parse(context.storage('preset_recents')) || [])
                .reduce(function(output, d) {
                    var item = ribbonItemForMinified(d, 'recent');
                    if (item && item.preset.addable()) output.push(item);
                    return output;
                }, []);
        }
        return _recents;
    };

    all.removeRecent = function(preset, geometry) {
        var item = all.recentMatching(preset, geometry);
        if (item) {
            var items = all.getRecents();
            items.splice(items.indexOf(item), 1);
            setRecents(items);
        }
    };

    all.recentMatching = function(preset, geometry) {
        geometry = all.fallback(geometry).id;
        var items = all.getRecents();
        for (var index in items) {
            if (items[index].matches(preset, geometry)) {
                return items[index];
            }
        }
        return null;
    };

    all.moveItem = function(items, fromIndex, toIndex) {
        if (fromIndex === toIndex ||
            fromIndex < 0 || toIndex < 0 ||
            fromIndex >= items.length || toIndex >= items.length) return null;
        items.splice(toIndex, 0, items.splice(fromIndex, 1)[0]);
        return items;
    };

    all.moveRecent = function(item, beforeItem) {
        var recents = all.getRecents();
        var fromIndex = recents.indexOf(item);
        var toIndex = recents.indexOf(beforeItem);
        var items = all.moveItem(recents, fromIndex, toIndex);
        if (items) setRecents(items);
    };

    all.setMostRecent = function(preset, geometry) {
        if (context.inIntro()) return;
        if (preset.searchable === false) return;

        geometry = all.fallback(geometry).id;

        var items = all.getRecents();
        var item = all.recentMatching(preset, geometry);
        if (item) {
            items.splice(items.indexOf(item), 1);
        } else {
            item = RibbonItem(preset, geometry, 'recent');
        }
        // allow 30 recents
        if (items.length === 30) {
            // remove the last recent (first in, first out)
            items.pop();
        }
        // prepend array
        items.unshift(item);
        setRecents(items);
    };

    return utilRebind(all, dispatch, 'on');
}
