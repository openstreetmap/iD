import * as d3 from 'd3';

export function d3geoTile() {
  var size = [960, 500],
      scale = 256,
      scaleExtent = [0, 20],
      translate = [size[0] / 2, size[1] / 2],
      zoomDelta = 0;

  function bound(_) {
      return Math.min(scaleExtent[1], Math.max(scaleExtent[0], _));
  }

  function tile() {
    var z = Math.max(Math.log(scale) / Math.LN2 - 8, 0),
        z0 = bound(Math.round(z + zoomDelta)),
        k = Math.pow(2, z - z0 + 8),
        origin = [(translate[0] - scale / 2) / k, (translate[1] - scale / 2) / k],
        tiles = [],
        cols = d3.range(Math.max(0, Math.floor(-origin[0])), Math.max(0, Math.ceil(size[0] / k - origin[0]))),
        rows = d3.range(Math.max(0, Math.floor(-origin[1])), Math.max(0, Math.ceil(size[1] / k - origin[1])));

    rows.forEach(function(y) {
      cols.forEach(function(x) {
        tiles.push([x, y, z0]);
      });
    });

    tiles.translate = origin;
    tiles.scale = k;

    return tiles;
  }

  tile.scaleExtent = function(_) {
    if (!arguments.length) return scaleExtent;
    scaleExtent = _;
    return tile;
  };

  tile.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return tile;
  };

  tile.scale = function(_) {
    if (!arguments.length) return scale;
    scale = _;
    return tile;
  };

  tile.translate = function(_) {
    if (!arguments.length) return translate;
    translate = _;
    return tile;
  };

  tile.zoomDelta = function(_) {
    if (!arguments.length) return zoomDelta;
    zoomDelta = +_;
    return tile;
  };

  return tile;
}
