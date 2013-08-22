iD.Background = function(context) {
    var dispatch = d3.dispatch('change'),
        baseLayer = iD.TileLayer()
            .projection(context.projection),
        gpxLayer = iD.GpxLayer(context, dispatch)
            .projection(context.projection),
        overlayLayers = [];

    var backgroundSources = iD.data.imagery.map(function(source) {
        if (source.sourcetag === 'Bing') {
            return iD.BackgroundSource.Bing(source, dispatch);
        } else {
            return iD.BackgroundSource(source);
        }
    });

    function findSource(sourcetag) {
        return _.find(backgroundSources, function(d) {
            return d.sourcetag && d.sourcetag === sourcetag;
        });
    }

    function updateImagery() {
        var b = background.baseLayerSource(),
            o = overlayLayers.map(function (d) { return d.source().sourcetag; }).join(','),
            q = iD.util.stringQs(location.hash.substring(1));

        var tag = b.sourcetag;
        if (!tag && b.name === 'Custom') {
            tag = 'custom:' + b.template;
        }

        if (tag) {
            q.background = tag;
        } else {
            delete q.background;
        }

        if (o) {
            q.overlays = o;
        } else {
            delete q.overlays;
        }

        location.replace('#' + iD.util.qsString(q, true));

        var imageryUsed = [];
        if (b.name === 'Custom') {
            imageryUsed.push('Custom (' + b.template + ')');
        } else {
            imageryUsed.push(b.sourcetag || b.name);
        }

        overlayLayers.forEach(function (d) {
            imageryUsed.push(d.source().sourcetag || d.source().name);
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

        var gpx = selection.selectAll('.gpx-layer')
            .data([0]);

        gpx.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer gpx-layer');

        gpx.call(gpxLayer);

        var overlays = selection.selectAll('.overlay-layer')
            .data(overlayLayers, function(d) { return d.source().name });

        overlays.enter().insert('div', '.layer-data')
            .attr('class', 'layer-layer overlay-layer');

        overlays.each(function(layer) {
            d3.select(this).call(layer);
        });

        overlays.exit()
            .remove();
    }

    background.sources = function(extent) {
        return backgroundSources.filter(function(source) {
            return source.intersects(extent);
        });
    };

    background.dimensions = function(_) {
        baseLayer.dimensions(_);
        gpxLayer.dimensions(_);

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
        background.baseLayerSource(findSource("Bing"));
    };

    background.hasGpxLayer = function() {
        return !_.isEmpty(gpxLayer.geojson());
    };

    background.showsGpxLayer = function() {
        return background.hasGpxLayer() && gpxLayer.enable();
    };

    background.zoomToGpxLayer = function() {
        if (background.hasGpxLayer()) {
            context.map()
                .extent(d3.geo.bounds(gpxLayer.geojson()));
        }
    };

    background.toggleGpxLayer = function() {
        gpxLayer.enable(!gpxLayer.enable());
        dispatch.change();
    };

    background.showsLayer = function(d) {
        return d === baseLayer.source() ||
            (d.name === 'Custom' && baseLayer.source().name === 'Custom') ||
            overlayLayers.some(function(l) { return l.source() === d; });
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

    var q = iD.util.stringQs(location.hash.substring(1)),
        chosen = q.background || q.layer;

    if (chosen && chosen.indexOf('custom:') === 0) {
        background.baseLayerSource(iD.BackgroundSource({
            template: chosen.replace(/^custom:/, ''),
            name: 'Custom'
        }));
    } else {
        background.baseLayerSource(findSource(chosen) || findSource("Bing"));
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

    return d3.rebind(background, dispatch, 'on');
};
