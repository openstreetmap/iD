iD.ui.MapInMap = function(context) {
    var key = '/';

    function map_in_map(selection) {
        var backgroundLayer = iD.TileLayer(),
            overlayLayer = iD.TileLayer(),
            projection = iD.geo.RawMercator(),
            zoom = d3.behavior.zoom()
                .scaleExtent([ztok(0.5), ztok(24)])
                .on('zoom', zoomPan),
            transformed = false,
            panning = false,
            tStart = [0, 0],
            tLast = [0, 0],
            tCurr = [0, 0],
            kLast = 1,
            kCurr = 1,
            tiles,
            timeoutId;

        function ztok(z) { return 256 * Math.pow(2, z); }
        function ktoz(k) { return Math.log(k) / Math.LN2 - 8; }


        function startZoomPan() {
            context.surface().on('mouseup.map-in-map-outside', endZoomPan);
            context.container().on('mouseup.map-in-map-outside', endZoomPan);
            tStart = tLast = tCurr = projection.translate();
            panning = true;
        }


        function zoomPan() {
            var t = d3.event.translate,
                k = d3.event.scale,
                e = d3.event.sourceEvent;

            if (e.type === 'wheel') {
                // for now, ignore wheel events
                kCurr = k;
                zoom.translate(tCurr).scale(kCurr);

            } else if (e.type === 'mousemove') {
                tCurr = t;
            }

            var tTiles = [ tCurr[0] - tLast[0], tCurr[1] - tLast[1] ];
            iD.util.setTransform(tiles, tTiles[0], tTiles[1]);

            transformed = true;
            queueRedraw();

            e.preventDefault();
            e.stopPropagation();
        }


        function endZoomPan() {
            context.surface().on('mouseup.map-in-map-outside', null);
            context.container().on('mouseup.map-in-map-outside', null);

            updateProjection();
            panning = false;

            if (tCurr[0] !== tStart[0] && tCurr[1] !== tStart[1]) {
                var d = selection.dimensions(),
                    c = [ d[0] / 2, d[1] / 2 ];

                context.map().center(projection.invert(c));
            }
        }


        function updateProjection() {
            var loc = context.map().center(),
                d = selection.dimensions(),
                c = [ d[0] / 2, d[1] / 2 ],
                t1 = context.projection.translate(),
                k1 = context.projection.scale(),
                z1 = ktoz(k1 * 2 * Math.PI),
                z = Math.max(z1 - 6, 0.5),
                k = ztok(z);

            projection
                .translate(t1)
                .scale(k / (2 * Math.PI));

            var s = projection(loc),
                mouse = panning ? [ tCurr[0] - tStart[0], tCurr[1] - tStart[1] ] : [0, 0],
                t = [
                    c[0] - s[0] + t1[0] + mouse[0],
                    c[1] - s[1] + t1[1] + mouse[1]
                ];

            projection
                .translate(t)
                .clipExtent([[0, 0], d]);

            zoom
                .translate(t)
                .scale(k);

            tLast = tCurr = t;
            kLast = kCurr = k;

            if (transformed) {
                iD.util.setTransform(tiles, 0, 0);
                transformed = false;
            }
        }


        function redraw() {
            if (hidden()) return;

            updateProjection();

            var d = selection.dimensions(),
                z = ktoz(projection.scale() * 2 * Math.PI);

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
                .dimensions(d);

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
                if (overlaySources[i].validZoom(z)) {
                    overlayLayer
                        .source(overlaySources[i])
                        .projection(projection)
                        .dimensions(d);

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

            // redraw bounding box
            if (!panning) {
                var getPath = d3.geo.path().projection(projection),
                    bbox = { type: 'Polygon', coordinates: [context.map().extent().polygon()] };

                var svg = selection.selectAll('.map-in-map-svg')
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
                    .attr('d', getPath);
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

            if (hidden()) {
                selection
                    .style('display', 'block')
                    .style('opacity', 0)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);

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
            }
        }


        selection
            .on('mousedown.map-in-map', startZoomPan)
            .on('mouseup.map-in-map', endZoomPan);

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
