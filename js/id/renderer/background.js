iD.Background = function() {

    var deviceRatio = (window.devicePixelRatio &&
        window.devicePixelRatio === 2) ? 0.5 : 1;
        // tileSize = (deviceRatio === 0.5) ? [128,128] : [256,256];
    tileSize = [256, 256];

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
        '-o-transform-origin:0 0;' +
        '-webkit-user-select: none;' +
        '-webkit-user-drag: none;' +
        '-moz-user-drag: none;' +
        'opacity:0;';

    function tileSizeAtZoom(d, z) {
        return Math.ceil(tileSize[0] * Math.pow(2, z - d[2])) / tileSize[0];
    }

    function atZoom(t, distance) {
        var power = Math.pow(2, distance);
        var az = [
            Math.floor(t[0] * power),
            Math.floor(t[1] * power),
            t[2] + distance];
        return az;
    }

    function lookUp(d) {
        for (var up = -1; up > -d[2]; up--) {
            if (cache[atZoom(d, up)] !== false) return atZoom(d, up);
        }
    }

    function uniqueBy(a, n) {
        var o = [], seen = {};
        for (var i = 0; i < a.length; i++) {
            if (seen[a[i][n]] === undefined) {
                o.push(a[i]);
                seen[a[i][n]] = true;
            }
        }
        return o;
    }

    function addSource(d) {
        d.push(source(d));
        return d;
    }

    // derive the tiles onscreen, remove those offscreen and position tiles
    // correctly for the currentstate of `projection`
    function background() {
        var sel = this,
            tiles = tile
            .scale(projection.scale())
            .scaleExtent(source.scaleExtent || [1, 17])
            .translate(projection.translate())(),
            requests = [],
            scaleExtent = tile.scaleExtent(),
            z = Math.max(Math.log(projection.scale()) / Math.log(2) - 8, 0),
            rz = Math.max(scaleExtent[0],
                Math.min(scaleExtent[1], Math.floor(z))),
            ts = tileSize[0] * Math.pow(2, z - rz),
            tile_origin = [
                projection.scale() / 2 - projection.translate()[0],
                projection.scale() / 2 - projection.translate()[1]];

        tiles.forEach(function(d) {
            addSource(d);
            requests.push(d);
            if (!cache[d[3]] && lookUp(d)) {
                requests.push(addSource(lookUp(d)));
            }
        });

        requests = uniqueBy(requests, 3);

        function load(d) {
            cache[d[3]] = true;
            d3.select(this)
                .on('load', null)
                .transition()
                .style('opacity', 1);
            background.apply(sel);
        }

        function error(d) {
            cache[d[3]] = false;
            d3.select(this).on('load', null);
            d3.select(this).remove();
            background.apply(sel);
        }

        function imageTransform(d) {
            var _ts = tileSize[0] * Math.pow(2, z - d[2]);
            var scale = tileSizeAtZoom(d, z);
            return 'translate(' +
                (Math.round((d[0] * _ts) - tile_origin[0]) + offset[0]) + 'px,' +
                (Math.round((d[1] * _ts) - tile_origin[1]) + offset[1]) + 'px)' +
                'scale(' + scale + ',' + scale + ')';
        }

        var image = this
            .selectAll('img')
            .data(requests, function(d) { return d[3]; });

        image.exit()
            .style(transformProp, imageTransform)
            .transition()
            .style('opacity', 0)
            .remove();

        image.enter().append('img')
            .attr('style', imgstyle)
            .attr('src', function(d) { return d[3]; })
            .on('error', error)
            .on('load', load);
        
        image.style(transformProp, imageTransform);

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
