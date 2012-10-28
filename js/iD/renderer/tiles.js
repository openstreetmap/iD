// a minimal map tile client, to be turned on and off etc.
iD.Tiles = function(selection, width, height) {
    var tiles = {};

    function tilesForView(projection) {
        var t = projection.translate(),
            s = projection.scale(),
            z = Math.max(Math.log(s) / Math.log(2) - 8, 0);
            rz = Math.floor(z),
            ts = 256 * Math.pow(2, z - rz);

        // This is the 0, 0 px of the projection
        var tile_origin = [s / 2 - t[0], s / 2 - t[1]],
            coords = [],
            cols = d3.range(Math.max(0, Math.floor((tile_origin[0] - width) / ts)),
            Math.max(0, Math.ceil((tile_origin[0] + width) / ts))),
            rows = d3.range(Math.max(0, Math.floor((tile_origin[1] - height) / ts)),
            Math.max(0, Math.ceil((tile_origin[1] + height) / ts)));

        cols.forEach(function(x) {
            rows.forEach(function(y) { coords.push([Math.floor(z), x, y, Math.floor(z) + '-' + x + '-' + y]); });
        });
        return coords;
    }

    function tileUrl(coord) {
        var tmpl = 'http://ecn.t0.tiles.virtualearth.net/tiles/a$quadkey.jpeg?g=587&mkt=en-gb&n=z';
        var u = '';
        for (var zoom = coord[0]; zoom > 0; zoom--) {
            var byte = 0;
            var mask = 1 << (zoom - 1);
            if ((coord[1] & mask) !== 0) byte++;
            if ((coord[2] & mask) !== 0) byte += 2;
            u += byte.toString();
        }
        return tmpl.replace('$quadkey', u);
    }

    function redraw(projection) {
        var t = projection.translate(),
            s = projection.scale(),
            z = Math.max(Math.log(s) / Math.log(2) - 8, 0);
            rz = Math.floor(z),
            ts = 256 * Math.pow(2, z - rz);

        // This is the 0, 0 px of the projection
        var tile_origin = [s / 2 - t[0], s / 2 - t[1]],
            coords = tilesForView(projection);

        var tiles = selection.selectAll('image.tile')
            .data(coords, function(d) { return d[3]; });

        tiles.exit().remove();
        tiles.enter().append('image')
            .attr('class', 'tile')
            .attr('xlink:href', tileUrl);
        tiles.attr({ width: Math.ceil(ts), height: Math.ceil(ts) })
            .attr('transform', function(d) {
                return 'translate(' + [
                    Math.round((d[1] * ts) - tile_origin[0]),
                    Math.round((d[2] * ts) - tile_origin[1])
                ] + ')';
            });
    }

    tiles.redraw = redraw;

    return tiles;
};
