iD.Tiles = function(selection, projection) {
    var t = {},
        template = 'http://ecn.t{t}.tiles.virtualearth.net/tiles/a{u}.jpeg?g=587&mkt=en-gb&n=z',
        tile = d3.geo.tile();

    // derive the url of a 'quadkey' style tile from a coordinate object
    function tileUrl(coord) {
        var u = '';
        for (var zoom = coord[2]; zoom > 0; zoom--) {
            var byte = 0;
            var mask = 1 << (zoom - 1);
            if ((coord[0] & mask) !== 0) byte++;
            if ((coord[1] & mask) !== 0) byte += 2;
            u += byte.toString();
        }
        // distribute requests against multiple domains
        var t = coord[2] % 5;
        return template
            .replace('{t}', t)
            .replace('{u}', u)
            .replace('{x}', coord[0])
            .replace('{y}', coord[1])
            .replace('{z}', coord[2]);
    }

    // derive the tiles onscreen, remove those offscreen and position tiles
    // correctly for the currentstate of `projection`
    function redraw() {
        var tiles = tile
            .scale(projection.scale())
            .translate(projection.translate())();

        var image = selection
            .attr("transform", function() {
                return "scale(" + tiles.scale + ")translate(" + tiles.translate + ")";
            })
            .selectAll("image")
            .data(tiles, function(d) { return [d.join(), template].join(); });

        image.exit()
            .remove();

        image.enter().append("image")
            .attr("xlink:href", tileUrl)
            .attr("width", 1)
            .attr("height", 1)
            .attr("x", function(d) { return d[0]; })
            .attr("y", function(d) { return d[1]; });
    }

    function setSize(x) {
        tile.size(x);
        redraw();
        return t;
    }

    t.template = function(x) {
        if (!arguments.length) return template;
        template = x;
        redraw();
        return t;
    };

    t.setSize = setSize;
    t.redraw = redraw;

    return t;
};
