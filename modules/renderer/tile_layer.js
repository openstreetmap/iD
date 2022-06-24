import { select as d3_select } from 'd3-selection';
import { t } from '../core/localizer';

import { geoScaleToZoom, geoVecLength } from '../geo';
import { utilPrefixCSSProperty, utilTiler } from '../util';


export function rendererTileLayer(context) {
    var transformProp = utilPrefixCSSProperty('Transform');
    var tiler = utilTiler();

    var _tileSize = 256;
    var _projection;
    var _cache = {};
    var _tileOrigin;
    var _zoom;
    var _source;


    function tileSizeAtZoom(d, z) {
        var EPSILON = 0.002;    // close seams
        return ((_tileSize * Math.pow(2, z - d[2])) / _tileSize) + EPSILON;
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
            if (_cache[_source.url(tile)] !== false) {
                return tile;
            }
        }
    }


    function uniqueBy(a, n) {
        var o = [];
        var seen = {};
        for (var i = 0; i < a.length; i++) {
            if (seen[a[i][n]] === undefined) {
                o.push(a[i]);
                seen[a[i][n]] = true;
            }
        }
        return o;
    }


    function addSource(d) {
        d.push(_source.url(d));
        return d;
    }


    // Update tiles based on current state of `projection`.
    function background(selection) {
        _zoom = geoScaleToZoom(_projection.scale(), _tileSize);

        var pixelOffset;
        if (_source) {
            pixelOffset = [
                _source.offset()[0] * Math.pow(2, _zoom),
                _source.offset()[1] * Math.pow(2, _zoom)
            ];
        } else {
            pixelOffset = [0, 0];
        }

        var translate = [
            _projection.translate()[0] + pixelOffset[0],
            _projection.translate()[1] + pixelOffset[1]
        ];

        tiler
            .scale(_projection.scale() * 2 * Math.PI)
            .translate(translate);

        _tileOrigin = [
            _projection.scale() * Math.PI - translate[0],
            _projection.scale() * Math.PI - translate[1]
        ];

        render(selection);
    }


    // Derive the tiles onscreen, remove those offscreen and position them.
    // Important that this part not depend on `_projection` because it's
    // rentered when tiles load/error (see #644).
    function render(selection) {
        if (!_source) return;
        var requests = [];
        var showDebug = context.getDebug('tile') && !_source.overlay;

        if (_source.validZoom(_zoom)) {
            tiler.skipNullIsland(!!_source.overlay);

            tiler().forEach(function(d) {
                addSource(d);
                if (d[3] === '') return;
                if (typeof d[3] !== 'string') return; // Workaround for #2295
                requests.push(d);
                if (_cache[d[3]] === false && lookUp(d)) {
                    requests.push(addSource(lookUp(d)));
                }
            });

            requests = uniqueBy(requests, 3).filter(function(r) {
                // don't re-request tiles which have failed in the past
                return _cache[r[3]] !== false;
            });
        }

        function load(d3_event, d) {
            _cache[d[3]] = true;
            d3_select(this)
                .on('error', null)
                .on('load', null)
                .classed('tile-loaded', true);
            render(selection);
        }

        function error(d3_event, d) {
            _cache[d[3]] = false;
            d3_select(this)
                .on('error', null)
                .on('load', null)
                .remove();
            render(selection);
        }

        function imageTransform(d) {
            var ts = _tileSize * Math.pow(2, _zoom - d[2]);
            var scale = tileSizeAtZoom(d, _zoom);
            return 'translate(' +
                ((d[0] * ts) - _tileOrigin[0]) + 'px,' +
                ((d[1] * ts) - _tileOrigin[1]) + 'px) ' +
                'scale(' + scale + ',' + scale + ')';
        }

        function tileCenter(d) {
            var ts = _tileSize * Math.pow(2, _zoom - d[2]);
            return [
                ((d[0] * ts) - _tileOrigin[0] + (ts / 2)),
                ((d[1] * ts) - _tileOrigin[1] + (ts / 2))
            ];
        }

        function debugTransform(d) {
            var coord = tileCenter(d);
            return 'translate(' + coord[0] + 'px,' + coord[1] + 'px)';
        }


        // Pick a representative tile near the center of the viewport
        // (This is useful for sampling the imagery vintage)
        var dims = tiler.size();
        var mapCenter = [dims[0] / 2, dims[1] / 2];
        var minDist = Math.max(dims[0], dims[1]);
        var nearCenter;

        requests.forEach(function(d) {
            var c = tileCenter(d);
            var dist = geoVecLength(c, mapCenter);
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
                var tile = d3_select(this);
                window.setTimeout(function() {
                    if (tile.classed('tile-removing')) {
                        tile.remove();
                    }
                }, 300);
            });

        image.enter()
          .append('img')
            .attr('class', 'tile')
            .attr('alt', '')
            .attr('draggable', 'false')
            .style('width', _tileSize + 'px')
            .style('height', _tileSize + 'px')
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
                    var span = d3_select(this);
                    var center = context.projection.invert(tileCenter(d));
                    _source.getMetadata(center, d, function(err, result) {
                        if (result && result.vintage && result.vintage.range) {
                          span.text(result.vintage.range);
                        } else {
                          span.call(t.append('info_panels.background.vintage'));
                          span.append('span').text(': ');
                          span.call(t.append('info_panels.background.unknown'));
                        }
                    });
                });
        }

    }


    background.projection = function(val) {
        if (!arguments.length) return _projection;
        _projection = val;
        return background;
    };


    background.dimensions = function(val) {
        if (!arguments.length) return tiler.size();
        tiler.size(val);
        return background;
    };


    background.source = function(val) {
        if (!arguments.length) return _source;
        _source = val;
        _tileSize = _source.tileSize;
        _cache = {};
        tiler.tileSize(_source.tileSize).zoomExtent(_source.zoomExtent);
        return background;
    };


    return background;
}
