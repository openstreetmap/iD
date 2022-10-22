import { dispatch as d3_dispatch } from 'd3-dispatch';

import { prefs } from '../core/preferences';
import { osmEntity, osmLifecyclePrefixes } from '../osm';
import { utilRebind } from '../util/rebind';
import { utilArrayGroupBy, utilArrayUnion, utilQsString, utilStringQs } from '../util';


export function rendererFeatures(context) {
    var dispatch = d3_dispatch('change', 'redraw');
    var features = utilRebind({}, dispatch, 'on');
    var _deferred = new Set();

    var traffic_roads = {
        'motorway': true,
        'motorway_link': true,
        'trunk': true,
        'trunk_link': true,
        'primary': true,
        'primary_link': true,
        'secondary': true,
        'secondary_link': true,
        'tertiary': true,
        'tertiary_link': true,
        'residential': true,
        'unclassified': true,
        'living_street': true
    };

    var service_roads = {
        'service': true,
        'road': true,
        'track': true
    };

    var paths = {
        'path': true,
        'footway': true,
        'cycleway': true,
        'bridleway': true,
        'steps': true,
        'pedestrian': true
    };

    var _cullFactor = 1;
    var _cache = {};
    var _rules = {};
    var _stats = {};
    var _keys = [];
    var _hidden = [];
    var _forceVisible = {};


    function update() {
        if (!window.mocha) {
            var hash = utilStringQs(window.location.hash);
            var disabled = features.disabled();
            if (disabled.length) {
                hash.disable_features = disabled.join(',');
            } else {
                delete hash.disable_features;
            }
            window.location.replace('#' + utilQsString(hash, true));
            prefs('disabled-features', disabled.join(','));
        }
        _hidden = features.hidden();
        dispatch.call('change');
        dispatch.call('redraw');
    }


    /**
     * @param {string} k
     * @param {(tags: Record<string, string>, geometry: string) => boolean} filter
     * @param {?number} max
     */
    function defineRule(k, filter, max) {
        var isEnabled = true;

        _keys.push(k);
        _rules[k] = {
            filter: filter,
            enabled: isEnabled,   // whether the user wants it enabled..
            count: 0,
            currentMax: (max || Infinity),
            defaultMax: (max || Infinity),
            enable: function() { this.enabled = true; this.currentMax = this.defaultMax; },
            disable: function() { this.enabled = false; this.currentMax = 0; },
            hidden: function() {
                return (this.count === 0 && !this.enabled) ||
                    this.count > this.currentMax * _cullFactor;
            },
            autoHidden: function() { return this.hidden() && this.currentMax > 0; }
        };
    }


    defineRule('points', function isPoint(tags, geometry) {
        return geometry === 'point';
    }, 200);

    defineRule('traffic_roads', function isTrafficRoad(tags) {
        return traffic_roads[tags.highway];
    });

    defineRule('service_roads', function isServiceRoad(tags) {
        return service_roads[tags.highway];
    });

    defineRule('paths', function isPath(tags) {
        return paths[tags.highway];
    });

    defineRule('buildings', function isBuilding(tags) {
        return (
            (!!tags.building && tags.building !== 'no') ||
            tags.parking === 'multi-storey' ||
            tags.parking === 'sheds' ||
            tags.parking === 'carports' ||
            tags.parking === 'garage_boxes'
        );
    }, 250);

    defineRule('building_parts', function isBuildingPart(tags) {
        return tags['building:part'];
    });

    defineRule('indoor', function isIndoor(tags) {
        return tags.indoor;
    });

    defineRule('landuse', function isLanduse(tags, geometry) {
        return geometry === 'area' &&
            !_rules.buildings.filter(tags) &&
            !_rules.building_parts.filter(tags) &&
            !_rules.indoor.filter(tags) &&
            !_rules.water.filter(tags) &&
            !_rules.pistes.filter(tags);
    });

    defineRule('boundaries', function isBoundary(tags, geometry) {
        // This rule applies if the object has no interesting tags, and if either:
        //   (a) is a way having a `boundary=*` tag, or
        //   (b) is a relation of `type=boundary`.
        return (
            (geometry === 'line' && !!tags.boundary) ||
            (geometry === 'relation' && tags.type === 'boundary')
        ) && !(
            traffic_roads[tags.highway] ||
            service_roads[tags.highway] ||
            paths[tags.highway] ||
            tags.waterway ||
            tags.railway ||
            tags.landuse ||
            tags.natural ||
            tags.building ||
            tags.power
        );
    });

    defineRule('water', function isWater(tags) {
        return (
            !!tags.waterway ||
            tags.natural === 'water' ||
            tags.natural === 'coastline' ||
            tags.natural === 'bay' ||
            tags.landuse === 'pond' ||
            tags.landuse === 'basin' ||
            tags.landuse === 'reservoir' ||
            tags.landuse === 'salt_pond'
        );
    });

    defineRule('rail', function isRail(tags) {
        return (
            !!tags.railway ||
            tags.landuse === 'railway'
        ) && !(
            traffic_roads[tags.highway] ||
            service_roads[tags.highway] ||
            paths[tags.highway]
        );
    });

    defineRule('pistes', function isPiste(tags) {
        return tags['piste:type'];
    });

    defineRule('aerialways', function isPiste(tags) {
        return tags.aerialway &&
            tags.aerialway !== 'yes' &&
            tags.aerialway !== 'station';
    });

    defineRule('power', function isPower(tags) {
        return !!tags.power;
    });

    // contains a past/future tag, but not in active use as a road/path/cycleway/etc..
    defineRule('past_future', function isPastFuture(tags) {
        if (
            traffic_roads[tags.highway] ||
            service_roads[tags.highway] ||
            paths[tags.highway]
        ) { return false; }

        var strings = Object.keys(tags);

        for (var i = 0; i < strings.length; i++) {
            var s = strings[i];
            if (osmLifecyclePrefixes[s] || osmLifecyclePrefixes[tags[s]]) return true;
        }
        return false;
    });

    // Lines or areas that don't match another feature filter.
    // IMPORTANT: The 'others' feature must be the last one defined,
    //   so that code in getMatches can skip this test if `hasMatch = true`
    defineRule('others', function isOther(tags, geometry) {
        return (geometry === 'line' || geometry === 'area');
    });



    features.features = function() {
        return _rules;
    };


    features.keys = function() {
        return _keys;
    };


    features.enabled = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return _rules[k].enabled; });
        }
        return _rules[k] && _rules[k].enabled;
    };


    features.disabled = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return !_rules[k].enabled; });
        }
        return _rules[k] && !_rules[k].enabled;
    };


    features.hidden = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return _rules[k].hidden(); });
        }
        return _rules[k] && _rules[k].hidden();
    };


    features.autoHidden = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return _rules[k].autoHidden(); });
        }
        return _rules[k] && _rules[k].autoHidden();
    };


    features.enable = function(k) {
        if (_rules[k] && !_rules[k].enabled) {
            _rules[k].enable();
            update();
        }
    };

    features.enableAll = function() {
        var didEnable = false;
        for (var k in _rules) {
            if (!_rules[k].enabled) {
                didEnable = true;
                _rules[k].enable();
            }
        }
        if (didEnable) update();
    };


    features.disable = function(k) {
        if (_rules[k] && _rules[k].enabled) {
            _rules[k].disable();
            update();
        }
    };

    features.disableAll = function() {
        var didDisable = false;
        for (var k in _rules) {
            if (_rules[k].enabled) {
                didDisable = true;
                _rules[k].disable();
            }
        }
        if (didDisable) update();
    };


    features.toggle = function(k) {
        if (_rules[k]) {
            (function(f) { return f.enabled ? f.disable() : f.enable(); }(_rules[k]));
            update();
        }
    };


    features.resetStats = function() {
        for (var i = 0; i < _keys.length; i++) {
            _rules[_keys[i]].count = 0;
        }
        dispatch.call('change');
    };


    features.gatherStats = function(d, resolver, dimensions) {
        var needsRedraw = false;
        var types = utilArrayGroupBy(d, 'type');
        var entities = [].concat(types.relation || [], types.way || [], types.node || []);
        var currHidden, geometry, matches, i, j;

        for (i = 0; i < _keys.length; i++) {
            _rules[_keys[i]].count = 0;
        }

        // adjust the threshold for point/building culling based on viewport size..
        // a _cullFactor of 1 corresponds to a 1000x1000px viewport..
        _cullFactor = dimensions[0] * dimensions[1] / 1000000;

        for (i = 0; i < entities.length; i++) {
            geometry = entities[i].geometry(resolver);
            matches = Object.keys(features.getMatches(entities[i], resolver, geometry));
            for (j = 0; j < matches.length; j++) {
                _rules[matches[j]].count++;
            }
        }

        currHidden = features.hidden();
        if (currHidden !== _hidden) {
            _hidden = currHidden;
            needsRedraw = true;
            dispatch.call('change');
        }

        return needsRedraw;
    };


    features.stats = function() {
        for (var i = 0; i < _keys.length; i++) {
            _stats[_keys[i]] = _rules[_keys[i]].count;
        }

        return _stats;
    };


    features.clear = function(d) {
        for (var i = 0; i < d.length; i++) {
            features.clearEntity(d[i]);
        }
    };


    features.clearEntity = function(entity) {
        delete _cache[osmEntity.key(entity)];
    };


    features.reset = function() {
        Array.from(_deferred).forEach(function(handle) {
            window.cancelIdleCallback(handle);
            _deferred.delete(handle);
        });

        _cache = {};
    };

    // only certain relations are worth checking
    function relationShouldBeChecked(relation) {
        // multipolygon features have `area` geometry and aren't checked here
        return relation.tags.type === 'boundary';
    }

    features.getMatches = function(entity, resolver, geometry) {
        if (geometry === 'vertex' ||
            (geometry === 'relation' && !relationShouldBeChecked(entity))) return {};

        var ent = osmEntity.key(entity);
        if (!_cache[ent]) {
            _cache[ent] = {};
        }

        if (!_cache[ent].matches) {
            var matches = {};
            var hasMatch = false;

            for (var i = 0; i < _keys.length; i++) {
                if (_keys[i] === 'others') {
                    if (hasMatch) continue;

                    // If an entity...
                    //   1. is a way that hasn't matched other 'interesting' feature rules,
                    if (entity.type === 'way') {
                        var parents = features.getParents(entity, resolver, geometry);

                        //   2a. belongs only to a single multipolygon relation
                        if ((parents.length === 1 && parents[0].isMultipolygon()) ||
                            // 2b. or belongs only to boundary relations
                            (parents.length > 0 && parents.every(function(parent) { return parent.tags.type === 'boundary'; }))) {

                            // ...then match whatever feature rules the parent relation has matched.
                            // see #2548, #2887
                            //
                            // IMPORTANT:
                            // For this to work, getMatches must be called on relations before ways.
                            //
                            var pkey = osmEntity.key(parents[0]);
                            if (_cache[pkey] && _cache[pkey].matches) {
                                matches = Object.assign({}, _cache[pkey].matches);  // shallow copy
                                continue;
                            }
                        }
                    }
                }

                if (_rules[_keys[i]].filter(entity.tags, geometry)) {
                    matches[_keys[i]] = hasMatch = true;
                }
            }
            _cache[ent].matches = matches;
        }

        return _cache[ent].matches;
    };


    features.getParents = function(entity, resolver, geometry) {
        if (geometry === 'point') return [];

        var ent = osmEntity.key(entity);
        if (!_cache[ent]) {
            _cache[ent] = {};
        }

        if (!_cache[ent].parents) {
            var parents = [];
            if (geometry === 'vertex') {
                parents = resolver.parentWays(entity);
            } else {   // 'line', 'area', 'relation'
                parents = resolver.parentRelations(entity);
            }
            _cache[ent].parents = parents;
        }
        return _cache[ent].parents;
    };


    features.isHiddenPreset = function(preset, geometry) {
        if (!_hidden.length) return false;
        if (!preset.tags) return false;

        var test = preset.setTags({}, geometry);
        for (var key in _rules) {
            if (_rules[key].filter(test, geometry)) {
                if (_hidden.indexOf(key) !== -1) {
                    return key;
                }
                return false;
            }
        }
        return false;
    };


    features.isHiddenFeature = function(entity, resolver, geometry) {
        if (!_hidden.length) return false;
        if (!entity.version) return false;
        if (_forceVisible[entity.id]) return false;

        var matches = Object.keys(features.getMatches(entity, resolver, geometry));
        return matches.length && matches.every(function(k) { return features.hidden(k); });
    };


    features.isHiddenChild = function(entity, resolver, geometry) {
        if (!_hidden.length) return false;
        if (!entity.version || geometry === 'point') return false;
        if (_forceVisible[entity.id]) return false;

        var parents = features.getParents(entity, resolver, geometry);
        if (!parents.length) return false;

        for (var i = 0; i < parents.length; i++) {
            if (!features.isHidden(parents[i], resolver, parents[i].geometry(resolver))) {
                return false;
            }
        }
        return true;
    };


    features.hasHiddenConnections = function(entity, resolver) {
        if (!_hidden.length) return false;

        var childNodes, connections;
        if (entity.type === 'midpoint') {
            childNodes = [resolver.entity(entity.edge[0]), resolver.entity(entity.edge[1])];
            connections = [];
        } else {
            childNodes = entity.nodes ? resolver.childNodes(entity) : [];
            connections = features.getParents(entity, resolver, entity.geometry(resolver));
        }

        // gather ways connected to child nodes..
        connections = childNodes.reduce(function(result, e) {
            return resolver.isShared(e) ? utilArrayUnion(result, resolver.parentWays(e)) : result;
        }, connections);

        return connections.some(function(e) {
            return features.isHidden(e, resolver, e.geometry(resolver));
        });
    };


    features.isHidden = function(entity, resolver, geometry) {
        if (!_hidden.length) return false;
        if (!entity.version) return false;

        var fn = (geometry === 'vertex' ? features.isHiddenChild : features.isHiddenFeature);
        return fn(entity, resolver, geometry);
    };


    features.filter = function(d, resolver) {
        if (!_hidden.length) return d;

        var result = [];
        for (var i = 0; i < d.length; i++) {
            var entity = d[i];
            if (!features.isHidden(entity, resolver, entity.geometry(resolver))) {
                result.push(entity);
            }
        }
        return result;
    };


    features.forceVisible = function(entityIDs) {
        if (!arguments.length) return Object.keys(_forceVisible);

        _forceVisible = {};
        for (var i = 0; i < entityIDs.length; i++) {
            _forceVisible[entityIDs[i]] = true;
            var entity = context.hasEntity(entityIDs[i]);
            if (entity && entity.type === 'relation') {
                // also show relation members (one level deep)
                for (var j in entity.members) {
                    _forceVisible[entity.members[j].id] = true;
                }
            }
        }
        return features;
    };


    features.init = function() {
        var storage = prefs('disabled-features');
        if (storage) {
            var storageDisabled = storage.replace(/;/g, ',').split(',');
            storageDisabled.forEach(features.disable);
        }

        var hash = utilStringQs(window.location.hash);
        if (hash.disable_features) {
            var hashDisabled = hash.disable_features.replace(/;/g, ',').split(',');
            hashDisabled.forEach(features.disable);
        }
    };


    // warm up the feature matching cache upon merging fetched data
    context.history().on('merge.features', function(newEntities) {
        if (!newEntities) return;
        var handle = window.requestIdleCallback(function() {
            var graph = context.graph();
            var types = utilArrayGroupBy(newEntities, 'type');
            // ensure that getMatches is called on relations before ways
            var entities = [].concat(types.relation || [], types.way || [], types.node || []);
            for (var i = 0; i < entities.length; i++) {
                var geometry = entities[i].geometry(graph);
                features.getMatches(entities[i], graph, geometry);
            }
        });
        _deferred.add(handle);
    });


    return features;
}
