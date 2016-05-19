iD.Background = function(context) {
    var dispatch = d3.dispatch('change'),
        baseLayer = iD.TileLayer(context).projection(context.projection),
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

        layer = iD.TileLayer(context)
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
};
