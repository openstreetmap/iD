import { range as d3_range } from 'd3-array';
import { clamp } from 'es-toolkit/compat';

import { geoExtent, geoScaleToZoom } from '../geo';
import type { Vec2, Vec3 } from '../geo/vector';
import type { Projection } from '../geo/raw_mercator';
import type { Feature, FeatureCollection } from 'geojson';

export interface Tile {
    id: string;
    xyz: Vec3;
    extent: geoExtent
}

export type Tiles = Vec3[] & {
    translate: Vec2;
    scale: number;
}

export interface utilTiler {
    (): Tiles;
    getTiles(projection: Projection): Tile[];
    getGeoJSON(projection: Projection): FeatureCollection;
    tileSize: GetSet<this, number>;
    zoomExtent: GetSet<this, Vec2>;
    size: GetSet<this, Vec2>;
    scale: GetSet<this, number>;
    translate: GetSet<this, Vec2>;
    margin: GetSet<this, number>;
    skipNullIsland: GetSet<this, boolean>;
}

export function utilTiler() {
    let _size: Vec2 = [256, 256];
    var _scale = 256;
    var _tileSize = 256;
    var _zoomExtent = [0, 20];
    let _translate: Vec2 = [_size[0] / 2, _size[1] / 2];
    var _margin = 0;
    var _skipNullIsland = false;


    function nearNullIsland(tile: Vec3) {
        var x = tile[0];
        var y = tile[1];
        var z = tile[2];
        if (z >= 7) {
            var center = Math.pow(2, z - 1);
            var width = Math.pow(2, z - 6);
            var min = center - (width / 2);
            var max = center + (width / 2) - 1;
            return x >= min && x <= max && y >= min && y <= max;
        }
        return false;
    }


    const tiler: utilTiler = () => {
        var z = geoScaleToZoom(_scale / (2 * Math.PI), _tileSize);
        var z0 = clamp(Math.round(z), _zoomExtent[0], _zoomExtent[1]);
        var tileMin = 0;
        var tileMax = Math.pow(2, z0) - 1;
        var log2ts = Math.log(_tileSize) * Math.LOG2E;
        var k = Math.pow(2, z - z0 + log2ts);
        const origin: Vec2 = [
            (_translate[0] - _scale / 2) / k,
            (_translate[1] - _scale / 2) / k
        ];

        var cols = d3_range(
            clamp(Math.floor(-origin[0]) - _margin,               tileMin, tileMax + 1),
            clamp(Math.ceil(_size[0] / k - origin[0]) + _margin,  tileMin, tileMax + 1)
        );
        var rows = d3_range(
            clamp(Math.floor(-origin[1]) - _margin,               tileMin, tileMax + 1),
            clamp(Math.ceil(_size[1] / k - origin[1]) + _margin,  tileMin, tileMax + 1)
        );

        var tiles = [] as Vec3[] as Tiles;
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
    };


    /**
     * getTiles() returns an array of tiles that cover the map view
     */
    tiler.getTiles = function(projection) {
        var origin = [
            projection.scale() * Math.PI - projection.translate()[0],
            projection.scale() * Math.PI - projection.translate()[1]
        ];

        this
            .size(projection.clipExtent()[1])
            .scale(projection.scale() * 2 * Math.PI)
            .translate(projection.translate());

        var tiles = tiler();
        var ts = tiles.scale;

        return tiles
            .map(function(tile) {
                if (_skipNullIsland && nearNullIsland(tile)) {
                    return false;
                }
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
            }).filter(Boolean);
    };


    /**
     * getGeoJSON() returns a FeatureCollection for debugging tiles
     */
    tiler.getGeoJSON = function(projection) {
        var features = tiler.getTiles(projection).map(function(tile): Feature {
            return {
                type: 'Feature',
                properties: {
                    id: tile.id,
                    name: tile.id
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [ tile.extent.polygon() ]
                }
            };
        });

        return {
            type: 'FeatureCollection',
            features: features
        };
    };


    tiler.tileSize = function(val) {
        if (!arguments.length) return _tileSize;
        _tileSize = val;
        return tiler;
    } as utilTiler['tileSize'];


    tiler.zoomExtent = function(val) {
        if (!arguments.length) return _zoomExtent;
        _zoomExtent = val;
        return tiler;
    } as utilTiler['zoomExtent'];


    tiler.size = function(val) {
        if (!arguments.length) return _size;
        _size = val;
        return tiler;
    } as utilTiler['size'];


    tiler.scale = function(val) {
        if (!arguments.length) return _scale;
        _scale = val;
        return tiler;
    } as utilTiler['scale'];


    tiler.translate = function(val) {
        if (!arguments.length) return _translate;
        _translate = val;
        return tiler;
    } as utilTiler['translate'];


    // number to extend the rows/columns beyond those covering the viewport
    tiler.margin = function(val) {
        if (!arguments.length) return _margin;
        _margin = +val;
        return tiler;
    } as utilTiler['margin'];


    tiler.skipNullIsland = function(val) {
        if (!arguments.length) return _skipNullIsland;
        _skipNullIsland = val;
        return tiler;
    } as utilTiler['skipNullIsland'];


    return tiler;
}
