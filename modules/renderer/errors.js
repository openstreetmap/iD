import _clone from 'lodash-es/clone';
import _groupBy from 'lodash-es/groupBy';
import _reduce from 'lodash-es/reduce';
import _some from 'lodash-es/some';
import _union from 'lodash-es/union';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import { osmEntity } from '../osm';
import { utilRebind } from '../util/rebind';
import {
	utilQsString,
	utilStringQs
} from '../util';


export function rendererErrors(context) {
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

    var _30 = {
        'test_error_3': false,
    };

    var dispatch = d3_dispatch('change', 'redraw'),
        _cullFactor = 1,
        _cache = {},
        _errors = {},
        _stats = {},
        _keys = [],
        _hidden = [];


    function update() {
        if (!window.mocha) {
            var q = utilStringQs(window.location.hash.substring(1));
            var disabled = errors.disabled();
            if (disabled.length) {
                q.disable_errors = disabled.join(',');
            } else {
                delete q.disable_errors;
            }
            window.location.replace('#' + utilQsString(q, true));
            context.storage('disabled-features', disabled.join(','));
        }
        _hidden = errors.hidden();
        dispatch.call('change');
        dispatch.call('redraw');
    }


    function defineFeature(k, filter, max) {
        var isEnabled = true;

        _keys.push(k);
        _errors[k] = {
            filter: filter,
            enabled: isEnabled,   // whether the user wants it enabled..
            count: 0,
            currentMax: (max || Infinity),
            defaultMax: (max || Infinity),
            enable: function() { this.enabled = true; this.currentMax = this.defaultMax; },
            disable: function() { this.enabled = false; this.currentMax = 0; },
            hidden: function() { return !context.editable() || this.count > this.currentMax * _cullFactor; },
            autoHidden: function() { return this.hidden() && this.currentMax > 0; }
        };
    }


    // defineFeature('points', function isPoint(entity, resolver, geometry) {
    //     return geometry === 'point';
    // }, 200);

    // defineFeature('traffic_roads', function isTrafficRoad(entity) {
    //     return traffic_roads[entity.tags.highway];
    // });

    // defineFeature('service_roads', function isServiceRoad(entity) {
    //     return service_roads[entity.tags.highway];
    // });

    // defineFeature('paths', function isPath(entity) {
    //     return paths[entity.tags.highway];
    // });

    // defineFeature('buildings', function isBuilding(entity) {
    //     return (
    //         !!entity.tags['building:part'] ||
    //         (!!entity.tags.building && entity.tags.building !== 'no') ||
    //         entity.tags.parking === 'multi-storey' ||
    //         entity.tags.parking === 'sheds' ||
    //         entity.tags.parking === 'carports' ||
    //         entity.tags.parking === 'garage_boxes'
    //     );
    // }, 250);

    // defineFeature('landuse', function isLanduse(entity, resolver, geometry) {
    //     return geometry === 'area' &&
    //         !_errors.buildings.filter(entity) &&
    //         !_errors.water.filter(entity);
    // });

    // defineFeature('boundaries', function isBoundary(entity) {
    //     return (
    //         !!entity.tags.boundary
    //     ) && !(
    //         traffic_roads[entity.tags.highway] ||
    //         service_roads[entity.tags.highway] ||
    //         paths[entity.tags.highway]
    //     );
    // });

    // defineFeature('water', function isWater(entity) {
    //     return (
    //         !!entity.tags.waterway ||
    //         entity.tags.natural === 'water' ||
    //         entity.tags.natural === 'coastline' ||
    //         entity.tags.natural === 'bay' ||
    //         entity.tags.landuse === 'pond' ||
    //         entity.tags.landuse === 'basin' ||
    //         entity.tags.landuse === 'reservoir' ||
    //         entity.tags.landuse === 'salt_pond'
    //     );
    // });

    // defineFeature('rail', function isRail(entity) {
    //     return (
    //         !!entity.tags.railway ||
    //         entity.tags.landuse === 'railway'
    //     ) && !(
    //         traffic_roads[entity.tags.highway] ||
    //         service_roads[entity.tags.highway] ||
    //         paths[entity.tags.highway]
    //     );
    // });

    // defineFeature('power', function isPower(entity) {
    //     return !!entity.tags.power;
    // });

    // // contains a past/future tag, but not in active use as a road/path/cycleway/etc..
    // defineFeature('past_future', function isPastFuture(entity) {
    //     if (
    //         traffic_roads[entity.tags.highway] ||
    //         service_roads[entity.tags.highway] ||
    //         paths[entity.tags.highway]
    //     ) { return false; }

    //     var strings = Object.keys(entity.tags);

    //     for (var i = 0; i < strings.length; i++) {
    //         var s = strings[i];
    //         if (past_futures[s] || past_futures[entity.tags[s]]) { return true; }
    //     }
    //     return false;
    // });

    // // Lines or areas that don't match another feature filter.
    // // IMPORTANT: The 'others' feature must be the last one defined,
    // //   so that code in getMatches can skip this test if `hasMatch = true`
    // defineFeature('others', function isOther(entity, resolver, geometry) {
    //     return (geometry === 'line' || geometry === 'area');
    // });

    defineFeature('_30', function isError(entity) {
        return _30[entity];
    });


    function errors() {}


    errors.errors = function() {
        return _errors;
    };


    errors.keys = function() {
        return _keys;
    };


    errors.enabled = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return _errors[k].enabled; });
        }
        return _errors[k] && _errors[k].enabled;
    };


    errors.disabled = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return !_errors[k].enabled; });
        }
        return _errors[k] && !_errors[k].enabled;
    };


    errors.hidden = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return _errors[k].hidden(); });
        }
        return _errors[k] && _errors[k].hidden();
    };


    errors.autoHidden = function(k) {
        if (!arguments.length) {
            return _keys.filter(function(k) { return _errors[k].autoHidden(); });
        }
        return _errors[k] && _errors[k].autoHidden();
    };


    errors.enable = function(k) {
        if (_errors[k] && !_errors[k].enabled) {
            _errors[k].enable();
            update();
        }
    };


    errors.disable = function(k) {
        if (_errors[k] && _errors[k].enabled) {
            _errors[k].disable();
            update();
        }
    };


    errors.toggle = function(k) {
        if (_errors[k]) {
            (function(f) { return f.enabled ? f.disable() : f.enable(); }(_errors[k]));
            update();
        }
    };


    errors.resetStats = function() {
        for (var i = 0; i < _keys.length; i++) {
            _errors[_keys[i]].count = 0;
        }
        dispatch.call('change');
    };


    errors.gatherStats = function(d, resolver, dimensions) {
        var needsRedraw = false,
            type = _groupBy(d, function(ent) { return ent.type; }),
            entities = [].concat(type.relation || [], type.way || [], type.node || []),
            currHidden, geometry, matches, i, j;

        for (i = 0; i < _keys.length; i++) {
            _errors[_keys[i]].count = 0;
        }

        // adjust the threshold for point/building culling based on viewport size..
        // a _cullFactor of 1 corresponds to a 1000x1000px viewport..
        _cullFactor = dimensions[0] * dimensions[1] / 1000000;

        for (i = 0; i < entities.length; i++) {
            geometry = entities[i].geometry(resolver);
            if (!(geometry === 'vertex' || geometry === 'relation')) {
                matches = Object.keys(errors.getMatches(entities[i], resolver, geometry));
                for (j = 0; j < matches.length; j++) {
                    _errors[matches[j]].count++;
                }
            }
        }

        currHidden = errors.hidden();
        if (currHidden !== _hidden) {
            _hidden = currHidden;
            needsRedraw = true;
            dispatch.call('change');
        }

        return needsRedraw;
    };


    errors.stats = function() {
        for (var i = 0; i < _keys.length; i++) {
            _stats[_keys[i]] = _errors[_keys[i]].count;
        }

        return _stats;
    };


    errors.clear = function(d) {
        for (var i = 0; i < d.length; i++) {
            errors.clearEntity(d[i]);
        }
    };


    errors.clearEntity = function(entity) {
        delete _cache[osmEntity.key(entity)];
    };


    errors.reset = function() {
        _cache = {};
    };


    errors.getMatches = function(entity, resolver, geometry) {
        if (geometry === 'vertex' || geometry === 'relation') return {};

        var ent = osmEntity.key(entity);
        if (!_cache[ent]) {
            _cache[ent] = {};
        }

        if (!_cache[ent].matches) {
            var matches = {},
                hasMatch = false;

            for (var i = 0; i < _keys.length; i++) {
                if (_keys[i] === 'others') {
                    if (hasMatch) continue;

                    // Multipolygon members:
                    // If an entity...
                    //   1. is a way that hasn't matched other 'interesting' feature rules,
                    //   2. and it belongs to a single parent multipolygon relation
                    // ...then match whatever feature rules the parent multipolygon has matched.
                    // see #2548, #2887
                    //
                    // IMPORTANT:
                    // For this to work, getMatches must be called on relations before ways.
                    //
                    if (entity.type === 'way') {
                        var parents = errors.getParents(entity, resolver, geometry);
                        if (parents.length === 1 && parents[0].isMultipolygon()) {
                            var pkey = osmEntity.key(parents[0]);
                            if (_cache[pkey] && _cache[pkey].matches) {
                                matches = _clone(_cache[pkey].matches);
                                continue;
                            }
                        }
                    }
                }

                if (_errors[_keys[i]].filter(entity, resolver, geometry)) {
                    matches[_keys[i]] = hasMatch = true;
                }
            }
            _cache[ent].matches = matches;
        }

        return _cache[ent].matches;
    };


    errors.getParents = function(entity, resolver, geometry) {
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


    errors.isHiddenFeature = function(entity, resolver, geometry) {
        if (!_hidden.length) return false;
        if (!entity.version) return false;

        var matches = errors.getMatches(entity, resolver, geometry);

        for (var i = 0; i < _hidden.length; i++) {
            if (matches[_hidden[i]]) return true;
        }
        return false;
    };


    errors.isHiddenChild = function(entity, resolver, geometry) {
        if (!_hidden.length) return false;
        if (!entity.version || geometry === 'point') return false;

        var parents = errors.getParents(entity, resolver, geometry);
        if (!parents.length) return false;

        for (var i = 0; i < parents.length; i++) {
            if (!errors.isHidden(parents[i], resolver, parents[i].geometry(resolver))) {
                return false;
            }
        }
        return true;
    };


    errors.hasHiddenConnections = function(entity, resolver) {
        if (!_hidden.length) return false;
        var childNodes, connections;

        if (entity.type === 'midpoint') {
            childNodes = [resolver.entity(entity.edge[0]), resolver.entity(entity.edge[1])];
            connections = [];
        } else {
            childNodes = entity.nodes ? resolver.childNodes(entity) : [];
            connections = errors.getParents(entity, resolver, entity.geometry(resolver));
        }

        // gather ways connected to child nodes..
        connections = _reduce(childNodes, function(result, e) {
            return resolver.isShared(e) ? _union(result, resolver.parentWays(e)) : result;
        }, connections);

        return connections.length ? _some(connections, function(e) {
            return errors.isHidden(e, resolver, e.geometry(resolver));
        }) : false;
    };


    errors.isHidden = function(entity, resolver, geometry) {
        if (!_hidden.length) return false;
        if (!entity.version) return false;

        var fn = (geometry === 'vertex' ? errors.isHiddenChild : errors.isHiddenFeature);
        return fn(entity, resolver, geometry);
    };


    errors.filter = function(d, resolver) {
        if (!_hidden.length) return d;

        var result = [];
        for (var i = 0; i < d.length; i++) {
            var entity = d[i];
            if (!errors.isHidden(entity, resolver, entity.geometry(resolver))) {
                result.push(entity);
            }
        }
        return result;
    };


    errors.init = function() {
        var storage = context.storage('disabled-features');
        if (storage) {
            var storageDisabled = storage.replace(/;/g, ',').split(',');
            storageDisabled.forEach(errors.disable);
        }

        var q = utilStringQs(window.location.hash.substring(1));
        if (q.disable_errors) {
            var hashDisabled = q.disable_errors.replace(/;/g, ',').split(',');
            hashDisabled.forEach(errors.disable);
        }
    };

    return utilRebind(errors, dispatch, 'on');
}
