iD.ui.MapInMap = function(context) {
    var key = '/';

    function map_in_map(selection) {

        var backgroundLayer = iD.TileLayer(),
            dispatch = d3.dispatch('change'),
            gpxLayer = iD.GpxLayer(context, dispatch),
            overlayLayer = iD.TileLayer(),
            projection = iD.geo.RawMercator(),
            zoom = d3.behavior.zoom()
                .scaleExtent([ztok(0.5), ztok(24)])
                .on('zoom', zoomPan),
            transformed = false,
            panning = false,
            zDiff = 6,    // by default, minimap renders at (main zoom - 6)
            tStart, tLast, tCurr, kLast, kCurr, tiles, svg, gpx, timeoutId;

        iD.ui.MapInMap.gpxLayer = gpxLayer;

        function ztok(z) { return 256 * Math.pow(2, z); }
        function ktoz(k) { return Math.log(k) / Math.LN2 - 8; }


        function startMouse() {
            context.surface().on('mouseup.map-in-map-outside', endMouse);
            context.container().on('mouseup.map-in-map-outside', endMouse);

            tStart = tLast = tCurr = projection.translate();
            panning = true;
        }


        function zoomPan() {
            var e = d3.event.sourceEvent,
                t = d3.event.translate,
                k = d3.event.scale,
                zMain = ktoz(context.projection.scale() * 2 * Math.PI),
                zMini = ktoz(k);

            // restrict minimap zoom to < (main zoom - 3)
            if (zMini > zMain - 3) {
                zMini = zMain - 3;
                zoom.scale(kCurr).translate(tCurr);  // restore last good values
                return;
            }

            tCurr = t;
            kCurr = k;
            zDiff = zMain - zMini;

            var scale = kCurr / kLast,
                tX = Math.round((tCurr[0] / scale - tLast[0]) * scale),
                tY = Math.round((tCurr[1] / scale - tLast[1]) * scale);

            iD.util.setTransform(tiles, tX, tY, scale);
            iD.util.setTransform(svg, 0, 0, scale);
            iD.util.setTransform(gpx, 0, 0, scale);
            transformed = true;

            queueRedraw();

            e.preventDefault();
            e.stopPropagation();
        }


        function endMouse() {
            context.surface().on('mouseup.map-in-map-outside', null);
            context.container().on('mouseup.map-in-map-outside', null);

            updateProjection();
            panning = false;

            if (tCurr[0] !== tStart[0] && tCurr[1] !== tStart[1]) {
                var dMini = selection.dimensions(),
                    cMini = [ dMini[0] / 2, dMini[1] / 2 ];

                context.map().center(projection.invert(cMini));
            }
        }


        function updateProjection() {
            var loc = context.map().center(),
                dMini = selection.dimensions(),
                cMini = [ dMini[0] / 2, dMini[1] / 2 ],
                tMain = context.projection.translate(),
                kMain = context.projection.scale(),
                zMain = ktoz(kMain * 2 * Math.PI),
                zMini = Math.max(zMain - zDiff, 0.5),
                kMini = ztok(zMini);

            projection
                .translate(tMain)
                .scale(kMini / (2 * Math.PI));

            var s = projection(loc),
                mouse = panning ? [ tCurr[0] - tStart[0], tCurr[1] - tStart[1] ] : [0, 0],
                tMini = [
                    cMini[0] - s[0] + tMain[0] + mouse[0],
                    cMini[1] - s[1] + tMain[1] + mouse[1]
                ];

            projection
                .translate(tMini)
                .clipExtent([[0, 0], dMini]);

            zoom
                .center(cMini)
                .translate(tMini)
                .scale(kMini);

            tLast = tCurr = tMini;
            kLast = kCurr = kMini;

            if (transformed) {
                iD.util.setTransform(tiles, 0, 0);
                iD.util.setTransform(svg, 0, 0);
                iD.util.setTransform(gpx, 0, 0);
                transformed = false;
            }
        }


        function redraw() {
            if (hidden()) return;

            updateProjection();

            var dMini = selection.dimensions(),
                zMini = ktoz(projection.scale() * 2 * Math.PI);

            // setup tile container
            tiles = selection
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

            background.enter()
                .append('div')
                .attr('class', 'map-in-map-background');

            background
                .call(backgroundLayer);

            // redraw overlay
            var overlaySources = context.background().overlayLayerSources(),
                hasOverlay = false;

            for (var i = 0; i < overlaySources.length; i++) {
                if (overlaySources[i].validZoom(zMini)) {
                    overlayLayer
                        .source(overlaySources[i])
                        .projection(projection)
                        .dimensions(dMini);

                    hasOverlay = true;
                    break;
                }
            }

            var overlay = tiles
                .selectAll('.map-in-map-overlay')
                .data(hasOverlay ? [0] : []);

            overlay.enter()
                .append('div')
                .attr('class', 'map-in-map-overlay');

            overlay.exit()
                .remove();

            if (hasOverlay) {
                overlay
                    .call(overlayLayer);
            }

            gpxLayer
                .projection(projection);

            gpx = tiles
                .selectAll('.map-in-map-gpx')
                .data([0]);

            gpx.enter()
                .append('div')
                .attr('class', 'map-in-map-gpx');

            gpx.call(gpxLayer);
            gpx.dimensions(dMini);

            // redraw bounding box
            if (!panning) {
                var getPath = d3.geo.path().projection(projection),
                    bbox = { type: 'Polygon', coordinates: [context.map().extent().polygon()] };

                svg = selection.selectAll('.map-in-map-svg')
                    .data([0]);

                svg.enter()
                    .append('svg')
                    .attr('class', 'map-in-map-svg');

                var path = svg.selectAll('.map-in-map-bbox')
                    .data([bbox]);

                path.enter()
                    .append('path')
                    .attr('class', 'map-in-map-bbox');

                path
                    .attr('d', getPath)
                    .classed('thick', function(d) { return getPath.area(d) < 30; });
            }
        }


        function queueRedraw() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(function() { redraw(); }, 300);
        }


        function hidden() {
            return selection.style('display') === 'none';
        }


        function toggle() {
            if (d3.event) d3.event.preventDefault();

            var label = d3.select('.minimap-toggle');

            if (hidden()) {
                selection
                    .style('display', 'block')
                    .style('opacity', 0)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);

                label.classed('active', true)
                    .select('input').property('checked', true);

                redraw();

            } else {
                selection
                    .style('display', 'block')
                    .style('opacity', 1)
                    .transition()
                    .duration(200)
                    .style('opacity', 0)
                    .each('end', function() {
                        d3.select(this).style('display', 'none');
                    });

                label.classed('active', false)
                    .select('input').property('checked', false);
            }
        }

        iD.ui.MapInMap.toggle = toggle;

        selection
            .on('mousedown.map-in-map', startMouse)
            .on('mouseup.map-in-map', endMouse);

        selection
            .call(zoom)
            .on('dblclick.zoom', null);

        context.map()
            .on('drawn.map-in-map', function(drawn) {
                if (drawn.full === true) redraw();
            });

        redraw();

        var keybinding = d3.keybinding('map-in-map')
            .on(key, toggle);

        d3.select(document)
            .call(keybinding);
    }

    return map_in_map;
};
