iD.Background = function() {
    var tile = d3.geo.tile(),
        scaleExtent = [0, 20],
        projection,
        source = d3.functor('');

    // derive the tiles onscreen, remove those offscreen and position tiles
    // correctly for the currentstate of `projection`
    function background() {
        var tiles = tile
            .scale(projection.scale())
            .translate(projection.translate())(),
            z = Math.max(Math.log(projection.scale()) / Math.log(2) - 8, 0),
            rz = Math.max(scaleExtent[0], Math.min(scaleExtent[1], Math.floor(z))),
            ts = 256 * Math.pow(2, z - rz),
            tile_origin = [
                projection.scale() / 2 - projection.translate()[0],
                projection.scale() / 2 - projection.translate()[1]];

        tiles.forEach(function(t) { t.push(source(t)); });
        var image = this
            .selectAll("image")
            .data(tiles, function(d) { return d; });

        image.exit().remove();

        image.enter().append("image")
            .attr("xlink:href", function(d) { return d[3]; });

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

    background.scaleExtent = function(_) {
        if (!arguments.length) return tile.scaleExtent();
        tile.scaleExtent(_);
        return background;
    };

    return background;
};

