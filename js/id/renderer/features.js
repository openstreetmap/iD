iD.Features = function(context) {
    var major_roads = {
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
        'residential': true
    };

    var minor_roads = {
        'service': true,
        'living_street': true,
        'road': true,
        'unclassified': true,
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
        dispatch.change();
        dispatch.redraw();
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

    defineFeature('major_roads', function isMajorRoad(entity) {
        return major_roads[entity.tags.highway];
    });

    defineFeature('minor_roads', function isMinorRoad(entity) {
        return minor_roads[entity.tags.highway];
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
            major_roads[entity.tags.highway] ||
            minor_roads[entity.tags.highway] ||
            paths[entity.tags.highway]
        );
    });

    defineFeature('power', function isPower(entity) {
        return !!entity.tags.power;
    });

    // contains a past/future tag, but not in active use as a road/path/cycleway/etc..
    defineFeature('past_future', function isPastFuture(entity) {
        if (
            major_roads[entity.tags.highway] ||
            minor_roads[entity.tags.highway] ||
            paths[entity.tags.highway]
        ) { return false; }

        var strings = Object.keys(entity.tags);

        for (var i = 0, imax = strings.length; i !== imax; i++) {
            var s = strings[i];
            if (past_futures[s] || past_futures[entity.tags[s]]) { return true; }
        }
        return false;
    });

    // lines or areas that don't match another feature filter.
    defineFeature('others', function isOther(entity, resolver, geometry) {
        return (geometry === 'line' || geometry === 'area') && !(
            _features.major_roads.filter(entity, resolver, geometry) ||
            _features.minor_roads.filter(entity, resolver, geometry) ||
            _features.paths.filter(entity, resolver, geometry) ||
            _features.buildings.filter(entity, resolver, geometry) ||
            _features.landuse.filter(entity, resolver, geometry) ||
            _features.boundaries.filter(entity, resolver, geometry) ||
            _features.water.filter(entity, resolver, geometry) ||
            _features.rail.filter(entity, resolver, geometry) ||
            _features.power.filter(entity, resolver, geometry) ||
            _features.past_future.filter(entity, resolver, geometry)
        );
    });


    function features() {}

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
        dispatch.change();
    };

    features.gatherStats = function(d, resolver, dimensions) {
        var needsRedraw = false,
            currHidden, geometry, matches;

        _.each(_features, function(f) { f.count = 0; });

        // adjust the threshold for point/building culling based on viewport size..
        // a _cullFactor of 1 corresponds to a 1000x1000px viewport..
        _cullFactor = dimensions[0] * dimensions[1] / 1000000;

        for (var i = 0, imax = d.length; i !== imax; i++) {
            geometry = d[i].geometry(resolver);
            if (!(geometry === 'vertex' || geometry === 'relation')) {
                matches = Object.keys(features.getMatches(d[i], resolver, geometry));
                for (var j = 0, jmax = matches.length; j !== jmax; j++) {
                    _features[matches[j]].count++;
                }
            }
        }

        currHidden = features.hidden();
        if (currHidden !== _hidden) {
            _hidden = currHidden;
            needsRedraw = true;
            dispatch.change();
        }

        return needsRedraw;
    };

    features.stats = function() {
        _.each(_keys, function(k) { _stats[k] = _features[k].count; });
        return _stats;
    };

    features.clear = function(d) {
        for (var i = 0, imax = d.length; i !== imax; i++) {
            features.clearEntity(d[i]);
        }
    };

    features.clearEntity = function(entity) {
        delete _cache[iD.Entity.key(entity)];
    };

    features.reset = function() {
        _cache = {};
    };

    features.getMatches = function(entity, resolver, geometry) {
        var ent = iD.Entity.key(entity);

        if (!_cache[ent]) {
            _cache[ent] = {};
        }
        if (!_cache[ent].matches) {
            var matches = {},
                hasMatch = false;

            if (!(geometry === 'vertex' || geometry === 'relation')) {
                for (var i = 0, imax = _keys.length; i !== imax; i++) {
                    if (hasMatch && _keys[i] === 'others') {
                        continue;
                    }
                    if (_features[_keys[i]].filter(entity, resolver, geometry)) {
                        matches[_keys[i]] = hasMatch = true;
                    }
                }
            }
            _cache[ent].matches = matches;
        }
        return _cache[ent].matches;
    };

    features.getParents = function(entity, resolver, geometry) {
        var ent = iD.Entity.key(entity);

        if (!_cache[ent]) {
            _cache[ent] = {};
        }
        if (!_cache[ent].parents) {
            var parents = [];

            if (geometry !== 'point') {
                if (geometry === 'vertex') {
                    parents = resolver.parentWays(entity);
                } else {   // 'line', 'area', 'relation'
                    parents = resolver.parentRelations(entity);
                }
            }
            _cache[ent].parents = parents;
        }
        return _cache[ent].parents;
    };

    features.isHiddenFeature = function(entity, resolver, geometry) {
        if (!entity.version) return false;

        var matches = features.getMatches(entity, resolver, geometry);

        for (var i = 0, imax = _hidden.length; i !== imax; i++) {
            if (matches[_hidden[i]]) { return true; }
        }
        return false;
    };

    features.isHiddenChild = function(entity, resolver, geometry) {
        if (!entity.version || geometry === 'point') { return false; }

        var parents = features.getParents(entity, resolver, geometry);

        if (!parents.length) { return false; }

        for (var i = 0, imax = parents.length; i !== imax; i++) {
            if (!features.isHidden(parents[i], resolver, parents[i].geometry(resolver))) {
                return false;
            }
        }
        return true;
    };

    features.hasHiddenConnections = function(entity, resolver) {
        var childNodes, connections;

        if (entity.type === 'midpoint') {
            childNodes = [resolver.entity(entity.edge[0]), resolver.entity(entity.edge[1])];
            connections = [];
        } else {
            childNodes = resolver.childNodes(entity);
            connections = features.getParents(entity, resolver, entity.geometry(resolver));
        }

        // gather ways connected to child nodes..
        connections = _.reduce(childNodes, function(result, e) {
            return resolver.isShared(e) ? _.union(result, resolver.parentWays(e)) : result;
        }, connections);

        return connections.length ? _.any(connections, function(e) {
            return features.isHidden(e, resolver, e.geometry(resolver));
        }) : false;
    };

    features.isHidden = function(entity, resolver, geometry) {
        if (!entity.version) return false;

        if (geometry === 'vertex')
            return features.isHiddenChild(entity, resolver, geometry);
        if (geometry === 'point')
            return features.isHiddenFeature(entity, resolver, geometry);

        return features.isHiddenFeature(entity, resolver, geometry) ||
               features.isHiddenChild(entity, resolver, geometry);
    };

    features.filter = function(d, resolver) {
        if (!_hidden.length)
            return d;

        var result = [];
        for (var i = 0, imax = d.length; i !== imax; i++) {
            var entity = d[i];
            if (!features.isHidden(entity, resolver, entity.geometry(resolver))) {
                result.push(entity);
            }
        }
        return result;
    };

    return d3.rebind(features, dispatch, 'on');
};
