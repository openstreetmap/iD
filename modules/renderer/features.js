import _clone from 'lodash-es/clone';
import _groupBy from 'lodash-es/groupBy';
import _reduce from 'lodash-es/reduce';
import _some from 'lodash-es/some';
import _union from 'lodash-es/union';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import { osmEntity } from '../osm';
import { utilRebind } from '../util/rebind';
import { utilQsString, utilStringQs } from '../util';


export function rendererFeatures(context) {
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
        'pedestrian': true,
        'corridor': true
    };

    var past_futures = {
        'proposed': true,
        'construction': true,
        'abandoned': true,
        'dismantled': true,
        'disused': true,
        'razed': true,
        'demolished': true,
        'obliterated': true
    };

    var dispatch = d3_dispatch('change', 'redraw');
    var _cullFactor = 1;
    var _cache = {};
    var _features = {};
    var _stats = {};
    var _keys = [];
    var _hidden = [];
    var _forceVisible = {};


    function update() {
        if (!window.mocha) {
            var q = utilStringQs(window.location.hash.substring(1));
            var disabled = features.disabled();
            if (disabled.length) {
                q.disable_features = disabled.join(',');
            } else {
                delete q.disable_features;
            }
            window.location.replace('#' + utilQsString(q, true));
            context.storage('disabled-features', disabled.join(','));
        }
        _hidden = features.hidden();
        dispatch.call('change');
        dispatch.call('redraw');
    }


    function defineFeature(k, filter, max) {
        var isEnabled = true;

        _keys.push(k);
        _features[k] = {
            filter: filter,
            enabled: isEnabled,   // whether the user wants it enabled..
            count: 0,
            currentMax: (max || Infinity),
            defaultMax: (max || Infinity),
            enable: function() { this.enabled = true; this.currentMax = this.defaultMax; },
            disable: function() { this.enabled = false; this.currentMax = 0; },
            hidden: function() {
                return !context.editable() ||
                    (this.count === 0 && !this.enabled) ||
                    this.count > this.currentMax * _cullFactor;
            },
            autoHidden: function() { return this.hidden() && this.currentMax > 0; }
        };
    }


    defineFeature('points', function isPoint(tags, geometry) {
        return geometry === 'point';
    }, 200);

    defineFeature('traffic_roads', function isTrafficRoad(tags) {
        return traffic_roads[tags.highway];
    });

    defineFeature('service_roads', function isServiceRoad(tags) {
        return service_roads[tags.highway];
    });

    defineFeature('paths', function isPath(tags) {
        return paths[tags.highway];
    });

    defineFeature('buildings', function isBuilding(tags) {
        return (
            !!tags['building:part'] ||
            (!!tags.building && tags.building !== 'no') ||
            tags.parking === 'multi-storey' ||
            tags.parking === 'sheds' ||
            tags.parking === 'carports' ||
            tags.parking === 'garage_boxes'
        );
    }, 250);

    defineFeature('landuse', function isLanduse(tags, geometry) {
        return geometry === 'area' &&
            !_features.buildings.filter(tags) &&
            !_features.water.filter(tags);
    });

    defineFeature('boundaries', function isBoundary(tags) {
        return (
            !!tags.boundary
        ) && !(
            traffic_roads[tags.highway] ||
            service_roads[tags.highway] ||
            paths[tags.highway]
        );
    });

    defineFeature('water', function isWater(tags) {
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

    defineFeature('rail', function isRail(tags) {
        return (
            !!tags.railway ||
            tags.landuse === 'railway'
        ) && !(
            traffic_roads[tags.highway] ||
            service_roads[tags.highway] ||
            paths[tags.highway]
        );
    });

    defineFeature('power', function isPower(tags) {
        return !!tags.power;
    });

    // contains a past/future tag, but not in active use as a road/path/cycleway/etc..
    defineFeature('past_future', function isPastFuture(tags) {
        if (
            traffic_roads[tags.highway] ||
            service_roads[tags.highway] ||
            paths[tags.highway]
        ) { return false; }

        var strings = Object.keys(tags);

        for (var i = 0; i < strings.length; i++) {
            var s = strings[i];
            if (past_futures[s] || past_futures[tags[s]]) { return true; }
        }
        return false;
    });

    // Lines or areas that don't match another feature filter.
    // IMPORTANT: The 'others' feature must be the last one defined,
    //   so that code in getMatches can skip this test if `hasMatch = true`
    defineFeature('others', function isOther(tags, geometry) {
        return (geometry === 'line' || geometry === 'area');
    });


    function features() {}


    features.features = function() {
        return _features;
    };


    features.keys = function() {
        return _keys;
    };


    features.enabled = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return _features[k].enabled; });
        }
        return _features[k] && _features[k].enabled;
    };


    features.disabled = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return !_features[k].enabled; });
        }
        return _features[k] && !_features[k].enabled;
    };


    features.hidden = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return _features[k].hidden(); });
        }
        return _features[k] && _features[k].hidden();
    };


    features.autoHidden = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return _features[k].autoHidden(); });
        }
        return _features[k] && _features[k].autoHidden();
    };


    features.enable = function(k) {
        if (_features[k] && !_features[k].enabled) {
            _features[k].enable();
            update();
        }
    };


    features.disable = function(k) {
        if (_features[k] && _features[k].enabled) {
            _features[k].disable();
            update();
        }
    };


    features.toggle = function(k) {
        if (_features[k]) {
            (function(f) { return f.enabled ? f.disable() : f.enable(); }(_features[k]));
            update();
        }
    };


    features.resetStats = function() {
        for (var i = 0; i < _keys.length; i++) {
            _features[_keys[i]].count = 0;
        }
        dispatch.call('change');
    };


    features.gatherStats = function(d, resolver, dimensions) {
        var needsRedraw = false;
        var type = _groupBy(d, function(ent) { return ent.type; });
        var entities = [].concat(type.relation || [], type.way || [], type.node || []);
        var currHidden, geometry, matches, i, j;

        for (i = 0; i < _keys.length; i++) {
            _features[_keys[i]].count = 0;
        }

        // adjust the threshold for point/building culling based on viewport size..
        // a _cullFactor of 1 corresponds to a 1000x1000px viewport..
        _cullFactor = dimensions[0] * dimensions[1] / 1000000;

        for (i = 0; i < entities.length; i++) {
            geometry = entities[i].geometry(resolver);
            matches = Object.keys(features.getMatches(entities[i], resolver, geometry));
            for (j = 0; j < matches.length; j++) {
                _features[matches[j]].count++;
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
            _stats[_keys[i]] = _features[_keys[i]].count;
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
                                matches = _clone(_cache[pkey].matches);
                                continue;
                            }
                        }
                    }
                }

                if (_features[_keys[i]].filter(entity.tags, geometry)) {
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
        for (var i = 0; i < _hidden.length; i++) {
            if (_features[_hidden[i]].filter(preset.setTags({}, geometry), geometry)) {
                return _hidden[i];
            }
        }
        return false;
    };


    features.isHiddenFeature = function(entity, resolver, geometry) {
        if (!_hidden.length) return false;
        if (!entity.version) return false;

        var matches = features.getMatches(entity, resolver, geometry);

        for (var i = 0; i < _hidden.length; i++) {
            if (matches[_hidden[i]]) return true;
        }
        return false;
    };


    features.isHiddenChild = function(entity, resolver, geometry) {
        if (!_hidden.length) return false;
        if (!entity.version || geometry === 'point') return false;

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
        connections = _reduce(childNodes, function(result, e) {
            return resolver.isShared(e) ? _union(result, resolver.parentWays(e)) : result;
        }, connections);

        return connections.length ? _some(connections, function(e) {
            return features.isHidden(e, resolver, e.geometry(resolver));
        }) : false;
    };


    features.isHidden = function(entity, resolver, geometry) {
        if (!_hidden.length) return false;
        if (!entity.version) return false;
        if (_forceVisible[entity.id]) return false;

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
        }
        return features;
    };


    features.init = function() {
        var storage = context.storage('disabled-features');
        if (storage) {
            var storageDisabled = storage.replace(/;/g, ',').split(',');
            storageDisabled.forEach(features.disable);
        }

        var q = utilStringQs(window.location.hash.substring(1));
        if (q.disable_features) {
            var hashDisabled = q.disable_features.replace(/;/g, ',').split(',');
            hashDisabled.forEach(features.disable);
        }
    };

    return utilRebind(features, dispatch, 'on');
}
