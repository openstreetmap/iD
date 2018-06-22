import { range as d3_range } from 'd3-array';


export function d3geoTile() {
    var _size = [960, 500];
    var _scale = 256;
    var _scaleExtent = [0, 20];
    var _translate = [_size[0] / 2, _size[1] / 2];
    var _zoomDelta = 0;
    var _margin = 0;

    function bound(val) {
        return Math.min(_scaleExtent[1], Math.max(_scaleExtent[0], val));
    }

    function tile() {
        var z = Math.max(Math.log(_scale) / Math.LN2 - 8, 0);
        var z0 = bound(Math.round(z + _zoomDelta));
        var k = Math.pow(2, z - z0 + 8);
        var origin = [
            (_translate[0] - _scale / 2) / k,
            (_translate[1] - _scale / 2) / k
        ];
        var tiles = [];

        var cols = d3_range(
            Math.max(0, Math.floor(-origin[0]) - _margin),
            Math.max(0, Math.ceil(_size[0] / k - origin[0]) + _margin)
        );
        var rows = d3_range(
            Math.max(0, Math.floor(-origin[1]) - _margin),
            Math.max(0, Math.ceil(_size[1] / k - origin[1]) + _margin)
        );

        rows.forEach(function(y) {
            cols.forEach(function(x) {
                tiles.push([x, y, z0]);
            });
        });

        tiles.translate = origin;
        tiles.scale = k;

        return tiles;
    }

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
