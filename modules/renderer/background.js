import * as d3 from 'd3';
import _ from 'lodash';
import { data } from '../../data/index';
import { geoExtent, geoMetersToOffset, geoOffsetToMeters} from '../geo/index';
import { rendererBackgroundSource } from './background_source';
import { rendererTileLayer } from './tile_layer';
import { utilQsString, utilStringQs } from '../util/index';
import { utilRebind } from '../util/rebind';


export function rendererBackground(context) {
    var dispatch = d3.dispatch('change'),
        baseLayer = rendererTileLayer(context).projection(context.projection),
        overlayLayers = [],
        backgroundSources;


    function background(selection) {
        var base = selection.selectAll('.layer-background')
            .data([0]);

        base.enter()
            .insert('div', '.layer-data')
            .attr('class', 'layer layer-background')
            .merge(base)
            .call(baseLayer);

        var overlays = selection.selectAll('.layer-overlay')
            .data(overlayLayers, function(d) { return d.source().name(); });

        overlays.exit()
            .remove();

        overlays.enter()
            .insert('div', '.layer-data')
            .attr('class', 'layer layer-overlay')
            .merge(overlays)
            .each(function(layer) { d3.select(this).call(layer); });
    }


    background.updateImagery = function() {
        if (context.inIntro()) return;

        var b = background.baseLayerSource(),
            o = overlayLayers
                .filter(function (d) { return !d.source().isLocatorOverlay(); })
                .map(function (d) { return d.source().id; })
                .join(','),
            meters = geoOffsetToMeters(b.offset()),
            epsilon = 0.01,
            x = +meters[0].toFixed(2),
            y = +meters[1].toFixed(2),
            q = utilStringQs(window.location.hash.substring(1));

        var id = b.id;
        if (id === 'custom') {
            id = 'custom:' + b.template();
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

        if (!window.mocha) {
            window.location.replace('#' + utilQsString(q, true));
        }

        var imageryUsed = [b.imageryUsed()];

        overlayLayers
            .filter(function (d) { return !d.source().isLocatorOverlay(); })
            .forEach(function (d) { imageryUsed.push(d.source().imageryUsed()); });

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
        if (!_) return;
        baseLayer.dimensions(_);

        overlayLayers.forEach(function(layer) {
            layer.dimensions(_);
        });
    };


    background.baseLayerSource = function(d) {
        if (!arguments.length) return baseLayer.source();

        // test source against OSM imagery blacklists..
        var osm = context.connection();
        if (!osm) return background;

        var blacklists = context.connection().imageryBlacklists();

        var template = d.template(),
            fail = false,
            tested = 0,
            regex, i;

        for (i = 0; i < blacklists.length; i++) {
            try {
                regex = new RegExp(blacklists[i]);
                fail = regex.test(template);
                tested++;
                if (fail) break;
            } catch (e) {
                /* noop */
            }
        }

        // ensure at least one test was run.
        if (!tested) {
            regex = new RegExp('.*\.google(apis)?\..*/(vt|kh)[\?/].*([xyz]=.*){3}.*');
            fail = regex.test(template);
        }

        baseLayer.source(!fail ? d : background.findSource('none'));
        dispatch.call('change');
        background.updateImagery();
        return background;
    };


    background.findSource = function(id) {
        return _.find(backgroundSources, function(d) {
            return d.id && d.id === id;
        });
    };


    background.bing = function() {
        background.baseLayerSource(background.findSource('Bing'));
    };


    background.showsLayer = function(d) {
        return d.id === baseLayer.source().id ||
            overlayLayers.some(function(layer) { return d.id === layer.source().id; });
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
                dispatch.call('change');
                background.updateImagery();
                return;
            }
        }

        layer = rendererTileLayer(context)
            .source(d)
            .projection(context.projection)
            .dimensions(baseLayer.dimensions());

        overlayLayers.push(layer);
        dispatch.call('change');
        background.updateImagery();
    };


    background.nudge = function(d, zoom) {
        baseLayer.source().nudge(d, zoom);
        dispatch.call('change');
        background.updateImagery();
        return background;
    };


    background.offset = function(d) {
        if (!arguments.length) return baseLayer.source().offset();
        baseLayer.source().offset(d);
        dispatch.call('change');
        background.updateImagery();
        return background;
    };


    background.init = function() {
        function parseMap(qmap) {
            if (!qmap) return false;
            var args = qmap.split('/').map(Number);
            if (args.length < 3 || args.some(isNaN)) return false;
            return geoExtent([args[2], args[1]]);
        }

        var dataImagery = data.imagery || [],
            q = utilStringQs(window.location.hash.substring(1)),
            requested = q.background || q.layer,
            extent = parseMap(q.map),
            first,
            best;

        // Add all the available imagery sources
        backgroundSources = dataImagery.map(function(source) {
            if (source.type === 'bing') {
                return rendererBackgroundSource.Bing(source, dispatch);
            } else {
                return rendererBackgroundSource(source);
            }
        });

        first = backgroundSources.length && backgroundSources[0];

        // Add 'None'
        backgroundSources.unshift(rendererBackgroundSource.None());

        // Add 'Custom'
        var template = context.storage('background-custom-template') || '';
        var custom = rendererBackgroundSource.Custom(template);
        backgroundSources.unshift(custom);


        // Decide which background layer to display
        if (!requested && extent) {
            best = _.find(this.sources(extent), function(s) { return s.best(); });
        }
        if (requested && requested.indexOf('custom:') === 0) {
            template = requested.replace(/^custom:/, '');
            background.baseLayerSource(custom.template(template));
            context.storage('background-custom-template', template);
        } else {
            background.baseLayerSource(
                background.findSource(requested) ||
                best ||
                background.findSource('Bing') ||
                first ||
                background.findSource('none')
            );
        }

        var locator = _.find(backgroundSources, function(d) {
            return d.overlay && d.default;
        });

        if (locator) {
            background.toggleOverlayLayer(locator);
        }

        var overlays = (q.overlays || '').split(',');
        overlays.forEach(function(overlay) {
            overlay = background.findSource(overlay);
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
                background.offset(geoMetersToOffset(offset));
            }
        }
    };


    return utilRebind(background, dispatch, 'on');
}
