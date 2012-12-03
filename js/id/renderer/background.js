iD.Background = function() {
    var tile = d3.geo.tile(),
        projection, source;

    // derive the tiles onscreen, remove those offscreen and position tiles
    // correctly for the currentstate of `projection`
    function background() {
        var tiles = tile
            .scale(projection.scale())
            .translate(projection.translate())(),
            z = Math.max(Math.log(projection.scale()) / Math.log(2) - 8, 0),
            rz = Math.floor(z),
            ts = 256 * Math.pow(2, z - rz),
            tile_origin = [
                projection.scale() / 2 - projection.translate()[0],
                projection.scale() / 2 - projection.translate()[1]];

        var image = this
            .selectAll("image")
            .data(tiles, function(d) { return d; });

        image.exit()
            .remove();

        image.enter().append("image")
            .attr("xlink:href", source);

        image.attr('transform', function(d) {
            return 'translate(' +
                Math.round((d[0] * ts) - tile_origin[0]) + ',' +
                Math.round((d[1] * ts) - tile_origin[1]) + ')';
        })
        .attr("width", Math.ceil(ts))
        .attr("height", Math.ceil(ts));
    }

    background.projection = function(_) {
        if (!arguments.length) return projection;
        projection = _;
        return background;
    };

    background.size = function(_) {
        if (!arguments.length) return tile.size();
        tile.size(_);
        return background;
    };

    background.source = function(_) {
        if (!arguments.length) return source;
        source = _;
        return background;
    };

    return background;
};

// derive the url of a 'quadkey' style tile from a coordinate object
iD.Background.Bing = function (coord) {
    var template = 'http://ecn.t{t}.tiles.virtualearth.net/tiles/a{u}.jpeg?g=587&mkt=en-gb&n=z',
        u = '';
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
};

