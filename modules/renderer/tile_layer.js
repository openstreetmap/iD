import * as d3 from 'd3';
import { t } from '../util/locale';
import { d3geoTile } from '../lib/d3.geo.tile';
import { geoEuclideanDistance } from '../geo';
import { utilPrefixCSSProperty } from '../util';


export function rendererTileLayer(context) {
    var tileSize = 256,
        geotile = d3geoTile(),
        projection,
        cache = {},
        tileOrigin,
        z,
        transformProp = utilPrefixCSSProperty('Transform'),
        source;


    // blacklist overlay tiles around Null Island..
    function nearNullIsland(x, y, z) {
        if (z >= 7) {
            var center = Math.pow(2, z - 1),
                width = Math.pow(2, z - 6),
                min = center - (width / 2),
                max = center + (width / 2) - 1;
            return x >= min && x <= max && y >= min && y <= max;
        }
        return false;
    }


    function tileSizeAtZoom(d, z) {
        var epsilon = 0.002;
        return ((tileSize * Math.pow(2, z - d[2])) / tileSize) + epsilon;
    }


    function atZoom(t, distance) {
        var power = Math.pow(2, distance);
        return [
            Math.floor(t[0] * power),
            Math.floor(t[1] * power),
            t[2] + distance
        ];
    }


    function lookUp(d) {
        for (var up = -1; up > -d[2]; up--) {
            var tile = atZoom(d, up);
            if (cache[source.url(tile)] !== false) {
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
        d.push(source.url(d));
        return d;
    }


    // Update tiles based on current state of `projection`.
    function background(selection) {
        z = Math.max(Math.log(projection.scale() * 2 * Math.PI) / Math.log(2) - 8, 0);

        var pixelOffset;
        if (source) {
            pixelOffset = [
                source.offset()[0] * Math.pow(2, z),
                source.offset()[1] * Math.pow(2, z)
            ];
        } else {
            pixelOffset = [0, 0];
        }

        var translate = [
            projection.translate()[0] + pixelOffset[0],
            projection.translate()[1] + pixelOffset[1]
        ];

        geotile
            .scale(projection.scale() * 2 * Math.PI)
            .translate(translate);

        tileOrigin = [
            projection.scale() * Math.PI - translate[0],
            projection.scale() * Math.PI - translate[1]
        ];

        render(selection);
    }


    // Derive the tiles onscreen, remove those offscreen and position them.
    // Important that this part not depend on `projection` because it's
    // rentered when tiles load/error (see #644).
    function render(selection) {
        if (!source) return;
        var requests = [];
        var showDebug = context.getDebug('tile') && !source.overlay;

        if (source.validZoom(z)) {
            geotile().forEach(function(d) {
                addSource(d);
                if (d[3] === '') return;
                if (typeof d[3] !== 'string') return; // Workaround for #2295
                requests.push(d);
                if (cache[d[3]] === false && lookUp(d)) {
                    requests.push(addSource(lookUp(d)));
                }
            });

            requests = uniqueBy(requests, 3).filter(function(r) {
                if (!!source.overlay && nearNullIsland(r[0], r[1], r[2])) {
                    return false;
                }
                // don't re-request tiles which have failed in the past
                return cache[r[3]] !== false;
            });
        }


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
                ((d[0] * _ts) - tileOrigin[0]) + 'px,' +
                ((d[1] * _ts) - tileOrigin[1]) + 'px) ' +
                'scale(' + scale + ',' + scale + ')';
        }

        function tileCenter(d) {
            var _ts = tileSize * Math.pow(2, z - d[2]);
            return [
                ((d[0] * _ts) - tileOrigin[0] + (_ts / 2)),
                ((d[1] * _ts) - tileOrigin[1] + (_ts / 2))
            ];
        }

        function debugTransform(d) {
            var coord = tileCenter(d);
            return 'translate(' + coord[0] + 'px,' + coord[1] + 'px)';
        }


        // Pick a representative tile near the center of the viewport
        // (This is useful for sampling the imagery vintage)
        var dims = geotile.size(),
            mapCenter = [dims[0] / 2, dims[1] / 2],
            minDist = Math.max(dims[0], dims[1]),
            nearCenter;

        requests.forEach(function(d) {
            var c = tileCenter(d);
            var dist = geoEuclideanDistance(c, mapCenter);
            if (dist < minDist) {
                minDist = dist;
                nearCenter = d;
            }
        });


        var image = selection.selectAll('img')
            .data(requests, function(d) { return d[3]; });

        image.exit()
            .style(transformProp, imageTransform)
            .classed('tile-removing', true)
            .classed('tile-center', false)
            .each(function() {
                var tile = d3.select(this);
                window.setTimeout(function() {
                    if (tile.classed('tile-removing')) {
                        tile.remove();
                    }
                }, 300);
            });

        image.enter()
          .append('img')
            .attr('class', 'tile')
            .attr('src', function(d) { return d[3]; })
            .on('error', error)
            .on('load', load)
          .merge(image)
            .style(transformProp, imageTransform)
            .classed('tile-debug', showDebug)
            .classed('tile-removing', false)
            .classed('tile-center', function(d) { return d === nearCenter; });



        var debug = selection.selectAll('.tile-label-debug')
            .data(showDebug ? requests : [], function(d) { return d[3]; });

        debug.exit()
            .remove();

        if (showDebug) {
            var debugEnter = debug.enter()
                .append('div')
                .attr('class', 'tile-label-debug');

            debugEnter
                .append('div')
                .attr('class', 'tile-label-debug-coord');

            debugEnter
                .append('div')
                .attr('class', 'tile-label-debug-vintage');

            debug = debug.merge(debugEnter);

            debug
                .style(transformProp, debugTransform);

            debug
                .selectAll('.tile-label-debug-coord')
                .text(function(d) { return d[2] + ' / ' + d[0] + ' / ' + d[1]; });

            debug
                .selectAll('.tile-label-debug-vintage')
                .each(function(d) {
                    var span = d3.select(this);
                    var center = context.projection.invert(tileCenter(d));
                    source.getVintage(center, d, function(err, result) {
                        span.text((result && result.range) ||
                            t('info_panels.background.vintage') + ': ' + t('info_panels.background.unknown')
                        );
                    });
                });
        }

    }


    background.projection = function(_) {
        if (!arguments.length) return projection;
        projection = _;
        return background;
    };


    background.dimensions = function(_) {
        if (!arguments.length) return geotile.size();
        geotile.size(_);
        return background;
    };


    background.source = function(_) {
        if (!arguments.length) return source;
        source = _;
        cache = {};
        geotile.scaleExtent(source.scaleExtent);
        return background;
    };


    return background;
}
