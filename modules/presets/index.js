import _bind from 'lodash-es/bind';
import _forEach from 'lodash-es/forEach';
import _reject from 'lodash-es/reject';
import _uniq from 'lodash-es/uniq';

import { data } from '../../data/index';
import { presetCategory } from './category';
import { presetCollection } from './collection';
import { presetField } from './field';
import { presetPreset } from './preset';
import { utilStringQs } from '../util';

import { json as d3_json } from 'd3-request';
import { 
    select as d3_select,
    selectAll as d3_selectAll 
} from 'd3-selection';

export { presetCategory };
export { presetCollection };
export { presetField };
export { presetPreset };


export function presetIndex() {
    // a presetCollection with methods for
    // loading new data and returning defaults

    var all = presetCollection([]);
    var _defaults = {};
    var _fields = {};
    var _universal = [];
    var _recent = presetCollection([]);

    // Index of presets by (geometry, tag key).
    var _index = {
        point: {},
        vertex: {},
        line: {},
        area: {},
        relation: {}
    };

    all.match = function(entity, resolver) {
        var geometry = entity.geometry(resolver);
        var address;

        // Treat entities on addr:interpolation lines as points, not vertices - #3241
        if (geometry === 'vertex' && entity.isOnAddressLine(resolver)) {
            geometry = 'point';
        }

        var geometryMatches = _index[geometry];
        var best = -1;
        var match;

        for (var k in entity.tags) {
            // If any part of an address is present,
            // allow fallback to "Address" preset - #4353
            if (k.match(/^addr:/) !== null && geometryMatches['addr:*']) {
                address = geometryMatches['addr:*'][0];
            }

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

        if (address && (!match || match.isFallback())) {
            match = address;
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
    // (see `Way#isArea()`). In other words, the keys of L form the whitelist,
    // and the subkeys form the blacklist.
    all.areaKeys = function() {
        var areaKeys = {};
        var ignore = ['barrier', 'highway', 'footway', 'railway', 'type'];  // probably a line..
        var presets = _reject(all.collection, 'suggestion');

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
            for (var key in d.tags) break;
            if (!key) return;
            if (ignore.indexOf(key) !== -1) return;

            var value = d.tags[key];
            if (key in areaKeys &&                      // probably an area...
                d.geometry.indexOf('line') !== -1 &&    // but sometimes a line
                value !== '*') {
                areaKeys[key][value] = true;
            }
        });
        console.log(areaKeys);
        return areaKeys;
    };

    all.build = function () {
        var d = data.presets;
		all.collection = [];
        _recent.collection = [];
        _fields = {};
        _universal = [];
        _index = { point: {}, vertex: {}, line: {}, area: {}, relation: {} };

        if (d.fields) {
            _forEach(d.fields, function(d, id) {
                _fields[id] = presetField(id, d);
                if (d.universal) {
                    _universal.push(_fields[id]);
                }
            });
        }

        if (d.presets) {
            _forEach(d.presets, function(d, id) {
                all.collection.push(presetPreset(id, d, _fields));
            });
        }

        if (d.categories) {
            _forEach(d.categories, function(d, id) {
                all.collection.push(presetCategory(id, d, all));
            });
        }

        if (d.defaults) {
            var getItem = _bind(all.item, all);
            _forEach(Object.keys(d.defaults), function (k) {
                _defaults[k] = presetCollection(d.defaults[k].map(getItem));
            });
            // _defaults = {
            //     area: presetCollection(d.defaults.area.map(getItem)),
            //     line: presetCollection(d.defaults.line.map(getItem)),
            //     point: presetCollection(d.defaults.point.map(getItem)),
            //     vertex: presetCollection(d.defaults.vertex.map(getItem)),
            //     relation: presetCollection(d.defaults.relation.map(getItem))
            // };
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

    };

    all.fromExternal = function() {
        var presetsUrl = utilStringQs(window.location.hash).presets;
        d3_json(presetsUrl, function(err, presets) {
            if (err) all.init();
            all.overwrite(presets);
        });
        return all;
    };

    all.overwrite = function (d) {
        data.presets = d;
        all.build();
        return all;
    };

    all.init = function() {
		all.build();
        return all;
    };

    all.field = function(id) {
        return _fields[id];
    };

    all.universal = function() {
        return _universal;
    };

    all.defaults = function(geometry, n) {
        var rec = _recent.matchGeometry(geometry).collection.slice(0, 4);
        var def = _uniq(rec.concat(_defaults[geometry].collection)).slice(0, n - 1);
        var fin = _uniq(rec.concat(def).concat(all.item(geometry))).filter(function(d) { return d !== undefined; });
        return presetCollection(fin);
    };

    all.defaultTypes = function() {
        return Object.keys(_defaults);
    };

    all.choose = function(preset) {
        _recent = presetCollection(_uniq([preset].concat(_recent.collection)));
        return all;
    };

    return all;
}
