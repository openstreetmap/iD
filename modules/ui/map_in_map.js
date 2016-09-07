import * as d3 from 'd3';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { Debug, Gpx } from '../svg/index';
import { RawMercator } from '../geo/index';
import { TileLayer } from '../renderer/index';
import { setTransform } from '../util/index';
import { getDimensions } from '../util/dimensions';

function ztok(z) { return 256 * Math.pow(2, z); }
function ktoz(k) { return Math.log(k) / Math.LN2 - 8; }
function vecSub(a, b) { return [ a[0] - b[0], a[1] - b[1] ]; }
function vecScale(a, b) { return [ a[0] * b, a[1] * b ]; }
var TAU = 2 * Math.PI;


export function MapInMap(context) {
    var key = '/';

    function map_in_map(selection) {
        var backgroundLayer = TileLayer(context),
            overlayLayers = {},
            projection = RawMercator(),
            gpxLayer = Gpx(projection, context).showLabels(false),
            debugLayer = Debug(projection, context),
            zoom = d3.zoom()
                .scaleExtent([ztok(0.5), ztok(24)])
                .on('zoom', zoomPan),
            transformed = false,
            panning = false,
            hidden = true,
            zDiff = 6,    // by default, minimap renders at (main zoom - 6)
            tStart, tLast, tiles, viewport, timeoutId;


        function startMouse() {
            context.surface().on('mouseup.map-in-map-outside', endMouse);
            context.container().on('mouseup.map-in-map-outside', endMouse);

            tStart = tLast = projection.transform();
            panning = true;
        }


        function zoomPan() {
            var tCurr = d3.event.transform;

            if (tCurr.x === tStart.x && tCurr.y === tStart.y && tCurr.k === tStart.k) {
                return;  // no change
            }

            // var zMain = ktoz(context.projection.scale() * TAU),
            //     zMini = ktoz(tCurr.k * TAU),
            //     zDiff = zMain - zMini;

            // // restrict minimap zoom to < (main zoom - 3)
            // if (zMini > zMain - 3) {
            //     zMini = zMain - 3;
            //     wrap.call(zoom.transform, tLast);
            //     return;
            // }


            var scale = tCurr.k / tStart.k,
                tX = (tCurr.x / scale - tStart.x) * scale,
                tY = (tCurr.y / scale - tStart.y) * scale;

            setTransform(tiles, tX, tY, scale);
            setTransform(viewport, 0, 0, scale);
            transformed = true;
            tLast = tCurr;

            queueRedraw();

            // var e = d3.event.sourceEvent;
            // e.preventDefault();
            // e.stopPropagation();
        }


        function endMouse() {
            context.surface().on('mouseup.map-in-map-outside', null);
            context.container().on('mouseup.map-in-map-outside', null);

            var changed = false;
            if (tLast.x !== tStart.x && tLast.y !== tStart.y) {
                changed = true;
            }

            updateProjection();
            panning = false;

            if (changed) {
                var dMini = getDimensions(wrap),
                cMini = vecScale(dMini, 0.5);
                context.map().center(projection.invert(cMini));
            }
        }


        function updateProjection() {
            zDiff = Math.max(zDiff, 3);

            var loc = context.map().center(),
                dMini = getDimensions(wrap),
                cMini = vecScale(dMini, 0.5),
                tMain = context.projection.transform(),
                zMain = ktoz(tMain.k * TAU),
                zMini = Math.max(zMain - zDiff, 0.5),
                kMini = ztok(zMini) / TAU;

            projection
                .translate([tMain.x, tMain.y])
                .scale(kMini);

            var point = projection(loc),
                mouse = panning ? vecSub(tLast, tStart) : [0, 0],
                xMini = cMini[0] - point[0] + tMain.x + mouse[0],
                yMini = cMini[1] - point[1] + tMain.y + mouse[1];

            projection
                .translate([xMini, yMini])
                .clipExtent([[0, 0], dMini]);

            tStart = tLast = d3.zoomIdentity.translate(xMini, yMini).scale(kMini);

            if (transformed) {
                setTransform(tiles, 0, 0);
                setTransform(viewport, 0, 0);
                transformed = false;
            }

            zoom
                .scaleExtent([ztok(0.5) / TAU, ztok(zMain - 3) / TAU]);

            wrap.call(zoom.transform, tStart);
        }


        function redraw() {
            if (hidden) return;

            updateProjection();

            var dMini = getDimensions(wrap),
                zMini = ktoz(projection.scale() * TAU);

            // setup tile container
            tiles = wrap
                .selectAll('.map-in-map-tiles')
                .data([0]);

            tiles
                .enter()
                .append('div')
                .attr('class', 'map-in-map-tiles');

            // redraw background
            backgroundLayer
                .source(context.background().baseLayerSource())
                .projection(projection)
                .dimensions(dMini);

            var background = tiles
                .selectAll('.map-in-map-background')
                .data([0]);

            background = background.enter()
                .append('div')
                .attr('class', 'map-in-map-background')
                .merge(background)
                .call(backgroundLayer);


            // redraw overlay
            var overlaySources = context.background().overlayLayerSources();
            var activeOverlayLayers = [];
            for (var i = 0; i < overlaySources.length; i++) {
                if (overlaySources[i].validZoom(zMini)) {
                    if (!overlayLayers[i]) overlayLayers[i] = TileLayer(context);
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
            if (!panning) {
                var getPath = d3.geoPath().projection(projection),
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
            timeoutId = setTimeout(function() { redraw(); }, 300);
        }


        function toggle() {
            if (d3.event) d3.event.preventDefault();

            hidden = !hidden;

            var label = d3.select('.minimap-toggle');
            label.classed('active', !hidden)
                .select('input').property('checked', !hidden);

            if (hidden) {
                // selection.selectAll('.map-in-map')
                //     .style('display', 'none')
                //     .style('opacity', '0');

                selection.selectAll('.map-in-map')
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
                // selection.selectAll('.map-in-map')
                //     .style('display', 'block')
                //     .style('opacity', '1');

                selection.selectAll('.map-in-map')
                    .style('display', 'block')
                    .style('opacity', '0')
                    .transition()
                    .duration(200)
                    .style('opacity', '1');

                redraw();
            }
        }

        MapInMap.toggle = toggle;

        var wrap = selection.selectAll('.map-in-map')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'map-in-map')
            .merge(wrap);

        wrap
            .style('display', (hidden ? 'none' : 'block'))
            .on('mousedown.map-in-map', startMouse)
            .on('mouseup.map-in-map', endMouse)
            .call(zoom)
            .on('dblclick.zoom', null);

        context.map()
            .on('drawn.map-in-map', function(drawn) {
                if (drawn.full === true) redraw();
            });

        redraw();

        var keybinding = d3keybinding('map-in-map')
            .on(key, toggle);

        d3.select(document)
            .call(keybinding);
    }

    return map_in_map;
}
