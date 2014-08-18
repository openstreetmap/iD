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

    var graph = context.graph(),
        dispatch = d3.dispatch('change', 'redraw'),
        feature = {};

    function defineFeature(k, filter, max) {
        feature[k] = {
            filter: filter,
            enabled: true,   // whether the user wants it enabled..
            count: 0,
            currentMax: (max || Infinity),
            defaultMax: (max || Infinity),
            enable: function() { this.enabled = true; this.currentMax = this.defaultMax; },
            disable: function() { this.enabled = false; this.currentMax = 0; },
            hidden: function() { return this.count > this.currentMax; }
        };
    }

    function update() {
        dispatch.change();
        dispatch.redraw();
    }

    defineFeature('points', function(entity) {
        return entity.geometry(graph) === 'point';
    }, 100);

    defineFeature('major_roads', function(entity) {
        return entity.geometry(graph) === 'line' && major_roads[entity.tags.highway];
    });

    defineFeature('minor_roads', function(entity) {
        return entity.geometry(graph) === 'line' && minor_roads[entity.tags.highway];
    });

    defineFeature('paths', function(entity) {
        return entity.geometry(graph) === 'line' && paths[entity.tags.highway];
    });

    defineFeature('buildings', function(entity) {
        return (
            entity.geometry(graph) === 'area' && (
                (!!entity.tags.building && entity.tags.building !== 'no') ||
                entity.tags.amenity === 'shelter' ||
                entity.tags.parking === 'multi-storey' ||
                entity.tags.parking === 'sheds' ||
                entity.tags.parking === 'carports' ||
                entity.tags.parking === 'garage_boxes'
            )
        ) || !!entity.tags['building:part'];
    }, 100);

    defineFeature('landuse', function(entity) {
        return entity.geometry(graph) === 'area' &&
            !feature.buildings.filter(entity) &&
            !feature.water.filter(entity);
    });

    defineFeature('boundaries', function(entity) {
        return !!entity.tags.boundary;
    });

    defineFeature('water', function(entity) {
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

    defineFeature('rail', function(entity) {
        return (
            !!entity.tags.railway ||
            entity.tags.landuse === 'railway'
        );
    });

    defineFeature('power', function(entity) {
        return !!entity.tags.power;
    });

    // contains a past/future tag, but not in active use as a road/path/cycleway/etc..
    defineFeature('past_future', function(entity) {
        var strings = _.flatten(_.pairs(entity.tags));
        return _.any(strings, function(s) { return past_futures[s]; }) &&
            !feature.major_roads.filter(entity) &&
            !feature.minor_roads.filter(entity) &&
            !feature.paths.filter(entity);
    });

    // lines or areas that don't match another feature filter.
    defineFeature('others', function(entity) {
        return (
            entity.geometry(graph) === 'line' ||
            entity.geometry(graph) === 'area'
        ) &&
        _.reduce(_.omit(feature, 'others'), function(result, v) {
            return result && !v.filter(entity);
        }, true);
    });


    function features() {}

    features.keys = function() {
        return _.keys(feature);
    };

    features.enabled = function(k) {
        if (!arguments.length) {
            return _.filter(features.keys(), function(k) { return feature[k].enabled; });
        }
        return feature[k] && feature[k].enabled;
    };

    features.disabled = function(k) {
        if (!arguments.length) {
            return _.reject(features.keys(), function(k) { return feature[k].enabled; });
        }
        return feature[k] && !feature[k].enabled;
    };

    features.hidden = function(k) {
        if (!arguments.length) {
            return _.filter(features.keys(), function(k) { return feature[k].hidden(); });
        }
        return feature[k] && feature[k].hidden();
    };

    features.enable = function(k) {
        if (feature[k] && !feature[k].enabled) {
            feature[k].enable();
            update();
        }
    };

    features.disable = function(k) {
        if (feature[k] && feature[k].enabled) {
            feature[k].disable();
            update();
        }
    };

    features.toggle = function(k) {
        if (feature[k]) {
            (function(f) { return f.enabled ? f.disable() : f.enable(); }(feature[k]));
            update();
        }
    };

    features.setAll = function(val) {
        if (val !== undefined) {
            _.each(feature, function(f) { return val ? f.enable() : f.disable(); });
            update();
        }
    };

    features.enableAll = function() {
        features.setAll(true);
    };

    features.disableAll = function() {
        features.setAll(false);
    };

    features.count = function(k) {
        return feature[k] && feature[k].count;
    };

    features.resetStats = function() {
        _.each(feature, function(f) { f.count = 0; });
    };

    features.gatherStats = function(d) {
        var hidden = features.hidden(),
            keys = features.keys();

        features.resetStats();
        _.each(d, function(entity) {
            _.each(keys, function(k) {
                if (feature[k].filter(entity)) {
                    feature[k].count++;
                }
            });
        });

        if (hidden !== features.hidden()) {
            dispatch.change();
        }
    };

    features.stats = function() {
        var stats = {};
        _.each(features.keys(), function(k) {
            stats[k] = feature[k].count;
        });
        return stats;
    };

    features.isHidden = function(entity) {
        var hidden = features.hidden();

        function isHiddenFeature(entity) {
            return _.any(hidden, function(k) { return feature[k].filter(entity); });
        }
        function isHiddenChild(entity) {
            var parents = _.union(graph.parentWays(entity), graph.parentRelations(entity));
            return parents.length ? _.all(parents, features.isHidden) : false;
        }
        return isHiddenFeature(entity) || isHiddenChild(entity);
    };

    features.filter = function(d) {
        return features.hidden().length ? _.reject(d, features.isHidden) : d;
    };

    return d3.rebind(features, dispatch, 'on');
};
