(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.iD = global.iD || {})));
}(this, function (exports) { 'use strict';

    function BackgroundSource(data) {
        var source = _.clone(data),
            offset = [0, 0],
            name = source.name,
            best = !!source.best;

        source.scaleExtent = data.scaleExtent || [0, 20];
        source.overzoom = data.overzoom !== false;

        source.offset = function(_) {
            if (!arguments.length) return offset;
            offset = _;
            return source;
        };

        source.nudge = function(_, zoomlevel) {
            offset[0] += _[0] / Math.pow(2, zoomlevel);
            offset[1] += _[1] / Math.pow(2, zoomlevel);
            return source;
        };

        source.name = function() {
            return name;
        };

        source.best = function() {
            return best;
        };

        source.area = function() {
            if (!data.polygon) return Number.MAX_VALUE;  // worldwide
            var area = d3.geo.area({ type: 'MultiPolygon', coordinates: [ data.polygon ] });
            return isNaN(area) ? 0 : area;
        };

        source.imageryUsed = function() {
            return source.id || name;
        };

        source.url = function(coord) {
            return data.template
                .replace('{x}', coord[0])
                .replace('{y}', coord[1])
                // TMS-flipped y coordinate
                .replace(/\{[t-]y\}/, Math.pow(2, coord[2]) - coord[1] - 1)
                .replace(/\{z(oom)?\}/, coord[2])
                .replace(/\{switch:([^}]+)\}/, function(s, r) {
                    var subdomains = r.split(',');
                    return subdomains[(coord[0] + coord[1]) % subdomains.length];
                })
                .replace('{u}', function() {
                    var u = '';
                    for (var zoom = coord[2]; zoom > 0; zoom--) {
                        var b = 0;
                        var mask = 1 << (zoom - 1);
                        if ((coord[0] & mask) !== 0) b++;
                        if ((coord[1] & mask) !== 0) b += 2;
                        u += b.toString();
                    }
                    return u;
                });
        };

        source.intersects = function(extent) {
            extent = extent.polygon();
            return !data.polygon || data.polygon.some(function(polygon) {
                return iD.geo.polygonIntersectsPolygon(polygon, extent, true);
            });
        };

        source.validZoom = function(z) {
            return source.scaleExtent[0] <= z &&
                (source.overzoom || source.scaleExtent[1] > z);
        };

        source.isLocatorOverlay = function() {
            return name === 'Locator Overlay';
        };

        source.copyrightNotices = function() {};

        return source;
    }

    BackgroundSource.Bing = function(data, dispatch) {
        // http://msdn.microsoft.com/en-us/library/ff701716.aspx
        // http://msdn.microsoft.com/en-us/library/ff701701.aspx

        data.template = 'https://ecn.t{switch:0,1,2,3}.tiles.virtualearth.net/tiles/a{u}.jpeg?g=587&mkt=en-gb&n=z';

        var bing = BackgroundSource(data),
            key = 'Arzdiw4nlOJzRwOz__qailc8NiR31Tt51dN2D7cm57NrnceZnCpgOkmJhNpGoppU', // Same as P2 and JOSM
            url = 'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/Aerial?include=ImageryProviders&key=' +
                key + '&jsonp={callback}',
            providers = [];

        d3.jsonp(url, function(json) {
            providers = json.resourceSets[0].resources[0].imageryProviders.map(function(provider) {
                return {
                    attribution: provider.attribution,
                    areas: provider.coverageAreas.map(function(area) {
                        return {
                            zoom: [area.zoomMin, area.zoomMax],
                            extent: iD.geo.Extent([area.bbox[1], area.bbox[0]], [area.bbox[3], area.bbox[2]])
                        };
                    })
                };
            });
            dispatch.change();
        });

        bing.copyrightNotices = function(zoom, extent) {
            zoom = Math.min(zoom, 21);
            return providers.filter(function(provider) {
                return _.some(provider.areas, function(area) {
                    return extent.intersects(area.extent) &&
                        area.zoom[0] <= zoom &&
                        area.zoom[1] >= zoom;
                });
            }).map(function(provider) {
                return provider.attribution;
            }).join(', ');
        };

        bing.logo = 'bing_maps.png';
        bing.terms_url = 'https://blog.openstreetmap.org/2010/11/30/microsoft-imagery-details';

        return bing;
    };

    BackgroundSource.None = function() {
        var source = BackgroundSource({id: 'none', template: ''});

        source.name = function() {
            return t('background.none');
        };

        source.imageryUsed = function() {
            return 'None';
        };

        source.area = function() {
            return -1;
        };

        return source;
    };

    BackgroundSource.Custom = function(template) {
        var source = BackgroundSource({id: 'custom', template: template});

        source.name = function() {
            return t('background.custom');
        };

        source.imageryUsed = function() {
            return 'Custom (' + template + ')';
        };

        source.area = function() {
            return -2;
        };

        return source;
    };

    function TileLayer(context) {
        var tileSize = 256,
            tile = d3.geo.tile(),
            projection,
            cache = {},
            tileOrigin,
            z,
            transformProp = iD.util.prefixCSSProperty('Transform'),
            source = d3.functor('');


        // blacklist overlay tiles around Null Island..
        function nearNullIsland(x, y, z) {
            if (z >= 7) {
                var center = Math.pow(2, z - 1),
                    width = Math.pow(2, z - 6),
                    min = center - (width / 2),
                    max = center + (width / 2) - 1;
                return x >= min && x <= max && y >= min && y <= max;
            }
            return false;
        }

        function tileSizeAtZoom(d, z) {
            var epsilon = 0.002;
            return ((tileSize * Math.pow(2, z - d[2])) / tileSize) + epsilon;
        }

        function atZoom(t, distance) {
            var power = Math.pow(2, distance);
            return [
                Math.floor(t[0] * power),
                Math.floor(t[1] * power),
                t[2] + distance];
        }

        function lookUp(d) {
            for (var up = -1; up > -d[2]; up--) {
                var tile = atZoom(d, up);
                if (cache[source.url(tile)] !== false) {
                    return tile;
                }
            }
        }

        function uniqueBy(a, n) {
            var o = [], seen = {};
            for (var i = 0; i < a.length; i++) {
                if (seen[a[i][n]] === undefined) {
                    o.push(a[i]);
                    seen[a[i][n]] = true;
                }
            }
            return o;
        }

        function addSource(d) {
            d.push(source.url(d));
            return d;
        }

        // Update tiles based on current state of `projection`.
        function background(selection) {
            tile.scale(projection.scale() * 2 * Math.PI)
                .translate(projection.translate());

            tileOrigin = [
                projection.scale() * Math.PI - projection.translate()[0],
                projection.scale() * Math.PI - projection.translate()[1]];

            z = Math.max(Math.log(projection.scale() * 2 * Math.PI) / Math.log(2) - 8, 0);

            render(selection);
        }

        // Derive the tiles onscreen, remove those offscreen and position them.
        // Important that this part not depend on `projection` because it's
        // rentered when tiles load/error (see #644).
        function render(selection) {
            var requests = [];
            var showDebug = context.getDebug('tile') && !source.overlay;

            if (source.validZoom(z)) {
                tile().forEach(function(d) {
                    addSource(d);
                    if (d[3] === '') return;
                    if (typeof d[3] !== 'string') return; // Workaround for chrome crash https://github.com/openstreetmap/iD/issues/2295
                    requests.push(d);
                    if (cache[d[3]] === false && lookUp(d)) {
                        requests.push(addSource(lookUp(d)));
                    }
                });

                requests = uniqueBy(requests, 3).filter(function(r) {
                    if (!!source.overlay && nearNullIsland(r[0], r[1], r[2])) {
                        return false;
                    }
                    // don't re-request tiles which have failed in the past
                    return cache[r[3]] !== false;
                });
            }

            var pixelOffset = [
                source.offset()[0] * Math.pow(2, z),
                source.offset()[1] * Math.pow(2, z)
            ];

            function load(d) {
                cache[d[3]] = true;
                d3.select(this)
                    .on('error', null)
                    .on('load', null)
                    .classed('tile-loaded', true);
                render(selection);
            }

            function error(d) {
                cache[d[3]] = false;
                d3.select(this)
                    .on('error', null)
                    .on('load', null)
                    .remove();
                render(selection);
            }

            function imageTransform(d) {
                var _ts = tileSize * Math.pow(2, z - d[2]);
                var scale = tileSizeAtZoom(d, z);
                return 'translate(' +
                    ((d[0] * _ts) - tileOrigin[0] + pixelOffset[0]) + 'px,' +
                    ((d[1] * _ts) - tileOrigin[1] + pixelOffset[1]) + 'px)' +
                    'scale(' + scale + ',' + scale + ')';
            }

            function debugTransform(d) {
                var _ts = tileSize * Math.pow(2, z - d[2]);
                var scale = tileSizeAtZoom(d, z);
                return 'translate(' +
                    ((d[0] * _ts) - tileOrigin[0] + pixelOffset[0] + scale * (tileSize / 4)) + 'px,' +
                    ((d[1] * _ts) - tileOrigin[1] + pixelOffset[1] + scale * (tileSize / 2)) + 'px)';
            }

            var image = selection
                .selectAll('img')
                .data(requests, function(d) { return d[3]; });

            image.exit()
                .style(transformProp, imageTransform)
                .classed('tile-removing', true)
                .each(function() {
                    var tile = d3.select(this);
                    window.setTimeout(function() {
                        if (tile.classed('tile-removing')) {
                            tile.remove();
                        }
                    }, 300);
                });

            image.enter().append('img')
                .attr('class', 'tile')
                .attr('src', function(d) { return d[3]; })
                .on('error', error)
                .on('load', load);

            image
                .style(transformProp, imageTransform)
                .classed('tile-debug', showDebug)
                .classed('tile-removing', false);


            var debug = selection.selectAll('.tile-label-debug')
                .data(showDebug ? requests : [], function(d) { return d[3]; });

            debug.exit()
                .remove();

            debug.enter()
                .append('div')
                .attr('class', 'tile-label-debug');

            debug
                .text(function(d) { return d[2] + ' / ' + d[0] + ' / ' + d[1]; })
                .style(transformProp, debugTransform);
        }

        background.projection = function(_) {
            if (!arguments.length) return projection;
            projection = _;
            return background;
        };

        background.dimensions = function(_) {
            if (!arguments.length) return tile.size();
            tile.size(_);
            return background;
        };

        background.source = function(_) {
            if (!arguments.length) return source;
            source = _;
            cache = {};
            tile.scaleExtent(source.scaleExtent);
            return background;
        };

        return background;
    }

    function Background(context) {
        var dispatch = d3.dispatch('change'),
            baseLayer = TileLayer(context).projection(context.projection),
            overlayLayers = [],
            backgroundSources;


        function findSource(id) {
            return _.find(backgroundSources, function(d) {
                return d.id && d.id === id;
            });
        }


        function background(selection) {
            var base = selection.selectAll('.layer-background')
                .data([0]);

            base.enter()
                .insert('div', '.layer-data')
                .attr('class', 'layer layer-background');

            base.call(baseLayer);

            var overlays = selection.selectAll('.layer-overlay')
                .data(overlayLayers, function(d) { return d.source().name(); });

            overlays.enter()
                .insert('div', '.layer-data')
                .attr('class', 'layer layer-overlay');

            overlays.each(function(layer) {
                d3.select(this).call(layer);
            });

            overlays.exit()
                .remove();
        }


        background.updateImagery = function() {
            var b = background.baseLayerSource(),
                o = overlayLayers.map(function (d) { return d.source().id; }).join(','),
                meters = iD.geo.offsetToMeters(b.offset()),
                epsilon = 0.01,
                x = +meters[0].toFixed(2),
                y = +meters[1].toFixed(2),
                q = iD.util.stringQs(location.hash.substring(1));

            var id = b.id;
            if (id === 'custom') {
                id = 'custom:' + b.template;
            }

            if (id) {
                q.background = id;
            } else {
                delete q.background;
            }

            if (o) {
                q.overlays = o;
            } else {
                delete q.overlays;
            }

            if (Math.abs(x) > epsilon || Math.abs(y) > epsilon) {
                q.offset = x + ',' + y;
            } else {
                delete q.offset;
            }

            location.replace('#' + iD.util.qsString(q, true));

            var imageryUsed = [b.imageryUsed()];

            overlayLayers.forEach(function (d) {
                var source = d.source();
                if (!source.isLocatorOverlay()) {
                    imageryUsed.push(source.imageryUsed());
                }
            });

            var gpx = context.layers().layer('gpx');
            if (gpx && gpx.enabled() && gpx.hasGpx()) {
                imageryUsed.push('Local GPX');
            }

            var mapillary_images = context.layers().layer('mapillary-images');
            if (mapillary_images && mapillary_images.enabled()) {
                imageryUsed.push('Mapillary Images');
            }

            var mapillary_signs = context.layers().layer('mapillary-signs');
            if (mapillary_signs && mapillary_signs.enabled()) {
                imageryUsed.push('Mapillary Signs');
            }

            context.history().imageryUsed(imageryUsed);
        };

        background.sources = function(extent) {
            return backgroundSources.filter(function(source) {
                return source.intersects(extent);
            });
        };

        background.dimensions = function(_) {
            baseLayer.dimensions(_);

            overlayLayers.forEach(function(layer) {
                layer.dimensions(_);
            });
        };

        background.baseLayerSource = function(d) {
            if (!arguments.length) return baseLayer.source();
            baseLayer.source(d);
            dispatch.change();
            background.updateImagery();
            return background;
        };

        background.bing = function() {
            background.baseLayerSource(findSource('Bing'));
        };

        background.showsLayer = function(d) {
            return d === baseLayer.source() ||
                (d.id === 'custom' && baseLayer.source().id === 'custom') ||
                overlayLayers.some(function(l) { return l.source() === d; });
        };

        background.overlayLayerSources = function() {
            return overlayLayers.map(function (l) { return l.source(); });
        };

        background.toggleOverlayLayer = function(d) {
            var layer;

            for (var i = 0; i < overlayLayers.length; i++) {
                layer = overlayLayers[i];
                if (layer.source() === d) {
                    overlayLayers.splice(i, 1);
                    dispatch.change();
                    background.updateImagery();
                    return;
                }
            }

            layer = TileLayer(context)
                .source(d)
                .projection(context.projection)
                .dimensions(baseLayer.dimensions());

            overlayLayers.push(layer);
            dispatch.change();
            background.updateImagery();
        };

        background.nudge = function(d, zoom) {
            baseLayer.source().nudge(d, zoom);
            dispatch.change();
            background.updateImagery();
            return background;
        };

        background.offset = function(d) {
            if (!arguments.length) return baseLayer.source().offset();
            baseLayer.source().offset(d);
            dispatch.change();
            background.updateImagery();
            return background;
        };

        background.load = function(imagery) {
            function parseMap(qmap) {
                if (!qmap) return false;
                var args = qmap.split('/').map(Number);
                if (args.length < 3 || args.some(isNaN)) return false;
                return iD.geo.Extent([args[1], args[2]]);
            }

            var q = iD.util.stringQs(location.hash.substring(1)),
                chosen = q.background || q.layer,
                extent = parseMap(q.map),
                best;

            backgroundSources = imagery.map(function(source) {
                if (source.type === 'bing') {
                    return BackgroundSource.Bing(source, dispatch);
                } else {
                    return BackgroundSource(source);
                }
            });

            backgroundSources.unshift(BackgroundSource.None());

            if (!chosen && extent) {
                best = _.find(this.sources(extent), function(s) { return s.best(); });
            }

            if (chosen && chosen.indexOf('custom:') === 0) {
                background.baseLayerSource(BackgroundSource.Custom(chosen.replace(/^custom:/, '')));
            } else {
                background.baseLayerSource(findSource(chosen) || best || findSource('Bing') || backgroundSources[1] || backgroundSources[0]);
            }

            var locator = _.find(backgroundSources, function(d) {
                return d.overlay && d.default;
            });

            if (locator) {
                background.toggleOverlayLayer(locator);
            }

            var overlays = (q.overlays || '').split(',');
            overlays.forEach(function(overlay) {
                overlay = findSource(overlay);
                if (overlay) {
                    background.toggleOverlayLayer(overlay);
                }
            });

            if (q.gpx) {
                var gpx = context.layers().layer('gpx');
                if (gpx) {
                    gpx.url(q.gpx);
                }
            }

            if (q.offset) {
                var offset = q.offset.replace(/;/g, ',').split(',').map(function(n) {
                    return !isNaN(n) && n;
                });

                if (offset.length === 2) {
                    background.offset(iD.geo.metersToOffset(offset));
                }
            }
        };

        return d3.rebind(background, dispatch, 'on');
    }

    function Features(context) {
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
            dispatch.change();
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
                dispatch.change();
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
            delete _cache[iD.Entity.key(entity)];
        };

        features.reset = function() {
            _cache = {};
        };

        features.getMatches = function(entity, resolver, geometry) {
            if (geometry === 'vertex' || geometry === 'relation') return {};

            var ent = iD.Entity.key(entity);
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
                                var pkey = iD.Entity.key(parents[0]);
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

            var ent = iD.Entity.key(entity);
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

        return d3.rebind(features, dispatch, 'on');
    }

    function Map(context) {
        var dimensions = [1, 1],
            dispatch = d3.dispatch('move', 'drawn'),
            projection = context.projection,
            zoom = d3.behavior.zoom()
                .translate(projection.translate())
                .scale(projection.scale() * 2 * Math.PI)
                .scaleExtent([1024, 256 * Math.pow(2, 24)])
                .on('zoom', zoomPan),
            dblclickEnabled = true,
            redrawEnabled = true,
            transformStart,
            transformed = false,
            easing = false,
            minzoom = 0,
            drawLayers = iD.svg.Layers(projection, context),
            drawPoints = iD.svg.Points(projection, context),
            drawVertices = iD.svg.Vertices(projection, context),
            drawLines = iD.svg.Lines(projection),
            drawAreas = iD.svg.Areas(projection),
            drawMidpoints = iD.svg.Midpoints(projection, context),
            drawLabels = iD.svg.Labels(projection, context),
            supersurface,
            wrapper,
            surface,
            mouse,
            mousemove;

        function map(selection) {
            context
                .on('change.map', redraw);
            context.history()
                .on('change.map', redraw);
            context.background()
                .on('change.map', redraw);
            context.features()
                .on('redraw.map', redraw);
            drawLayers
                .on('change.map', function() {
                    context.background().updateImagery();
                    redraw();
                });

            selection
                .on('dblclick.map', dblClick)
                .call(zoom);

            supersurface = selection.append('div')
                .attr('id', 'supersurface')
                .call(iD.util.setTransform, 0, 0);

            // Need a wrapper div because Opera can't cope with an absolutely positioned
            // SVG element: http://bl.ocks.org/jfirebaugh/6fbfbd922552bf776c16
            wrapper = supersurface
                .append('div')
                .attr('class', 'layer layer-data');

            map.surface = surface = wrapper
                .call(drawLayers)
                .selectAll('.surface')
                .attr('id', 'surface');

            surface
                .on('mousedown.zoom', function() {
                    if (d3.event.button === 2) {
                        d3.event.stopPropagation();
                    }
                }, true)
                .on('mouseup.zoom', function() {
                    if (resetTransform()) redraw();
                })
                .on('mousemove.map', function() {
                    mousemove = d3.event;
                })
                .on('mouseover.vertices', function() {
                    if (map.editable() && !transformed) {
                        var hover = d3.event.target.__data__;
                        surface.call(drawVertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                        dispatch.drawn({full: false});
                    }
                })
                .on('mouseout.vertices', function() {
                    if (map.editable() && !transformed) {
                        var hover = d3.event.relatedTarget && d3.event.relatedTarget.__data__;
                        surface.call(drawVertices.drawHover, context.graph(), hover, map.extent(), map.zoom());
                        dispatch.drawn({full: false});
                    }
                });


            supersurface
                .call(context.background());


            context.on('enter.map', function() {
                if (map.editable() && !transformed) {
                    var all = context.intersects(map.extent()),
                        filter = d3.functor(true),
                        graph = context.graph();

                    all = context.features().filter(all, graph);
                    surface
                        .call(drawVertices, graph, all, filter, map.extent(), map.zoom())
                        .call(drawMidpoints, graph, all, filter, map.trimmedExtent());
                    dispatch.drawn({full: false});
                }
            });

            map.dimensions(selection.dimensions());

            drawLabels.supersurface(supersurface);
        }

        function pxCenter() {
            return [dimensions[0] / 2, dimensions[1] / 2];
        }

        function drawVector(difference, extent) {
            var graph = context.graph(),
                features = context.features(),
                all = context.intersects(map.extent()),
                data, filter;

            if (difference) {
                var complete = difference.complete(map.extent());
                data = _.compact(_.values(complete));
                filter = function(d) { return d.id in complete; };
                features.clear(data);

            } else {
                // force a full redraw if gatherStats detects that a feature
                // should be auto-hidden (e.g. points or buildings)..
                if (features.gatherStats(all, graph, dimensions)) {
                    extent = undefined;
                }

                if (extent) {
                    data = context.intersects(map.extent().intersection(extent));
                    var set = d3.set(_.map(data, 'id'));
                    filter = function(d) { return set.has(d.id); };

                } else {
                    data = all;
                    filter = d3.functor(true);
                }
            }

            data = features.filter(data, graph);

            surface
                .call(drawVertices, graph, data, filter, map.extent(), map.zoom())
                .call(drawLines, graph, data, filter)
                .call(drawAreas, graph, data, filter)
                .call(drawMidpoints, graph, data, filter, map.trimmedExtent())
                .call(drawLabels, graph, data, filter, dimensions, !difference && !extent)
                .call(drawPoints, graph, data, filter);

            dispatch.drawn({full: true});
        }

        function editOff() {
            context.features().resetStats();
            surface.selectAll('.layer-osm *').remove();
            dispatch.drawn({full: true});
        }

        function dblClick() {
            if (!dblclickEnabled) {
                d3.event.preventDefault();
                d3.event.stopImmediatePropagation();
            }
        }

        function zoomPan() {
            if (Math.log(d3.event.scale) / Math.LN2 - 8 < minzoom) {
                surface.interrupt();
                iD.ui.flash(context.container())
                    .select('.content')
                    .text(t('cannot_zoom'));
                setZoom(context.minEditableZoom(), true);
                queueRedraw();
                dispatch.move(map);
                return;
            }

            projection
                .translate(d3.event.translate)
                .scale(d3.event.scale / (2 * Math.PI));

            var scale = d3.event.scale / transformStart[0],
                tX = (d3.event.translate[0] / scale - transformStart[1][0]) * scale,
                tY = (d3.event.translate[1] / scale - transformStart[1][1]) * scale;

            transformed = true;
            iD.util.setTransform(supersurface, tX, tY, scale);
            queueRedraw();

            dispatch.move(map);
        }

        function resetTransform() {
            if (!transformed) return false;

            surface.selectAll('.radial-menu').interrupt().remove();
            iD.util.setTransform(supersurface, 0, 0);
            transformed = false;
            return true;
        }

        function redraw(difference, extent) {
            if (!surface || !redrawEnabled) return;

            clearTimeout(timeoutId);

            // If we are in the middle of a zoom/pan, we can't do differenced redraws.
            // It would result in artifacts where differenced entities are redrawn with
            // one transform and unchanged entities with another.
            if (resetTransform()) {
                difference = extent = undefined;
            }

            var zoom = String(~~map.zoom());
            if (surface.attr('data-zoom') !== zoom) {
                surface.attr('data-zoom', zoom)
                    .classed('low-zoom', zoom <= 16);
            }

            if (!difference) {
                supersurface.call(context.background());
            }

            // OSM
            if (map.editable()) {
                context.loadTiles(projection, dimensions);
                drawVector(difference, extent);
            } else {
                editOff();
            }

            wrapper
                .call(drawLayers);

            transformStart = [
                projection.scale() * 2 * Math.PI,
                projection.translate().slice()];

            return map;
        }

        var timeoutId;
        function queueRedraw() {
            timeoutId = setTimeout(function() { redraw(); }, 750);
        }

        function pointLocation(p) {
            var translate = projection.translate(),
                scale = projection.scale() * 2 * Math.PI;
            return [(p[0] - translate[0]) / scale, (p[1] - translate[1]) / scale];
        }

        function locationPoint(l) {
            var translate = projection.translate(),
                scale = projection.scale() * 2 * Math.PI;
            return [l[0] * scale + translate[0], l[1] * scale + translate[1]];
        }

        map.mouse = function() {
            var e = mousemove || d3.event, s;
            while ((s = e.sourceEvent)) e = s;
            return mouse(e);
        };

        map.mouseCoordinates = function() {
            return projection.invert(map.mouse());
        };

        map.dblclickEnable = function(_) {
            if (!arguments.length) return dblclickEnabled;
            dblclickEnabled = _;
            return map;
        };

        map.redrawEnable = function(_) {
            if (!arguments.length) return redrawEnabled;
            redrawEnabled = _;
            return map;
        };

        function interpolateZoom(_) {
            var k = projection.scale(),
                t = projection.translate();

            surface.node().__chart__ = {
                x: t[0],
                y: t[1],
                k: k * 2 * Math.PI
            };

            setZoom(_);
            projection.scale(k).translate(t);  // undo setZoom projection changes

            zoom.event(surface.transition());
        }

        function setZoom(_, force) {
            if (_ === map.zoom() && !force)
                return false;
            var scale = 256 * Math.pow(2, _),
                center = pxCenter(),
                l = pointLocation(center);
            scale = Math.max(1024, Math.min(256 * Math.pow(2, 24), scale));
            projection.scale(scale / (2 * Math.PI));
            zoom.scale(scale);
            var t = projection.translate();
            l = locationPoint(l);
            t[0] += center[0] - l[0];
            t[1] += center[1] - l[1];
            projection.translate(t);
            zoom.translate(projection.translate());
            return true;
        }

        function setCenter(_) {
            var c = map.center();
            if (_[0] === c[0] && _[1] === c[1])
                return false;
            var t = projection.translate(),
                pxC = pxCenter(),
                ll = projection(_);
            projection.translate([
                t[0] - ll[0] + pxC[0],
                t[1] - ll[1] + pxC[1]]);
            zoom.translate(projection.translate());
            return true;
        }

        map.pan = function(d) {
            var t = projection.translate();
            t[0] += d[0];
            t[1] += d[1];
            projection.translate(t);
            zoom.translate(projection.translate());
            dispatch.move(map);
            return redraw();
        };

        map.dimensions = function(_) {
            if (!arguments.length) return dimensions;
            var center = map.center();
            dimensions = _;
            drawLayers.dimensions(dimensions);
            context.background().dimensions(dimensions);
            projection.clipExtent([[0, 0], dimensions]);
            mouse = iD.util.fastMouse(supersurface.node());
            setCenter(center);
            return redraw();
        };

        function zoomIn(integer) {
          interpolateZoom(~~map.zoom() + integer);
        }

        function zoomOut(integer) {
          interpolateZoom(~~map.zoom() - integer);
        }

        map.zoomIn = function() { zoomIn(1); };
        map.zoomInFurther = function() { zoomIn(4); };

        map.zoomOut = function() { zoomOut(1); };
        map.zoomOutFurther = function() { zoomOut(4); };

        map.center = function(loc) {
            if (!arguments.length) {
                return projection.invert(pxCenter());
            }

            if (setCenter(loc)) {
                dispatch.move(map);
            }

            return redraw();
        };

        map.zoom = function(z) {
            if (!arguments.length) {
                return Math.max(Math.log(projection.scale() * 2 * Math.PI) / Math.LN2 - 8, 0);
            }

            if (z < minzoom) {
                surface.interrupt();
                iD.ui.flash(context.container())
                    .select('.content')
                    .text(t('cannot_zoom'));
                z = context.minEditableZoom();
            }

            if (setZoom(z)) {
                dispatch.move(map);
            }

            return redraw();
        };

        map.zoomTo = function(entity, zoomLimits) {
            var extent = entity.extent(context.graph());
            if (!isFinite(extent.area())) return;

            var zoom = map.trimmedExtentZoom(extent);
            zoomLimits = zoomLimits || [context.minEditableZoom(), 20];
            map.centerZoom(extent.center(), Math.min(Math.max(zoom, zoomLimits[0]), zoomLimits[1]));
        };

        map.centerZoom = function(loc, z) {
            var centered = setCenter(loc),
                zoomed   = setZoom(z);

            if (centered || zoomed) {
                dispatch.move(map);
            }

            return redraw();
        };

        map.centerEase = function(loc2, duration) {
            duration = duration || 250;

            surface.one('mousedown.ease', function() {
                map.cancelEase();
            });

            if (easing) {
                map.cancelEase();
            }

            var t1 = Date.now(),
                t2 = t1 + duration,
                loc1 = map.center(),
                ease = d3.ease('cubic-in-out');

            easing = true;

            d3.timer(function() {
                if (!easing) return true;  // cancelled ease

                var tNow = Date.now();
                if (tNow > t2) {
                    tNow = t2;
                    easing = false;
                }

                var locNow = iD.geo.interp(loc1, loc2, ease((tNow - t1) / duration));
                setCenter(locNow);

                d3.event = {
                    scale: zoom.scale(),
                    translate: zoom.translate()
                };

                zoomPan();
                return !easing;
            });

            return map;
        };

        map.cancelEase = function() {
            easing = false;
            d3.timer.flush();
            return map;
        };

        map.extent = function(_) {
            if (!arguments.length) {
                return new iD.geo.Extent(projection.invert([0, dimensions[1]]),
                                     projection.invert([dimensions[0], 0]));
            } else {
                var extent = iD.geo.Extent(_);
                map.centerZoom(extent.center(), map.extentZoom(extent));
            }
        };

        map.trimmedExtent = function(_) {
            if (!arguments.length) {
                var headerY = 60, footerY = 30, pad = 10;
                return new iD.geo.Extent(projection.invert([pad, dimensions[1] - footerY - pad]),
                        projection.invert([dimensions[0] - pad, headerY + pad]));
            } else {
                var extent = iD.geo.Extent(_);
                map.centerZoom(extent.center(), map.trimmedExtentZoom(extent));
            }
        };

        function calcZoom(extent, dim) {
            var tl = projection([extent[0][0], extent[1][1]]),
                br = projection([extent[1][0], extent[0][1]]);

            // Calculate maximum zoom that fits extent
            var hFactor = (br[0] - tl[0]) / dim[0],
                vFactor = (br[1] - tl[1]) / dim[1],
                hZoomDiff = Math.log(Math.abs(hFactor)) / Math.LN2,
                vZoomDiff = Math.log(Math.abs(vFactor)) / Math.LN2,
                newZoom = map.zoom() - Math.max(hZoomDiff, vZoomDiff);

            return newZoom;
        }

        map.extentZoom = function(_) {
            return calcZoom(iD.geo.Extent(_), dimensions);
        };

        map.trimmedExtentZoom = function(_) {
            var trimY = 120, trimX = 40,
                trimmed = [dimensions[0] - trimX, dimensions[1] - trimY];
            return calcZoom(iD.geo.Extent(_), trimmed);
        };

        map.editable = function() {
            return map.zoom() >= context.minEditableZoom();
        };

        map.minzoom = function(_) {
            if (!arguments.length) return minzoom;
            minzoom = _;
            return map;
        };

        map.layers = drawLayers;

        return d3.rebind(map, dispatch, 'on');
    }

    exports.BackgroundSource = BackgroundSource;
    exports.Background = Background;
    exports.Features = Features;
    exports.Map = Map;
    exports.TileLayer = TileLayer;

    Object.defineProperty(exports, '__esModule', { value: true });

}));