iD.Background = function(backgroundType) {

    backgroundType = backgroundType || 'background';

    var tileSize = 256,
        tile = d3.geo.tile(),
        projection,
        cache = {},
        offset = [0, 0],
        offsets = {},
        tileOrigin,
        z,
        transformProp = iD.util.prefixCSSProperty('Transform'),
        source = d3.functor('');

    function tileSizeAtZoom(d, z) {
        return Math.ceil(tileSize * Math.pow(2, z - d[2])) / tileSize;
    }

    function atZoom(t, distance) {
        var power = Math.pow(2, distance);
        return [
            Math.floor(t[0] * power),
            Math.floor(t[1] * power),
            t[2] + distance];
    }

    function lookUp(d) {
        for (var up = -1; up > -d[2]; up--) {
            var tile = atZoom(d, up);
            if (cache[source(tile)] !== false) {
                return tile;
            }
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

    // Update tiles based on current state of `projection`.
    function background(selection) {
        var layer = selection.selectAll('.' + backgroundType + '-layer')
            .data([background]);

        layer.enter().append('div')
            .attr('class', 'layer-layer ' + backgroundType + '-layer', true);

        tile.scale(projection.scale() * 2 * Math.PI)
            .translate(projection.translate());

        tileOrigin = [
            projection.scale() * Math.PI - projection.translate()[0],
            projection.scale() * Math.PI - projection.translate()[1]];

        z = Math.max(Math.log(projection.scale() * 2 * Math.PI) / Math.log(2) - 8, 0);

        render(layer);
    }

    // Derive the tiles onscreen, remove those offscreen and position them.
    // Important that this part not depend on `projection` because it's
    // rentered when tiles load/error (see #644).
    function render(selection) {
        var requests = [];

        tile().forEach(function(d) {
            addSource(d);
            requests.push(d);
            if (cache[d[3]] === false && lookUp(d)) {
                requests.push(addSource(lookUp(d)));
            }
        });

        requests = uniqueBy(requests, 3).filter(function(r) {
            // don't re-request tiles which have failed in the past
            return cache[r[3]] !== false;
        });

        var pixelOffset = [
            Math.round(offset[0] * Math.pow(2, z)),
            Math.round(offset[1] * Math.pow(2, z))
        ];

        function load(d) {
            cache[d[3]] = true;
            d3.select(this)
                .on('error', null)
                .on('load', null)
                .classed('tile-loaded', true);
            render(selection);
        }

        function error(d) {
            cache[d[3]] = false;
            d3.select(this)
                .on('error', null)
                .on('load', null)
                .remove();
            render(selection);
        }

        function imageTransform(d) {
            var _ts = tileSize * Math.pow(2, z - d[2]);
            var scale = tileSizeAtZoom(d, z);
            return 'translate(' +
                (Math.round((d[0] * _ts) - tileOrigin[0]) + pixelOffset[0]) + 'px,' +
                (Math.round((d[1] * _ts) - tileOrigin[1]) + pixelOffset[1]) + 'px)' +
                'scale(' + scale + ',' + scale + ')';
        }

        var image = selection
            .selectAll('img')
            .data(requests, function(d) { return d[3]; });

        image.exit()
            .style(transformProp, imageTransform)
            .classed('tile-removing', true)
            .each(function() {
                var tile = d3.select(this);
                window.setTimeout(function() {
                    if (tile.classed('tile-removing')) {
                        tile.remove();
                    }
                }, 300);
            });

        image.enter().append('img')
            .attr('class', 'tile')
            .attr('src', function(d) { return d[3]; })
            .on('error', error)
            .on('load', load);

        image
            .style(transformProp, imageTransform)
            .classed('tile-removing', false);
    }

    background.offset = function(_) {
        if (!arguments.length) return offset;
        offset = _;
        if (source.data) offsets[source.data.name] = offset;
        return background;
    };

    background.nudge = function(_, zoomlevel) {
        offset[0] += _[0] / Math.pow(2, zoomlevel);
        offset[1] += _[1] / Math.pow(2, zoomlevel);
        return background;
    };

    background.projection = function(_) {
        if (!arguments.length) return projection;
        projection = _;
        return background;
    };

    background.dimensions = function(_) {
        if (!arguments.length) return tile.size();
        tile.size(_);
        return background;
    };

    function setHash(source) {
        var tag = source.data && source.data.sourcetag;
        if (!tag && source.data && source.data.name === 'Custom') {
            tag = 'custom:' + source.data.template;
        }
        var q = iD.util.stringQs(location.hash.substring(1));
        if (tag) {
            q[backgroundType] = tag;
            location.replace('#' + iD.util.qsString(q, true));
        } else {
            location.replace('#' + iD.util.qsString(_.omit(q, backgroundType), true));
        }
    }

    background.dispatch = d3.dispatch('change');

    background.source = function(_) {
        if (!arguments.length) return source;
        source = _;
        if (source.data) {
            offset = offsets[source.data.name] = offsets[source.data.name] || [0, 0];
        } else {
            offset = [0, 0];
        }
        cache = {};
        tile.scaleExtent((source.data && source.data.scaleExtent) || [1, 20]);
        setHash(source);
        background.dispatch.change();
        return background;
    };

    return d3.rebind(background, background.dispatch, 'on');
};
