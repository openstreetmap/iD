iD.ui.MapInMap = function(context) {
    var key = 'M';

    function map_in_map(selection) {
        var backgroundLayer = iD.TileLayer(),
            overlayLayer = iD.TileLayer(),
            projection = iD.geo.RawMercator(),
            zoom = d3.behavior.zoom()
                // .scaleExtent([1024, 256 * Math.pow(2, 24)])
                .on('zoom', zoomPan),
            transformed = false,
            panning = false,
            tLast = [0, 0],
            tCurr = [0, 0],
            tiles,
            timeoutId;


        function startZoomPan() {
            context.surface().on('mouseup.map-in-map-outside', endZoomPan);
            context.container().on('mouseup.map-in-map-outside', endZoomPan);
        }


        function zoomPan() {
            var t = d3.event.translate,
                e = d3.event.sourceEvent;

            if (e.type === 'wheel') {
                // for now, throw out wheel events
                zoom.translate(tCurr).scale(1);

            } else if (e.type === 'mousemove') {
                var tDiff = [ t[0] - tLast[0], t[1] - tLast[1] ];
                tCurr = t;

                iD.util.setTransform(tiles, tDiff[0], tDiff[1]);
                transformed = true;
                panning = true;
                queueRedraw();
            }

            e.preventDefault();
            e.stopPropagation();
        }


        function endZoomPan() {
            context.surface().on('mouseup.map-in-map-outside', null);
            context.container().on('mouseup.map-in-map-outside', null);

            updateProjection();

            tLast = [0, 0];
            tCurr = [0, 0];
            zoom.translate([0, 0]).scale(1);
            panning = false;

            var d = selection.dimensions(),
                c = [ d[0] / 2, d[1] / 2 ];

            context.map().center(projection.invert(c));
        }


        function updateProjection() {
            var loc = context.map().center(),
                d = selection.dimensions(),
                c = [ d[0] / 2, d[1] / 2 ],
                k1 = context.projection.scale(),
                z1 = Math.log(k1 * 2 * Math.PI) / Math.LN2 - 8,
                z = Math.max(z1 - 6, 0.5);

            projection
                .translate([0,0])
                .scale(256 * Math.pow(2, z) / (2 * Math.PI));

            var s = projection(loc),
                t = [c[0] - s[0] + tCurr[0],
                    c[1] - s[1] + tCurr[1] ];

            projection
                .translate(t)
                .clipExtent([[0, 0], d]);
        }


        function redraw() {
            if (hidden()) return;

            updateProjection();

            var d = selection.dimensions(),
                z = Math.log(projection.scale() * 2 * Math.PI) / Math.LN2 - 8;

            // setup tile container
            tiles = selection
                .selectAll('.map-in-map-tiles')
                .data([0]);

            tiles
                .enter()
                .append('div')
                .attr('class', 'map-in-map-tiles');

            if (transformed) {
                tLast = tCurr;
                iD.util.setTransform(tiles, 0, 0);
                transformed = false;
            }

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
            .on('drawn.map-in-map', redraw);

        redraw();

        var keybinding = d3.keybinding('map-in-map')
            .on(key, toggle);

        d3.select(document)
            .call(keybinding);
    }

    return map_in_map;
};
