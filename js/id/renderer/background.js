iD.Background = function() {
    var tile = d3.geo.tile(),
        projection,
        cache = {},
        offset = [0, 0],
        transformProp = iD.util.prefixCSSProperty('Transform'),
        source = d3.functor('');

    var imgstyle = 'position:absolute;transform-origin:0 0;' +
        '-ms-transform-origin:0 0;' +
        '-webkit-transform-origin:0 0;' +
        '-moz-transform-origin:0 0;' +
        '-o-transform-origin:0 0;';

    function atZoom(t, distance) {
        var power = Math.pow(2, distance);
        var az = [
            Math.floor(t[0] * power),
            Math.floor(t[1] * power),
            t[2] + distance];
        az.push(source(az));
        return az;
    }

    function upZoom(t, distance) {
        var az = atZoom(t, distance), tiles = [];
        for (var x = 0; x < 2; x++) {
            for (var y = 0; y < 2; y++) {
                var up = [az[0] + x, az[1] + y, az[2]];
                up.push(source(up));
                tiles.push(up);
            }
        }
        return tiles;
    }

    function tileSize(d, z) {
        return Math.ceil(256 * Math.pow(2, z - d[2])) / 256;
    }

    // derive the tiles onscreen, remove those offscreen and position tiles
    // correctly for the currentstate of `projection`
    function background() {
        var tiles = tile
            .scale(projection.scale())
            .scaleExtent(source.scaleExtent || [1, 17])
            .translate(projection.translate())(),
            scaleExtent = tile.scaleExtent(),
            z = Math.max(Math.log(projection.scale()) / Math.log(2) - 8, 0),
            rz = Math.max(scaleExtent[0], Math.min(scaleExtent[1], Math.floor(z))),
            ts = 256 * Math.pow(2, z - rz),
            tile_origin = [
                projection.scale() / 2 - projection.translate()[0],
                projection.scale() / 2 - projection.translate()[1]],
            ups = {};

        tiles.forEach(function(d) {
            d.push(source(d));
            // this tile has not been loaded yet
            if (!cache[d] &&
                cache[atZoom(d, -1)] &&
                !ups[atZoom(d, -1)]) {
                ups[atZoom(d, -1)] = true;
                tiles.push(atZoom(d, -1));
            } else if (!cache[d]) {
                upZoom(d, 1).forEach(function(u) {
                    if (cache[u] && !ups[u]) {
                        ups[u] = true;
                        tiles.push(u);
                    }
                });
            }
        });

        var image = this
            .selectAll('img')
            .data(tiles, function(d) { return d; });

        image.exit().remove();

        function load(d) {
            cache[d] = true;
            d3.select(this).on('load', null);
        }

        function error() {
            d3.select(this).remove();
        }

        image.enter().append('img')
            .attr('style', imgstyle)
            .attr('src', function(d) { return d[3]; })
            .on('error', error)
            .on('load', load);

        image.style(transformProp, function(d) {
            var _ts = 256 * Math.pow(2, z - d[2]);
            var scale = tileSize(d, z);
            return 'translate(' +
                (Math.round((d[0] * _ts) - tile_origin[0]) + offset[0]) + 'px,' +
                (Math.round((d[1] * _ts) - tile_origin[1]) + offset[1]) + 'px) scale(' + scale + ',' + scale + ')';
        });

        if (Object.keys(cache).length > 100) cache = {};
    }

    background.offset = function(_) {
        if (!arguments.length) return offset;
        offset = _;
        return background;
    };

    background.nudge = function(_) {
        offset[0] += _[0];
        offset[1] += _[1];
        return background;
    };

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
