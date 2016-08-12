import { rebind } from '../util/rebind';
import * as d3 from 'd3';
import _ from 'lodash';
import { Entity } from '../core/index';
export function Features(context) {
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

    var dispatch = d3.dispatch('change', 'redraw'),
        _cullFactor = 1,
        _cache = {},
        _features = {},
        _stats = {},
        _keys = [],
        _hidden = [];

    function update() {
        _hidden = features.hidden();
        dispatch.call("change");
        dispatch.call("redraw");
    }

    function defineFeature(k, filter, max) {
        _keys.push(k);
        _features[k] = {
            filter: filter,
            enabled: true,   // whether the user wants it enabled..
            count: 0,
            currentMax: (max || Infinity),
            defaultMax: (max || Infinity),
            enable: function() { this.enabled = true; this.currentMax = this.defaultMax; },
            disable: function() { this.enabled = false; this.currentMax = 0; },
            hidden: function() { return !context.editable() || this.count > this.currentMax * _cullFactor; },
            autoHidden: function() { return this.hidden() && this.currentMax > 0; }
        };
    }


    defineFeature('points', function isPoint(entity, resolver, geometry) {
        return geometry === 'point';
    }, 200);

    defineFeature('traffic_roads', function isTrafficRoad(entity) {
        return traffic_roads[entity.tags.highway];
    });

    defineFeature('service_roads', function isServiceRoad(entity) {
        return service_roads[entity.tags.highway];
    });

    defineFeature('paths', function isPath(entity) {
        return paths[entity.tags.highway];
    });

    defineFeature('buildings', function isBuilding(entity) {
        return (
            !!entity.tags['building:part'] ||
            (!!entity.tags.building && entity.tags.building !== 'no') ||
            entity.tags.amenity === 'shelter' ||
            entity.tags.parking === 'multi-storey' ||
            entity.tags.parking === 'sheds' ||
            entity.tags.parking === 'carports' ||
            entity.tags.parking === 'garage_boxes'
        );
    }, 250);

    defineFeature('landuse', function isLanduse(entity, resolver, geometry) {
        return geometry === 'area' &&
            !_features.buildings.filter(entity) &&
            !_features.water.filter(entity);
    });

    defineFeature('boundaries', function isBoundary(entity) {
        return !!entity.tags.boundary;
    });

    defineFeature('water', function isWater(entity) {
        return (
            !!entity.tags.waterway ||
            entity.tags.natural === 'water' ||
            entity.tags.natural === 'coastline' ||
            entity.tags.natural === 'bay' ||
            entity.tags.landuse === 'pond' ||
            entity.tags.landuse === 'basin' ||
            entity.tags.landuse === 'reservoir' ||
            entity.tags.landuse === 'salt_pond'
        );
    });

    defineFeature('rail', function isRail(entity) {
        return (
            !!entity.tags.railway ||
            entity.tags.landuse === 'railway'
        ) && !(
            traffic_roads[entity.tags.highway] ||
            service_roads[entity.tags.highway] ||
            paths[entity.tags.highway]
        );
    });

    defineFeature('power', function isPower(entity) {
        return !!entity.tags.power;
    });

    // contains a past/future tag, but not in active use as a road/path/cycleway/etc..
    defineFeature('past_future', function isPastFuture(entity) {
        if (
            traffic_roads[entity.tags.highway] ||
            service_roads[entity.tags.highway] ||
            paths[entity.tags.highway]
        ) { return false; }

        var strings = Object.keys(entity.tags);

        for (var i = 0; i < strings.length; i++) {
            var s = strings[i];
            if (past_futures[s] || past_futures[entity.tags[s]]) { return true; }
        }
        return false;
    });

    // Lines or areas that don't match another feature filter.
    // IMPORTANT: The 'others' feature must be the last one defined,
    //   so that code in getMatches can skip this test if `hasMatch = true`
    defineFeature('others', function isOther(entity, resolver, geometry) {
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
            return _.filter(_keys, function(k) { return _features[k].enabled; });
        }
        return _features[k] && _features[k].enabled;
    };

    features.disabled = function(k) {
        if (!arguments.length) {
            return _.reject(_keys, function(k) { return _features[k].enabled; });
        }
        return _features[k] && !_features[k].enabled;
    };

    features.hidden = function(k) {
        if (!arguments.length) {
            return _.filter(_keys, function(k) { return _features[k].hidden(); });
        }
        return _features[k] && _features[k].hidden();
    };

    features.autoHidden = function(k) {
        if (!arguments.length) {
            return _.filter(_keys, function(k) { return _features[k].autoHidden(); });
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
        _.each(_features, function(f) { f.count = 0; });
        dispatch.call("change");
    };

    features.gatherStats = function(d, resolver, dimensions) {
        var needsRedraw = false,
            type = _.groupBy(d, function(ent) { return ent.type; }),
            entities = [].concat(type.relation || [], type.way || [], type.node || []),
            currHidden, geometry, matches;

        _.each(_features, function(f) { f.count = 0; });

        // adjust the threshold for point/building culling based on viewport size..
        // a _cullFactor of 1 corresponds to a 1000x1000px viewport..
        _cullFactor = dimensions[0] * dimensions[1] / 1000000;

        for (var i = 0; i < entities.length; i++) {
            geometry = entities[i].geometry(resolver);
            if (!(geometry === 'vertex' || geometry === 'relation')) {
                matches = Object.keys(features.getMatches(entities[i], resolver, geometry));
                for (var j = 0; j < matches.length; j++) {
                    _features[matches[j]].count++;
                }
            }
        }

        currHidden = features.hidden();
        if (currHidden !== _hidden) {
            _hidden = currHidden;
            needsRedraw = true;
            dispatch.call("change");
        }

        return needsRedraw;
    };

    features.stats = function() {
        _.each(_keys, function(k) { _stats[k] = _features[k].count; });
        return _stats;
    };

    features.clear = function(d) {
        for (var i = 0; i < d.length; i++) {
            features.clearEntity(d[i]);
        }
    };

    features.clearEntity = function(entity) {
        delete _cache[Entity.key(entity)];
    };

    features.reset = function() {
        _cache = {};
    };

    features.getMatches = function(entity, resolver, geometry) {
        if (geometry === 'vertex' || geometry === 'relation') return {};

        var ent = Entity.key(entity);
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
                    //   1. is a way that hasn't matched other "interesting" feature rules,
                    //   2. and it belongs to a single parent multipolygon relation
                    // ...then match whatever feature rules the parent multipolygon has matched.
                    // see #2548, #2887
                    //
                    // IMPORTANT:
                    // For this to work, getMatches must be called on relations before ways.
                    //
                    if (entity.type === 'way') {
                        var parents = features.getParents(entity, resolver, geometry);
                        if (parents.length === 1 && parents[0].isMultipolygon()) {
                            var pkey = Entity.key(parents[0]);
                            if (_cache[pkey] && _cache[pkey].matches) {
                                matches = _.clone(_cache[pkey].matches);
                                continue;
                            }
                        }
                    }
                }

                if (_features[_keys[i]].filter(entity, resolver, geometry)) {
                    matches[_keys[i]] = hasMatch = true;
                }
            }
            _cache[ent].matches = matches;
        }

        return _cache[ent].matches;
    };

    features.getParents = function(entity, resolver, geometry) {
        if (geometry === 'point') return [];

        var ent = Entity.key(entity);
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
        connections = _.reduce(childNodes, function(result, e) {
            return resolver.isShared(e) ? _.union(result, resolver.parentWays(e)) : result;
        }, connections);

        return connections.length ? _.some(connections, function(e) {
            return features.isHidden(e, resolver, e.geometry(resolver));
        }) : false;
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

    return rebind(features, dispatch, 'on');
}
