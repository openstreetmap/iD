import _find from 'lodash-es/find';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { interpolateNumber as d3_interpolateNumber } from 'd3-interpolate';
import { select as d3_select } from 'd3-selection';

import whichPolygon from 'which-polygon';

import { data } from '../../data';
import { geoExtent, geoMetersToOffset, geoOffsetToMeters} from '../geo';
import { rendererBackgroundSource } from './background_source';
import { rendererTileLayer } from './tile_layer';
import { utilQsString, utilStringQs } from '../util';
import { utilDetect } from '../util/detect';
import { utilRebind } from '../util/rebind';


export function rendererBackground(context) {
    var dispatch = d3_dispatch('change');
    var detected = utilDetect();
    var baseLayer = rendererTileLayer(context).projection(context.projection);
    var _overlayLayers = [];
    var _backgroundSources = [];
    var _brightness = 1;
    var _contrast = 1;
    var _saturation = 1;
    var _sharpness = 1;


    function background(selection) {
        // If we are displaying an Esri basemap at high zoom,
        // check its tilemap to see how high the zoom can go
        if (context.map().zoom() > 18) {
            var basemap = baseLayer.source();
            if (basemap && /^EsriWorldImagery/.test(basemap.id)) {
                var center = context.map().center();
                basemap.fetchTilemap(center);
            }
        }

        var baseFilter = '';
        if (detected.cssfilters) {
            if (_brightness !== 1) {
                baseFilter += 'brightness(' + _brightness + ')';
            }
            if (_contrast !== 1) {
                baseFilter += 'contrast(' + _contrast + ')';
            }
            if (_saturation !== 1) {
                baseFilter += 'saturate(' + _saturation + ')';
            }
            if (_sharpness < 1) {  // gaussian blur
                var blur = d3_interpolateNumber(0.5, 5)(1 - _sharpness);
                baseFilter += 'blur(' + blur + 'px)';
            }
        }

        var base = selection.selectAll('.layer-background')
            .data([0]);

        base = base.enter()
            .insert('div', '.layer-data')
            .attr('class', 'layer layer-background')
            .merge(base);

        if (detected.cssfilters) {
            base.style('filter', baseFilter || null);
        } else {
            base.style('opacity', _brightness);
        }


        var imagery = base.selectAll('.layer-imagery')
            .data([0]);

        imagery.enter()
            .append('div')
            .attr('class', 'layer layer-imagery')
            .merge(imagery)
            .call(baseLayer);


        var maskFilter = '';
        var mixBlendMode = '';
        if (detected.cssfilters && _sharpness > 1) {  // apply unsharp mask
            mixBlendMode = 'overlay';
            maskFilter = 'saturate(0) blur(3px) invert(1)';

            var contrast = _sharpness - 1;
            maskFilter += ' contrast(' + contrast + ')';

            var brightness = d3_interpolateNumber(1, 0.85)(_sharpness - 1);
            maskFilter += ' brightness(' + brightness + ')';
        }

        var mask = base.selectAll('.layer-unsharp-mask')
            .data(detected.cssfilters && _sharpness > 1 ? [0] : []);

        mask.exit()
            .remove();

        mask.enter()
            .append('div')
            .attr('class', 'layer layer-mask layer-unsharp-mask')
            .merge(mask)
            .call(baseLayer)
            .style('filter', maskFilter || null)
            .style('mix-blend-mode', mixBlendMode || null);


        var overlays = selection.selectAll('.layer-overlay')
            .data(_overlayLayers, function(d) { return d.source().name(); });

        overlays.exit()
            .remove();

        overlays.enter()
            .insert('div', '.layer-data')
            .attr('class', 'layer layer-overlay')
            .merge(overlays)
            .each(function(layer) { d3_select(this).call(layer); });
    }


    background.updateImagery = function() {
        if (context.inIntro()) return;

        var b = background.baseLayerSource();
        var o = _overlayLayers
            .filter(function (d) { return !d.source().isLocatorOverlay() && !d.source().isHidden(); })
            .map(function (d) { return d.source().id; })
            .join(',');

        var meters = geoOffsetToMeters(b.offset());
        var epsilon = 0.01;
        var x = +meters[0].toFixed(2);
        var y = +meters[1].toFixed(2);
        var q = utilStringQs(window.location.hash.substring(1));

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

        _overlayLayers
            .filter(function (d) { return !d.source().isLocatorOverlay() && !d.source().isHidden(); })
            .forEach(function (d) { imageryUsed.push(d.source().imageryUsed()); });

        var data = context.layers().layer('data');
        if (data && data.enabled() && data.hasData()) {
            imageryUsed.push(data.getSrc());
        }

        var streetside = context.layers().layer('streetside');
        if (streetside && streetside.enabled()) {
            imageryUsed.push('Bing Streetside');
        }

        var mapillary_images = context.layers().layer('mapillary-images');
        if (mapillary_images && mapillary_images.enabled()) {
            imageryUsed.push('Mapillary Images');
        }

        var mapillary_signs = context.layers().layer('mapillary-signs');
        if (mapillary_signs && mapillary_signs.enabled()) {
            imageryUsed.push('Mapillary Signs');
        }

        var openstreetcam_images = context.layers().layer('openstreetcam-images');
        if (openstreetcam_images && openstreetcam_images.enabled()) {
            imageryUsed.push('OpenStreetCam Images');
        }

        context.history().imageryUsed(imageryUsed);
    };


    background.sources = function(extent) {
        if (!data.imagery || !data.imagery.query) return [];   // called before init()?

        var matchIDs = {};
        var matchImagery = data.imagery.query.bbox(extent.rectangle(), true) || [];
        matchImagery.forEach(function(d) { matchIDs[d.id] = true; });

        return _backgroundSources.filter(function(source) {
            return matchIDs[source.id] || !source.polygon;   // no polygon = worldwide
        });
    };


    background.dimensions = function(d) {
        if (!d) return;
        baseLayer.dimensions(d);

        _overlayLayers.forEach(function(layer) {
            layer.dimensions(d);
        });
    };


    background.baseLayerSource = function(d) {
        if (!arguments.length) return baseLayer.source();

        // test source against OSM imagery blacklists..
        var osm = context.connection();
        if (!osm) return background;

        var blacklists = context.connection().imageryBlacklists();
        var template = d.template();
        var fail = false;
        var tested = 0;
        var regex;

        for (var i = 0; i < blacklists.length; i++) {
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
        return _find(_backgroundSources, function(d) {
            return d.id && d.id === id;
        });
    };


    background.bing = function() {
        background.baseLayerSource(background.findSource('Bing'));
    };


    background.showsLayer = function(d) {
        return d.id === baseLayer.source().id ||
            _overlayLayers.some(function(layer) { return d.id === layer.source().id; });
    };


    background.overlayLayerSources = function() {
        return _overlayLayers.map(function (l) { return l.source(); });
    };


    background.toggleOverlayLayer = function(d) {
        var layer;
        for (var i = 0; i < _overlayLayers.length; i++) {
            layer = _overlayLayers[i];
            if (layer.source() === d) {
                _overlayLayers.splice(i, 1);
                dispatch.call('change');
                background.updateImagery();
                return;
            }
        }

        layer = rendererTileLayer(context)
            .source(d)
            .projection(context.projection)
            .dimensions(baseLayer.dimensions()
        );

        _overlayLayers.push(layer);
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


    background.brightness = function(d) {
        if (!arguments.length) return _brightness;
        _brightness = d;
        if (context.mode()) dispatch.call('change');
        return background;
    };


    background.contrast = function(d) {
        if (!arguments.length) return _contrast;
        _contrast = d;
        if (context.mode()) dispatch.call('change');
        return background;
    };


    background.saturation = function(d) {
        if (!arguments.length) return _saturation;
        _saturation = d;
        if (context.mode()) dispatch.call('change');
        return background;
    };


    background.sharpness = function(d) {
        if (!arguments.length) return _sharpness;
        _sharpness = d;
        if (context.mode()) dispatch.call('change');
        return background;
    };


    background.init = function() {
        function parseMap(qmap) {
            if (!qmap) return false;
            var args = qmap.split('/').map(Number);
            if (args.length < 3 || args.some(isNaN)) return false;
            return geoExtent([args[2], args[1]]);
        }

        var q = utilStringQs(window.location.hash.substring(1));
        var requested = q.background || q.layer;
        var extent = parseMap(q.map);
        var first;
        var best;


        data.imagery = data.imagery || [];
        data.imagery.features = {};

        // build efficient index and querying for data.imagery
        var features = data.imagery.map(function(source) {
            if (!source.polygon) return null;

            // Add an extra array nest to each element in `source.polygon`
            // so the rings are not treated as a bunch of holes:
            // what we have: [ [[outer],[hole],[hole]] ]
            // what we want: [ [[outer]],[[outer]],[[outer]] ]
            var rings = source.polygon.map(function(ring) { return [ring]; });

            var feature = {
                type: 'Feature',
                properties: { id: source.id },
                geometry: { type: 'MultiPolygon', coordinates: rings }
            };

            data.imagery.features[source.id] = feature;
            return feature;

        }).filter(Boolean);

        data.imagery.query = whichPolygon({
            type: 'FeatureCollection',
            features: features
        });


        // Add all the available imagery sources
        _backgroundSources = data.imagery.map(function(source) {
            if (source.type === 'bing') {
                return rendererBackgroundSource.Bing(source, dispatch);
            } else if (/^EsriWorldImagery/.test(source.id)) {
                return rendererBackgroundSource.Esri(source);
            } else {
                return rendererBackgroundSource(source);
            }
        });

        first = _backgroundSources.length && _backgroundSources[0];

        // Add 'None'
        _backgroundSources.unshift(rendererBackgroundSource.None());

        // Add 'Custom'
        var template = context.storage('background-custom-template') || '';
        var custom = rendererBackgroundSource.Custom(template);
        _backgroundSources.unshift(custom);


        // Decide which background layer to display
        if (!requested && extent) {
            best = _find(this.sources(extent), function(s) { return s.best(); });
        }
        if (requested && requested.indexOf('custom:') === 0) {
            template = requested.replace(/^custom:/, '');
            background.baseLayerSource(custom.template(template));
            context.storage('background-custom-template', template);
        } else {
            background.baseLayerSource(
                background.findSource(requested) ||
                best ||
                background.findSource(context.storage('background-last-used')) ||
                background.findSource('Bing') ||
                first ||
                background.findSource('none')
            );
        }

        var locator = _find(_backgroundSources, function(d) {
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
            var gpx = context.layers().layer('data');
            if (gpx) {
                gpx.url(q.gpx, '.gpx');
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
