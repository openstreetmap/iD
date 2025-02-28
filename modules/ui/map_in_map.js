import { geoPath as d3_geoPath } from 'd3-geo';
import { select as d3_select } from 'd3-selection';
import { zoom as d3_zoom, zoomIdentity as d3_zoomIdentity } from 'd3-zoom';

import { t } from '../core/localizer';
import { geoRawMercator, geoScaleToZoom, geoVecSubtract, geoVecScale, geoZoomToScale } from '../geo';
import { rendererTileLayer } from '../renderer';
import { svgDebug, svgData } from '../svg';
import { utilSetTransform } from '../util';
// import { utilGetDimensions } from '../util/dimensions';


export function uiMapInMap(context) {

    function mapInMap(selection) {
        const backgroundLayer = rendererTileLayer(context)
            .underzoom(2);
        const overlayLayers = {};
        const projection = geoRawMercator();
        const dataLayer = svgData(projection, context).showLabels(false);
        const debugLayer = svgDebug(projection, context);
        const zoom = d3_zoom()
            .scaleExtent([geoZoomToScale(0.5), geoZoomToScale(24)])
            .on('start', zoomStarted)
            .on('zoom', zoomed)
            .on('end', zoomEnded);

        let wrap = d3_select(null);
        let tiles = d3_select(null);
        let viewport = d3_select(null);

        let _isTransformed = false;
        let _isHidden = true;
        let _skipEvents = false;
        let _gesture = null;
        let _zDiff = 6;    // by default, minimap renders at (main zoom - 6)
        let _tStart;       // transform at start of gesture
        let _tCurr;        // transform at most recent event
        let _timeoutID;

        // reflow warning: Hardcode dimensions - currently can't resize it anyway..
        const _dMini = [200,150];                 // dimensions of minimap
        const _cMini = geoVecScale(_dMini, 0.5);  // center pixel of minimap


        function zoomStarted() {
            if (_skipEvents) return;
            _tStart = _tCurr = projection.transform();
            _gesture = null;
        }


        function zoomed(d3_event) {
            if (_skipEvents) return;

            const x = d3_event.transform.x;
            const y = d3_event.transform.y;
            let k = d3_event.transform.k;
            const isZooming = (k !== _tStart.k);
            const isPanning = (x !== _tStart.x || y !== _tStart.y);

            if (!isZooming && !isPanning) {
                return;  // no change
            }

            // lock in either zooming or panning, don't allow both in minimap.
            if (!_gesture) {
                _gesture = isZooming ? 'zoom' : 'pan';
            }

            const tMini = projection.transform();
            let tX, tY, scale;

            if (_gesture === 'zoom') {
                scale = k / tMini.k;
                tX = (_cMini[0] / scale - _cMini[0]) * scale;
                tY = (_cMini[1] / scale - _cMini[1]) * scale;
            } else {
                k = tMini.k;
                scale = 1;
                tX = x - tMini.x;
                tY = y - tMini.y;
            }

            utilSetTransform(tiles, tX, tY, scale);
            utilSetTransform(viewport, 0, 0, scale);
            _isTransformed = true;
            _tCurr = d3_zoomIdentity.translate(x, y).scale(k);

            const zMain = geoScaleToZoom(context.projection.scale());
            const zMini = geoScaleToZoom(k);

            _zDiff = zMain - zMini;

            queueRedraw();
        }


        function zoomEnded() {
            if (_skipEvents) return;
            if (_gesture !== 'pan') return;

            updateProjection();
            _gesture = null;
            context.map().center(projection.invert(_cMini));   // recenter main map..
        }


        function updateProjection() {
            const loc = context.map().center();
            const tMain = context.projection.transform();
            const zMain = geoScaleToZoom(tMain.k);
            const zMini = Math.max(zMain - _zDiff, 0.5);
            const kMini = geoZoomToScale(zMini);

            projection
                .translate([tMain.x, tMain.y])
                .scale(kMini);

            const point = projection(loc);
            const mouse = (_gesture === 'pan') ? geoVecSubtract([_tCurr.x, _tCurr.y], [_tStart.x, _tStart.y]) : [0, 0];
            const xMini = _cMini[0] - point[0] + tMain.x + mouse[0];
            const yMini = _cMini[1] - point[1] + tMain.y + mouse[1];

            projection
                .translate([xMini, yMini])
                .clipExtent([[0, 0], _dMini]);

            _tCurr = projection.transform();

            if (_isTransformed) {
                utilSetTransform(tiles, 0, 0);
                utilSetTransform(viewport, 0, 0);
                _isTransformed = false;
            }

            zoom
                .scaleExtent([geoZoomToScale(0.5), geoZoomToScale(zMain - 3)]);

            _skipEvents = true;
            wrap.call(zoom.transform, _tCurr);
            _skipEvents = false;
        }


        function redraw() {
            clearTimeout(_timeoutID);
            if (_isHidden) return;

            updateProjection();
            const zMini = geoScaleToZoom(projection.scale());

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
                .dimensions(_dMini);

            const background = tiles
                .selectAll('.map-in-map-background')
                .data([0]);

            background.enter()
                .append('div')
                .attr('class', 'map-in-map-background')
                .merge(background)
                .call(backgroundLayer);


            // redraw overlay
            const overlaySources = context.background().overlayLayerSources();
            const activeOverlayLayers = [];
            for (let i = 0; i < overlaySources.length; i++) {
                if (overlaySources[i].validZoom(zMini)) {
                    if (!overlayLayers[i]) overlayLayers[i] = rendererTileLayer(context);
                    activeOverlayLayers.push(overlayLayers[i]
                        .source(overlaySources[i])
                        .projection(projection)
                        .dimensions(_dMini));
                }
            }

            let overlay = tiles
                .selectAll('.map-in-map-overlay')
                .data([0]);

            overlay = overlay.enter()
                .append('div')
                .attr('class', 'map-in-map-overlay')
                .merge(overlay);


            let overlays = overlay
                .selectAll('div')
                .data(activeOverlayLayers, function(d) { return d.source().name(); });

            overlays.exit()
                .remove();

            overlays = overlays.enter()
                .append('div')
                .merge(overlays)
                .each(function(layer) { d3_select(this).call(layer); });


            let dataLayers = tiles
                .selectAll('.map-in-map-data')
                .data([0]);

            dataLayers.exit()
                .remove();

            dataLayers = dataLayers.enter()
                .append('svg')
                .attr('class', 'map-in-map-data')
                .merge(dataLayers)
                .call(dataLayer)
                .call(debugLayer);


            // redraw viewport bounding box
            if (_gesture !== 'pan') {
                const getPath = d3_geoPath(projection);
                const bbox = { type: 'Polygon', coordinates: [context.map().extent().polygon()] };

                viewport = wrap.selectAll('.map-in-map-viewport')
                    .data([0]);

                viewport = viewport.enter()
                    .append('svg')
                    .attr('class', 'map-in-map-viewport')
                    .merge(viewport);


                const path = viewport.selectAll('.map-in-map-bbox')
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
            clearTimeout(_timeoutID);
            _timeoutID = setTimeout(function() { redraw(); }, 750);
        }


        function toggle(d3_event) {
            if (d3_event) d3_event.preventDefault();

            _isHidden = !_isHidden;

            context.container().select('.minimap-toggle-item')
                .classed('active', !_isHidden)
                .select('input')
                .property('checked', !_isHidden);

            if (_isHidden) {
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
            .style('display', (_isHidden ? 'none' : 'block'))
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

        context.keybinding()
            .on(t('background.minimap.key'), toggle);
    }

    return mapInMap;
}
