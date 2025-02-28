import { range as d3_range } from 'd3-array';
import { geoExtent, geoScaleToZoom } from '../geo';


export function utilTiler() {
    let _size = [256, 256];
    let _scale = 256;
    let _tileSize = 256;
    let _zoomExtent = [0, 20];
    let _translate = [_size[0] / 2, _size[1] / 2];
    let _margin = 0;
    let _skipNullIsland = false;


    function clamp(num, min, max) {
        return Math.max(min, Math.min(num, max));
    }


    function nearNullIsland(tile) {
        const x = tile[0];
        const y = tile[1];
        const z = tile[2];
        if (z >= 7) {
            const center = Math.pow(2, z - 1);
            const width = Math.pow(2, z - 6);
            const min = center - (width / 2);
            const max = center + (width / 2) - 1;
            return x >= min && x <= max && y >= min && y <= max;
        }
        return false;
    }


    function tiler() {
        const z = geoScaleToZoom(_scale / (2 * Math.PI), _tileSize);
        const z0 = clamp(Math.round(z), _zoomExtent[0], _zoomExtent[1]);
        const tileMin = 0;
        const tileMax = Math.pow(2, z0) - 1;
        const log2ts = Math.log(_tileSize) * Math.LOG2E;
        const k = Math.pow(2, z - z0 + log2ts);
        const origin = [
            (_translate[0] - _scale / 2) / k,
            (_translate[1] - _scale / 2) / k
        ];

        const cols = d3_range(
            clamp(Math.floor(-origin[0]) - _margin,               tileMin, tileMax + 1),
            clamp(Math.ceil(_size[0] / k - origin[0]) + _margin,  tileMin, tileMax + 1)
        );
        const rows = d3_range(
            clamp(Math.floor(-origin[1]) - _margin,               tileMin, tileMax + 1),
            clamp(Math.ceil(_size[1] / k - origin[1]) + _margin,  tileMin, tileMax + 1)
        );

        const tiles = [];
        for (let i = 0; i < rows.length; i++) {
            const y = rows[i];
            for (let j = 0; j < cols.length; j++) {
                const x = cols[j];

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
     * getTiles() returns an array of tiles that cover the map view
     */
    tiler.getTiles = function(projection) {
        const origin = [
            projection.scale() * Math.PI - projection.translate()[0],
            projection.scale() * Math.PI - projection.translate()[1]
        ];

        this
            .size(projection.clipExtent()[1])
            .scale(projection.scale() * 2 * Math.PI)
            .translate(projection.translate());

        const tiles = tiler();
        const ts = tiles.scale;

        return tiles
            .map(function(tile) {
                if (_skipNullIsland && nearNullIsland(tile)) {
                    return false;
                }
                const x = tile[0] * ts - origin[0];
                const y = tile[1] * ts - origin[1];
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
        const features = tiler.getTiles(projection).map(function(tile) {
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
    };


    tiler.zoomExtent = function(val) {
        if (!arguments.length) return _zoomExtent;
        _zoomExtent = val;
        return tiler;
    };


    tiler.size = function(val) {
        if (!arguments.length) return _size;
        _size = val;
        return tiler;
    };


    tiler.scale = function(val) {
        if (!arguments.length) return _scale;
        _scale = val;
        return tiler;
    };


    tiler.translate = function(val) {
        if (!arguments.length) return _translate;
        _translate = val;
        return tiler;
    };


    // number to extend the rows/columns beyond those covering the viewport
    tiler.margin = function(val) {
        if (!arguments.length) return _margin;
        _margin = +val;
        return tiler;
    };


    tiler.skipNullIsland = function(val) {
        if (!arguments.length) return _skipNullIsland;
        _skipNullIsland = val;
        return tiler;
    };


    return tiler;
}
