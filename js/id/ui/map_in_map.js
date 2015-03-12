iD.ui.MapInMap = function(context) {
    var key = 'M',
        backgroundLayer = iD.TileLayer(),
        overlayLayer = iD.TileLayer();

    function map_in_map(selection) {

        function render() {
            if (hidden()) return;

            var loc = context.map().center(),
                d = selection.dimensions(),
                c = [d[0] / 2, d[1] / 2],
                k1 = context.projection.scale(),
                z1 = Math.log(k1 * 2 * Math.PI) / Math.LN2 - 8,
                z = Math.max(z1 - 6, 2);

            var projection = iD.geo.RawMercator()
                    .scale(256 * Math.pow(2, z) / (2 * Math.PI));

            var s = projection(loc);

            projection
                .translate([c[0] - s[0], c[1] - s[1]])
                .clipExtent([[0, 0], d]);


            // render background
            backgroundLayer
                .source(context.background().baseLayerSource())
                .projection(projection)
                .dimensions(d);

            var background = selection
                .selectAll('.map-in-map-background')
                .data([0]);

            background.enter()
                .append('div')
                .attr('class', 'map-in-map-background');

            background
                .call(backgroundLayer);


            // render overlay
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

            var overlay = selection
                .selectAll('.map-in-map-overlay')
                .data(hasOverlay ? [0] : []);

            overlay.enter()
                .append('div')
                .attr('class', 'map-in-map-overlay');

            overlay.exit()
                .remove();

            overlay
                .call(overlayLayer);


            // render bounding box
            var getPath = d3.geo.path().projection(projection),
                bbox = { type: 'Polygon', coordinates: [context.map().extent().polygon()] };

            var svg = selection.selectAll('svg')
                .data([0]);

            svg.enter()
                .append('svg');

            var path = svg.selectAll('path')
                .data([bbox]);

            path.enter()
                .append('path')
                .attr('class', 'map-in-map-bbox');

            path
                .attr('d', getPath);
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

                render();

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


        context.map().on('drawn.map-in-map', render);
        render();

        var keybinding = d3.keybinding('map-in-map')
            .on(key, toggle);

        d3.select(document)
            .call(keybinding);
    }

    return map_in_map;
};
