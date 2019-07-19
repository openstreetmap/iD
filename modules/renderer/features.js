import { dispatch as d3_dispatch } from 'd3-dispatch';

import { osmEntity } from '../osm';
import { utilRebind } from '../util/rebind';
import { groupManager } from '../entities/group_manager';
import { utilArrayGroupBy, utilArrayUnion, utilQsString, utilStringQs } from '../util';
import { t } from '../util/locale';

export function rendererFeatures(context) {
    var dispatch = d3_dispatch('change', 'redraw');
    var features = utilRebind({}, dispatch, 'on');
    var _deferred = new Set();

    var _cullFactor = 1;
    var _cache = {};
    var _rules = {};
    var _rulesArray = [];
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


    function defineRule(k, filter, title, description, max) {
        var isEnabled = true;

        _keys.push(k);
        _rules[k] = {
            key: k,
            title: title,
            description: description,
            filter: filter,
            enabled: isEnabled,   // whether the user wants it enabled..
            count: 0,
            currentMax: (max || Infinity),
            defaultMax: (max || Infinity),
            enable: function() { this.enabled = true; this.currentMax = this.defaultMax; },
            disable: function() { this.enabled = false; this.currentMax = 0; },
            hidden: function() {
                return !context.editableDataEnabled() ||
                    (this.count === 0 && !this.enabled) ||
                    this.count > this.currentMax * _cullFactor;
            },
            autoHidden: function() { return this.hidden() && this.currentMax > 0; }
        };
        _rulesArray.push(_rules[k]);
    }

    for (var id in groupManager.toggleableGroups) {
        var group = groupManager.toggleableGroups[id];
        defineRule(group.basicID(), group.matchesTags, group.localizedName(), group.localizedDescription(), group.toggleableMax());
    }

    // Lines or areas that don't match another feature filter.
    // IMPORTANT: The 'others' feature must be the last one defined,
    //   so that code in getMatches can skip this test if `hasMatch = true`
    defineRule('others', function isOther(tags, geometry) {
        return (geometry === 'line' || geometry === 'area');
    }, t('feature.others.description'), t('feature.others.tooltip'));

    features.featuresArray = function() {
        return _rulesArray;
    };

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
                    return _rules[key];
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
