import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import { range as d3_range } from 'd3-array';
import { geoExtent } from '../geo';


export function utilTile() {
    var _size = [960, 500];
    var _scale = 256;
    var _scaleExtent = [0, 20];
    var _translate = [_size[0] / 2, _size[1] / 2];
    var _zoomDelta = 0;
    var _margin = 0;

    function bound(val) {
        return Math.min(_scaleExtent[1], Math.max(_scaleExtent[0], val));
    }

    function nearNullIsland(x, y, z) {
        if (z >= 7) {
            var center = Math.pow(2, z - 1);
            var width = Math.pow(2, z - 6);
            var min = center - (width / 2);
            var max = center + (width / 2) - 1;
            return x >= min && x <= max && y >= min && y <= max;
        }
        return false;
    }

    function tile() {
        var z = Math.max(Math.log(_scale) / Math.LN2 - 8, 0);
        var z0 = bound(Math.round(z + _zoomDelta));
        var k = Math.pow(2, z - z0 + 8);
        var origin = [
            (_translate[0] - _scale / 2) / k,
            (_translate[1] - _scale / 2) / k
        ];

        var cols = d3_range(
            Math.max(0, Math.floor(-origin[0]) - _margin),
            Math.max(0, Math.ceil(_size[0] / k - origin[0]) + _margin)
        );
        var rows = d3_range(
            Math.max(0, Math.floor(-origin[1]) - _margin),
            Math.max(0, Math.ceil(_size[1] / k - origin[1]) + _margin)
        );

        var tiles = [];
        for (var i = 0; i < rows.length; i++) {
            var y = rows[i];
            for (var j = 0; j < cols.length; j++) {
                var x = cols[j];

                if (i >= _margin && i <= rows.length - _margin &&
                    j >= _margin && j <= cols.length - _margin) {
                    tiles.unshift([x, y, z0]);  // tiles in view at beginning
                } else {
                    tiles.push([x, y, z0]);     // tiles in margin at the end
                }
            }
        }

        tiles.translate = origin;
        tiles.scale = k;

        return tiles;
    }


    /**
     * getTiles() returns array of d3 geo tiles.
     * Using d3.geo.tiles.js from lib, gets tile extents for each grid tile in a grid created from
     * an area around (and including) the current map view extents.
     */
    tile.getTiles = function(projection, dimensions, tilezoom, margin) {

        // s is the current map scale
        // z is the 'Level of Detail', or zoom-level, where Level 1 is far from the earth, and Level 23 is close to the ground.
        // ts ('tile size') here is the formula for determining the width/height of the map in pixels, but with a modification.
        // See 'Ground Resolution and Map Scale': //https://msdn.microsoft.com/en-us/library/bb259689.aspx.
        // As used here, by subtracting constant 'tileZoom' from z (the level), you end up with a much smaller value for the tile size (in pixels).
        var s = projection.scale() * 2 * Math.PI;
        var z = Math.max(Math.log(s) / Math.log(2) - 8, 0);
        var ts = 256 * Math.pow(2, z - tilezoom);
        var origin = [
            s / 2 - projection.translate()[0],
            s / 2 - projection.translate()[1]
        ];

        var tiler = this
            .scaleExtent([tilezoom, tilezoom])
            .scale(s)
            .size(dimensions)
            .translate(projection.translate())
            .margin(margin || 0);   // request nearby tiles so we can connect sequences.

        var tiles = tiler()
            .map(function(tile) {
                var x = tile[0] * ts - origin[0];
                var y = tile[1] * ts - origin[1];

                return {
                    id: tile.toString(),
                    xyz: tile,
                    extent: geoExtent(
                        projection.invert([x, y + ts]),
                        projection.invert([x + ts, y])
                    )
                };
            });

        return tiles;
    };


    tile.filterNullIsland = function(tiles) {
        return tiles.filter(function(t) {
            return !nearNullIsland(t.xyz[0], t.xyz[1], t.xyz[2]);
        });
    };


    // remove inflight requests that no longer cover the view..
    tile.removeInflightRequests = function(cache, tiles, callback, modifier) {
        return _filter(cache.inflight, function(v, i) {
            var wanted = _find(tiles, function(tile) { return i === tile.id + modifier; });
            if (!wanted) {
                delete cache.inflight[i];
            }
            return !wanted;
        }).map(callback); // abort request
    };


    tile.scaleExtent = function(val) {
        if (!arguments.length) return _scaleExtent;
        _scaleExtent = val;
        return tile;
    };


    tile.size = function(val) {
        if (!arguments.length) return _size;
        _size = val;
        return tile;
    };


    tile.scale = function(val) {
        if (!arguments.length) return _scale;
        _scale = val;
        return tile;
    };


    tile.translate = function(val) {
        if (!arguments.length) return _translate;
        _translate = val;
        return tile;
    };


    tile.zoomDelta = function(val) {
        if (!arguments.length) return _zoomDelta;
        _zoomDelta = +val;
        return tile;
    };


    // number to extend the rows/columns beyond those covering the viewport
    tile.margin = function(val) {
        if (!arguments.length) return _margin;
        _margin = +val;
        return tile;
    };


    return tile;
}
