iD.Background = function(context) {
    var dispatch = d3.dispatch('change'),
        baseLayer = iD.TileLayer().projection(context.projection),
        gpxLayer = iD.svg.Gpx(context.projection, context),
        mapillaryImageLayer,
        mapillarySignLayer,
        overlayLayers = [];

    var backgroundSources;

    function findSource(id) {
        return _.find(backgroundSources, function(d) {
            return d.id && d.id === id;
        });
    }

    function updateImagery() {
        var b = background.baseLayerSource(),
            o = overlayLayers.map(function (d) { return d.source().id; }).join(','),
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

        location.replace('#' + iD.util.qsString(q, true));

        var imageryUsed = [b.imageryUsed()];

        overlayLayers.forEach(function (d) {
            var source = d.source();
            if (!source.isLocatorOverlay()) {
                imageryUsed.push(source.imageryUsed());
            }
        });

        if (background.showsGpxLayer()) {
            imageryUsed.push('Local GPX');
        }

        context.history().imageryUsed(imageryUsed);
    }

    function background(selection) {
        var base = selection.selectAll('.background-layer')
            .data([0]);

        base.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer background-layer');

        base.call(baseLayer);

        var overlays = selection.selectAll('.layer-overlay')
            .data(overlayLayers, function(d) { return d.source().name(); });

        overlays.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer layer-overlay');

        overlays.each(function(layer) {
            d3.select(this).call(layer);
        });

        overlays.exit()
            .remove();



        // var gpx = selection.selectAll('.layer-gpx')
        //     .data([0]);

        // gpx.enter().insert('div')
        //     .attr('class', 'layer-layer layer-gpx');

        // gpx.call(gpxLayer);

        selection.selectAll('#surface')
            .call(gpxLayer);




        var mapillary = iD.services.mapillary,
            supportsMapillaryImages = !!mapillary,
            supportsMapillarySigns = !!mapillary && mapillary().signsSupported();

        var mapillaryImages = selection.selectAll('.layer-mapillary-images')
            .data(supportsMapillaryImages ? [0] : []);

        mapillaryImages.enter().insert('div')
            .attr('class', 'layer-layer layer-mapillary-images');

        if (supportsMapillaryImages) {
            if (!mapillaryImageLayer) { mapillaryImageLayer = iD.svg.MapillaryImages(context); }
            mapillaryImages.call(mapillaryImageLayer);
        } else {
            mapillaryImageLayer = null;
        }

        mapillaryImages.exit()
            .remove();


        var mapillarySigns = selection.selectAll('.layer-mapillary-signs')
            .data(supportsMapillarySigns ? [0] : []);

        mapillarySigns.enter().insert('div')
            .attr('class', 'layer-layer layer-mapillary-signs');

        if (supportsMapillarySigns) {
            if (!mapillarySignLayer) { mapillarySignLayer = iD.svg.MapillarySigns(context); }
            mapillarySigns.call(mapillarySignLayer);
        } else {
            mapillarySignLayer = null;
        }

        mapillarySigns.exit()
            .remove();
    }

    background.sources = function(extent) {
        return backgroundSources.filter(function(source) {
            return source.intersects(extent);
        });
    };

    background.dimensions = function(_) {
        baseLayer.dimensions(_);
        if (mapillaryImageLayer) mapillaryImageLayer.dimensions(_);
        if (mapillarySignLayer) mapillarySignLayer.dimensions(_);

        overlayLayers.forEach(function(layer) {
            layer.dimensions(_);
        });
    };

    background.baseLayerSource = function(d) {
        if (!arguments.length) return baseLayer.source();

        baseLayer.source(d);
        dispatch.change();
        updateImagery();

        return background;
    };

    background.bing = function() {
        background.baseLayerSource(findSource('Bing'));
    };

    background.gpxLayer = function() {
        return gpxLayer;
    };

    background.hasGpxLayer = function() {
        return !_.isEmpty(gpxLayer.geojson());
    };

    background.showsGpxLayer = function() {
        return background.hasGpxLayer() && gpxLayer.enabled();
    };

    background.toggleGpxLayer = function() {
        gpxLayer.enabled(!gpxLayer.enabled());
        dispatch.change();
    };

    background.showsMapillaryImageLayer = function() {
        return mapillaryImageLayer && mapillaryImageLayer.enable();
    };

    background.showsMapillarySignLayer = function() {
        return mapillarySignLayer && mapillarySignLayer.enable();
    };

    background.toggleMapillaryImageLayer = function() {
        if (!mapillaryImageLayer) return;
        mapillaryImageLayer.enable(!mapillaryImageLayer.enable());
        dispatch.change();
    };

    background.toggleMapillarySignLayer = function() {
        if (!mapillarySignLayer) return;
        mapillarySignLayer.enable(!mapillarySignLayer.enable());
        dispatch.change();
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
                updateImagery();
                return;
            }
        }

        layer = iD.TileLayer()
            .source(d)
            .projection(context.projection)
            .dimensions(baseLayer.dimensions());

        overlayLayers.push(layer);
        dispatch.change();
        updateImagery();
    };

    background.nudge = function(d, zoom) {
        baseLayer.source().nudge(d, zoom);
        dispatch.change();
        return background;
    };

    background.offset = function(d) {
        if (!arguments.length) return baseLayer.source().offset();
        baseLayer.source().offset(d);
        dispatch.change();
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
                return iD.BackgroundSource.Bing(source, dispatch);
            } else {
                return iD.BackgroundSource(source);
            }
        });

        backgroundSources.unshift(iD.BackgroundSource.None());

        if (!chosen && extent) {
            best = _.find(this.sources(extent), function(s) { return s.best(); });
        }

        if (chosen && chosen.indexOf('custom:') === 0) {
            background.baseLayerSource(iD.BackgroundSource.Custom(chosen.replace(/^custom:/, '')));
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
            if (overlay) background.toggleOverlayLayer(overlay);
        });

        if (q.gpx) {
            gpxLayer.url(q.gpx);
        }
    };

    return d3.rebind(background, dispatch, 'on');
};
