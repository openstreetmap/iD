import * as d3 from 'd3';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';
import { svgDebug, svgGpx } from '../svg/index';
import { geoRawMercator } from '../geo/index';
import { rendererTileLayer } from '../renderer/index';
import { utilSetTransform } from '../util/index';
import { utilGetDimensions } from '../util/dimensions';


var TAU = 2 * Math.PI;
function ztok(z) { return 256 * Math.pow(2, z) / TAU; }
function ktoz(k) { return Math.log(k * TAU) / Math.LN2 - 8; }
function vecSub(a, b) { return [ a[0] - b[0], a[1] - b[1] ]; }
function vecScale(a, b) { return [ a[0] * b, a[1] * b ]; }


export function uiMapInMap(context) {


    function map_in_map(selection) {
        var backgroundLayer = rendererTileLayer(context),
            overlayLayers = {},
            projection = geoRawMercator(),
            gpxLayer = svgGpx(projection, context).showLabels(false),
            debugLayer = svgDebug(projection, context),
            zoom = d3.zoom()
                .scaleExtent([ztok(0.5), ztok(24)])
                .on('start', zoomStarted)
                .on('zoom', zoomed)
                .on('end', zoomEnded),
            isTransformed = false,
            isHidden = true,
            skipEvents = false,
            gesture = null,
            zDiff = 6,    // by default, minimap renders at (main zoom - 6)
            wrap = d3.select(null),
            tiles = d3.select(null),
            viewport = d3.select(null),
            tStart,  // transform at start of gesture
            tCurr,   // transform at most recent event
            timeoutId;


        function zoomStarted() {
            if (skipEvents) return;
            tStart = tCurr = projection.transform();
            gesture = null;
        }


        function zoomed() {
            if (skipEvents) return;

            var x = d3.event.transform.x,
                y = d3.event.transform.y,
                k = d3.event.transform.k,
                isZooming = (k !== tStart.k),
                isPanning = (x !== tStart.x || y !== tStart.y);

            if (!isZooming && !isPanning) {
                return;  // no change
            }

            // lock in either zooming or panning, don't allow both in minimap.
            if (!gesture) {
                gesture = isZooming ? 'zoom' : 'pan';
            }

            var tMini = projection.transform(),
                tX, tY, scale;

            if (gesture === 'zoom') {
                var dMini = utilGetDimensions(wrap),
                    cMini = vecScale(dMini, 0.5);
                scale = k / tMini.k;
                tX = (cMini[0] / scale - cMini[0]) * scale;
                tY = (cMini[1] / scale - cMini[1]) * scale;
            } else {
                k = tMini.k;
                scale = 1;
                tX = x - tMini.x;
                tY = y - tMini.y;
            }

            utilSetTransform(tiles, tX, tY, scale);
            utilSetTransform(viewport, 0, 0, scale);
            isTransformed = true;
            tCurr = d3.zoomIdentity.translate(x, y).scale(k);

            var zMain = ktoz(context.projection.scale()),
                zMini = ktoz(k);

            zDiff = zMain - zMini;

            queueRedraw();
        }


        function zoomEnded() {
            if (skipEvents) return;
            if (gesture !== 'pan') return;

            updateProjection();
            gesture = null;
            var dMini = utilGetDimensions(wrap),
                cMini = vecScale(dMini, 0.5);
            context.map().center(projection.invert(cMini));   // recenter main map..
        }


        function updateProjection() {
            var loc = context.map().center(),
                dMini = utilGetDimensions(wrap),
                cMini = vecScale(dMini, 0.5),
                tMain = context.projection.transform(),
                zMain = ktoz(tMain.k),
                zMini = Math.max(zMain - zDiff, 0.5),
                kMini = ztok(zMini);

            projection
                .translate([tMain.x, tMain.y])
                .scale(kMini);

            var point = projection(loc),
                mouse = (gesture === 'pan') ? vecSub([tCurr.x, tCurr.y], [tStart.x, tStart.y]) : [0, 0],
                xMini = cMini[0] - point[0] + tMain.x + mouse[0],
                yMini = cMini[1] - point[1] + tMain.y + mouse[1];

            projection
                .translate([xMini, yMini])
                .clipExtent([[0, 0], dMini]);

            tCurr = projection.transform();

            if (isTransformed) {
                utilSetTransform(tiles, 0, 0);
                utilSetTransform(viewport, 0, 0);
                isTransformed = false;
            }

            zoom
                .scaleExtent([ztok(0.5), ztok(zMain - 3)]);

            skipEvents = true;
            wrap.call(zoom.transform, tCurr);
            skipEvents = false;
        }


        function redraw() {
            clearTimeout(timeoutId);
            if (isHidden) return;

            updateProjection();

            var dMini = utilGetDimensions(wrap),
                zMini = ktoz(projection.scale());

            // setup tile container
            tiles = wrap
                .selectAll('.map-in-map-tiles')
                .data([0]);

            tiles = tiles.enter()
                .append('div')
                .attr('class', 'map-in-map-tiles')
                .merge(tiles);

            // redraw background
            backgroundLayer
                .source(context.background().baseLayerSource())
                .projection(projection)
                .dimensions(dMini);

            var background = tiles
                .selectAll('.map-in-map-background')
                .data([0]);

            background.enter()
                .append('div')
                .attr('class', 'map-in-map-background')
                .merge(background)
                .call(backgroundLayer);


            // redraw overlay
            var overlaySources = context.background().overlayLayerSources();
            var activeOverlayLayers = [];
            for (var i = 0; i < overlaySources.length; i++) {
                if (overlaySources[i].validZoom(zMini)) {
                    if (!overlayLayers[i]) overlayLayers[i] = rendererTileLayer(context);
                    activeOverlayLayers.push(overlayLayers[i]
                        .source(overlaySources[i])
                        .projection(projection)
                        .dimensions(dMini));
                }
            }

            var overlay = tiles
                .selectAll('.map-in-map-overlay')
                .data([0]);

            overlay = overlay.enter()
                .append('div')
                .attr('class', 'map-in-map-overlay')
                .merge(overlay);


            var overlays = overlay
                .selectAll('div')
                .data(activeOverlayLayers, function(d) { return d.source().name(); });

            overlays.exit()
                .remove();

            overlays = overlays.enter()
                .append('div')
                .merge(overlays)
                .each(function(layer) { d3.select(this).call(layer); });


            var dataLayers = tiles
                .selectAll('.map-in-map-data')
                .data([0]);

            dataLayers.exit()
                .remove();

            dataLayers = dataLayers.enter()
                .append('svg')
                .attr('class', 'map-in-map-data')
                .merge(dataLayers)
                .call(gpxLayer)
                .call(debugLayer);


            // redraw viewport bounding box
            if (gesture !== 'pan') {
                var getPath = d3.geoPath(projection),
                    bbox = { type: 'Polygon', coordinates: [context.map().extent().polygon()] };

                viewport = wrap.selectAll('.map-in-map-viewport')
                    .data([0]);

                viewport = viewport.enter()
                    .append('svg')
                    .attr('class', 'map-in-map-viewport')
                    .merge(viewport);


                var path = viewport.selectAll('.map-in-map-bbox')
                    .data([bbox]);

                path.enter()
                    .append('path')
                    .attr('class', 'map-in-map-bbox')
                    .merge(path)
                    .attr('d', getPath)
                    .classed('thick', function(d) { return getPath.area(d) < 30; });
            }
        }


        function queueRedraw() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(function() { redraw(); }, 750);
        }


        function toggle() {
            if (d3.event) d3.event.preventDefault();

            isHidden = !isHidden;

            var label = d3.select('.minimap-toggle');
            label.classed('active', !isHidden)
                .select('input').property('checked', !isHidden);

            if (isHidden) {
                wrap
                    .style('display', 'block')
                    .style('opacity', '1')
                    .transition()
                    .duration(200)
                    .style('opacity', '0')
                    .on('end', function() {
                        selection.selectAll('.map-in-map')
                            .style('display', 'none');
                    });
            } else {
                wrap
                    .style('display', 'block')
                    .style('opacity', '0')
                    .transition()
                    .duration(200)
                    .style('opacity', '1')
                    .on('end', function() {
                        redraw();
                    });
            }
        }


        uiMapInMap.toggle = toggle;

        wrap = selection.selectAll('.map-in-map')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'map-in-map')
            .style('display', (isHidden ? 'none' : 'block'))
            .call(zoom)
            .on('dblclick.zoom', null)
            .merge(wrap);

        context.map()
            .on('drawn.map-in-map', function(drawn) {
                if (drawn.full === true) {
                    redraw();
                }
            });

        redraw();

        var keybinding = d3keybinding('map-in-map')
            .on(t('background.minimap.key'), toggle);

        d3.select(document)
            .call(keybinding);
    }

    return map_in_map;
}
