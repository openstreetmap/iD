iD.Background = function(context) {
    var dispatch = d3.dispatch('change'),
        baseLayer = iD.TileLayer()
            .projection(context.projection),
        gpxLayer = iD.GpxLayer(context, dispatch)
            .projection(context.projection),
        overlayLayer = iD.TileLayer('overlay')
            .projection(context.projection),
        layers = [baseLayer, gpxLayer, overlayLayer];

    var backgroundSources = iD.data.imagery.map(function(source) {
        if (source.sourcetag === 'Bing') {
            return iD.BackgroundSource.Bing(source, dispatch);
        } else {
            return iD.BackgroundSource.template(source);
        }
    });

    backgroundSources.push(iD.BackgroundSource.Custom);

    function findSource(sourcetag) {
        return _.find(backgroundSources, function(d) {
            return d.data.sourcetag && d.data.sourcetag === sourcetag;
        });
    }

    function background(supersurface) {
        layers.forEach(function(layer) {
            supersurface.call(layer);
        });
    }

    background.sources = function(extent) {
        return backgroundSources.filter(function(layer) {
            return !layer.data.extent ||
                iD.geo.Extent(layer.data.extent).intersects(extent);
        });
    };

    background.dimensions = function(_) {
        layers.forEach(function(layer) {
            layer.dimensions(_);
        });
    };

    background.baseLayerSource = function(d) {
        if (!arguments.length) return baseLayer.source();
        baseLayer.source(d);
        dispatch.change();
        if (d.data.name === 'Custom (customized)') {
            context.history()
                .imagery_used('Custom (' + d.data.template + ')');
        } else {
            context.history()
                .imagery_used(d.data.sourcetag || d.data.name);
        }
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
        var overlay = overlayLayer.source();
        return d.data.name === baseLayer.source().data.name ||
            (overlay.data && overlay.data.name === d.data.name);
    };

    background.toggleOverlayLayer = function(d) {
        if (overlayLayer.source() === d) {
            overlayLayer.source(d3.functor(''));
        } else {
            overlayLayer.source(d);
        }
        dispatch.change();
    };

    background.nudge = function(d, zoom) {
        baseLayer.nudge(d, zoom);
        dispatch.change();
        return background;
    };

    background.offset = function(d) {
        if (!arguments.length) return baseLayer.offset();
        baseLayer.offset(d);
        dispatch.change();
        return background;
    };

    var q = iD.util.stringQs(location.hash.substring(1)),
        chosen = q.background || q.layer;

    if (chosen && chosen.indexOf('custom:') === 0) {
        background.baseLayerSource(iD.BackgroundSource.template({
            template: chosen.replace(/^custom:/, ''),
            name: 'Custom'
        }));
    } else {
        background.baseLayerSource(findSource(chosen) || findSource("Bing"));
    }

    return d3.rebind(background, dispatch, 'on');
};
