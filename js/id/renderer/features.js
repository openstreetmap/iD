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
        resolver = context.graph(),
        feature = {},
        cullFactor = 1;

    function update() {
        dispatch.change();
        dispatch.redraw();
    }

    function defineFeature(k, filter, max) {
        feature[k] = {
            filter: filter,
            enabled: true,   // whether the user wants it enabled..
            count: 0,
            currentMax: (max || Infinity),
            defaultMax: (max || Infinity),
            enable: function() { this.enabled = true; this.currentMax = this.defaultMax; },
            disable: function() { this.enabled = false; this.currentMax = 0; },
            hidden: function() { return this.count > this.currentMax * cullFactor; },
            autoHidden: function() { return this.hidden() && this.currentMax > 0; }
        };
    }


    defineFeature('points', function(entity) {
        return entity.geometry(resolver) === 'point';
    }, 200);

    defineFeature('major_roads', function(entity) {
        return entity.geometry(resolver) === 'line' && major_roads[entity.tags.highway];
    });

    defineFeature('minor_roads', function(entity) {
        return entity.geometry(resolver) === 'line' && minor_roads[entity.tags.highway];
    });

    defineFeature('paths', function(entity) {
        return entity.geometry(resolver) === 'line' && paths[entity.tags.highway];
    });

    defineFeature('buildings', function(entity) {
        return (
            entity.geometry(resolver) === 'area' && (
                (!!entity.tags.building && entity.tags.building !== 'no') ||
                entity.tags.amenity === 'shelter' ||
                entity.tags.parking === 'multi-storey' ||
                entity.tags.parking === 'sheds' ||
                entity.tags.parking === 'carports' ||
                entity.tags.parking === 'garage_boxes'
            )
        ) || !!entity.tags['building:part'];
    }, 250);

    defineFeature('landuse', function(entity) {
        return entity.geometry(resolver) === 'area' &&
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
        return !(
            feature.major_roads.filter(entity) ||
            feature.minor_roads.filter(entity) ||
            feature.paths.filter(entity)
        ) && (
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
        return !(
            feature.major_roads.filter(entity) ||
            feature.minor_roads.filter(entity) ||
            feature.paths.filter(entity)
        ) && _.any(strings, function(s) { return past_futures[s]; });
    });

    // lines or areas that don't match another feature filter.
    defineFeature('others', function(entity) {
        return (
            entity.geometry(resolver) === 'line' ||
            entity.geometry(resolver) === 'area'
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

    features.autoHidden = function(k) {
        if (!arguments.length) {
            return _.filter(features.keys(), function(k) { return feature[k].autoHidden(); });
        }
        return feature[k] && feature[k].autoHidden();
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

    features.gatherStats = function(d, graph, dimensions) {
        var hidden = features.hidden(),
            keys = features.keys();
        resolver = graph || resolver;

        _.each(feature, function(f) { f.count = 0; });

        // adjust the threshold for point/building culling based on viewport size..
        // a cullFactor of 1 corresponds to a 1000x1000px viewport..
        cullFactor = dimensions[0] * dimensions[1] / 1000000;

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

    features.isHiddenFeature = function(entity, graph) {
        resolver = graph || resolver;
        return _.any(features.hidden(), function(k) { return feature[k].filter(entity); });
    };

    features.isHiddenChild = function(entity, graph) {
        var parents;
        resolver = graph || resolver;

        parents = _.union(resolver.parentWays(entity), resolver.parentRelations(entity));
        return parents.length ? _.all(parents, function(e) {
            return features.isHidden(e, resolver);
        }) : false;
    };

    features.hasHiddenConnections = function(entity, graph) {
        var childNodes, connections;
        resolver = graph || resolver;

        if (entity.type === 'midpoint') {
            childNodes = [resolver.entity(entity.edge[0]), resolver.entity(entity.edge[1])];
        } else {
            childNodes = resolver.childNodes(entity);
        }

        // gather parents..
        connections = _.union(resolver.parentWays(entity), resolver.parentRelations(entity));
        // gather ways connected to child nodes..
        connections = _.reduce(childNodes, function(result, e) {
            return resolver.isShared(e) ? _.union(result, resolver.parentWays(e)) : result;
        }, connections);

        return connections.length ? _.any(connections, function(e) {
            return features.isHidden(e, resolver);
        }) : false;
    };

    features.isHidden = function(entity, graph) {
        resolver = graph || resolver;
        return !!entity.version &&
            (features.isHiddenFeature(entity, resolver) || features.isHiddenChild(entity, resolver));
    };

    features.filter = function(d, graph) {
        var selected = context.selectedIDs();
        resolver = graph || resolver;

        return features.hidden().length ? _.reject(d, function(e) {
            var hidden = features.isHidden(e, resolver);
            if (hidden && _.contains(selected, e.id)) {
                context.enter(iD.modes.Browse(context));
            }
            return hidden;
        }) : d;
    };

    return d3.rebind(features, dispatch, 'on');
};
