import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _flatten from 'lodash-es/flatten';
import _forEach from 'lodash-es/forEach';
import _map from 'lodash-es/map';
import _some from 'lodash-es/some';

import { range as d3_range } from 'd3-array';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { request as d3_request } from 'd3-request';

import {
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import rbush from 'rbush';

import { d3geoTile as d3_geoTile } from '../lib/d3.geo.tile';
import { geoExtent } from '../geo';
import { utilQsString, utilRebind } from '../util';


var apibase = 'http://openstreetcam.org',
    maxResults = 1000,
    tileZoom = 14,
    dispatch = d3_dispatch('loadedImages'),
    openstreetcamCache,
    openstreetcamImage;


function abortRequest(i) {
    i.abort();
}


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


function maxPageAtZoom(z) {
    if (z < 15)   return 2;
    if (z === 15) return 5;
    if (z === 16) return 10;
    if (z === 17) return 20;
    if (z === 18) return 40;
    if (z > 18)   return 80;
}


function getTiles(projection) {
    var s = projection.scale() * 2 * Math.PI,
        z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
        ts = 256 * Math.pow(2, z - tileZoom),
        origin = [
            s / 2 - projection.translate()[0],
            s / 2 - projection.translate()[1]];

    return d3_geoTile()
        .scaleExtent([tileZoom, tileZoom])
        .scale(s)
        .size(projection.clipExtent()[1])
        .translate(projection.translate())()
        .map(function(tile) {
            var x = tile[0] * ts - origin[0],
                y = tile[1] * ts - origin[1];

            return {
                id: tile.toString(),
                xyz: tile,
                extent: geoExtent(
                    projection.invert([x, y + ts]),
                    projection.invert([x + ts, y])
                )
            };
        });
}


function loadTiles(which, url, projection) {
    var s = projection.scale() * 2 * Math.PI,
        currZoom = Math.floor(Math.max(Math.log(s) / Math.log(2) - 8, 0));

    var tiles = getTiles(projection).filter(function(t) {
            return !nearNullIsland(t.xyz[0], t.xyz[1], t.xyz[2]);
        });

    _filter(which.inflight, function(v, k) {
        var wanted = _find(tiles, function(tile) { return k === (tile.id + ',0'); });
        if (!wanted) delete which.inflight[k];
        return !wanted;
    }).map(abortRequest);

    tiles.forEach(function(tile) {
        loadNextTilePage(which, currZoom, url, tile);
    });
}


function loadNextTilePage(which, currZoom, url, tile) {
    var cache = openstreetcamCache[which];
    var bbox = tile.extent.bbox();
    var maxPages = maxPageAtZoom(currZoom);
    var nextPage = cache.nextPage[tile.id] || 1;
    var params = utilQsString({
            ipp: maxResults,
            page: nextPage,
            // client_id: clientId,
            bbTopLeft: [bbox.maxY, bbox.minX].join(','),
            bbBottomRight: [bbox.minY, bbox.maxX].join(',')
        }, true);

    if (nextPage > maxPages) return;

    var id = tile.id + ',' + String(nextPage);
    if (cache.loaded[id] || cache.inflight[id]) return;

    cache.inflight[id] = d3_request(url)
        .mimeType('application/json')
        .post(params, function(err, data) {
            cache.loaded[id] = true;
            delete cache.inflight[id];
            if (err || !data.currentPageItems || !data.currentPageItems.length) return;

            var features = data.currentPageItems.map(function(item) {
                var loc = [+item.lng, +item.lat],
                    d;

                if (which === 'images') {
                    d = {
                        loc: loc,
                        key: item.id,
                        ca: +item.heading,
                        captured_at: item.date_added,
                    };
                }
                return {
                    minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
                };
            });

            cache.rtree.load(features);

            if (which === 'images') {
                dispatch.call('loadedImages');
            }

            if (data.currentPageItems.length === maxResults) {  // more pages to load
                cache.nextPage[tile.id] = nextPage + 1;
                loadNextTilePage(which, currZoom, url, tile);
            } else {
                cache.nextPage[tile.id] = Infinity;     // no more pages to load
            }
        });
}


// partition viewport into `psize` x `psize` regions
function partitionViewport(psize, projection) {
    var dimensions = projection.clipExtent()[1];
    psize = psize || 16;
    var cols = d3_range(0, dimensions[0], psize),
        rows = d3_range(0, dimensions[1], psize),
        partitions = [];

    rows.forEach(function(y) {
        cols.forEach(function(x) {
            var min = [x, y + psize],
                max = [x + psize, y];
            partitions.push(
                geoExtent(projection.invert(min), projection.invert(max)));
        });
    });

    return partitions;
}


// no more than `limit` results per partition.
function searchLimited(psize, limit, projection, rtree) {
    limit = limit || 3;

    var partitions = partitionViewport(psize, projection);
    var results;

    results = _flatten(_map(partitions, function(extent) {
        return rtree.search(extent.bbox())
            .slice(0, limit)
            .map(function(d) { return d.data; });
    }));
    return results;
}



export default {

    init: function() {
        if (!openstreetcamCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
        var cache = openstreetcamCache;

        if (cache) {
            if (cache.images && cache.images.inflight) {
                _forEach(cache.images.inflight, abortRequest);
            }
        }

        openstreetcamCache = {
            images: { inflight: {}, loaded: {}, nextPage: {}, rtree: rbush() }
        };

        openstreetcamImage = null;
    },


    images: function(projection) {
        var psize = 16, limit = 3;
        return searchLimited(psize, limit, projection, openstreetcamCache.images.rtree);
    },

    loadImages: function(projection) {
        var url = apibase + '/1.0/list/nearby-photos/';
        loadTiles('images', url, projection);
    },


    loadViewer: function(context) {
        // var that = this;
        // var wrap = d3_select('#content').selectAll('.openstreetcam-wrap')
        //     .data([0]);

        // var enter = wrap.enter()
        //     .append('div')
        //     .attr('class', 'openstreetcam-wrap')
        //     .classed('al', true)       // 'al'=left,  'ar'=right
        //     .classed('hidden', true);

        // enter
        //     .append('button')
        //     .attr('class', 'thumb-hide')
        //     .on('click', function () { that.hideViewer(); })
        //     .append('div')
        //     .call(svgIcon('#icon-close'));

        // enter
        //     .append('div')
        //     .attr('id', 'mly')
        //     .attr('class', 'mly-wrapper')
        //     .classed('active', false);
    },


    showViewer: function() {
        // d3_select('#content')
        //     .selectAll('.openstreetcam-wrap')
        //     .classed('hidden', false)
        //     .selectAll('.mly-wrapper')
        //     .classed('active', true);

        return this;
    },


    hideViewer: function() {
        // d3_select('#content')
        //     .selectAll('.openstreetcam-wrap')
        //     .classed('hidden', true)
        //     .selectAll('.mly-wrapper')
        //     .classed('active', false);

        // d3_selectAll('.layer-openstreetcam-images .viewfield-group')
        //     .classed('selected', false);

        openstreetcamImage = null;
        return this;
    },


    updateViewer: function(imageKey, context) {
        if (!imageKey) return;

        // if (!openstreetcamViewer) {
        //     this.initViewer(imageKey, context);
        // } else {
        //     openstreetcamViewer.moveToKey(imageKey);
        // }

        return this;
    },


    selectedImage: function(imageKey) {
        if (!arguments.length) return openstreetcamImage;
        openstreetcamImage = imageKey;

        // d3_selectAll('.layer-openstreetcam-images .viewfield-group')
        //     .classed('selected', function(d) {
        //         return d.key === imageKey;
        //     });

        // if (!imageKey)  return this;


        // function localeTimestamp(s) {
        //     if (!s) return null;
        //     var d = new Date(s);
        //     if (isNaN(d.getTime())) return null;
        //     return d.toLocaleString(undefined, { timeZone: 'UTC' });
        // }

        // var selected = d3_selectAll('.layer-openstreetcam-images .viewfield-group.selected');
        // if (selected.empty()) return this;

        // var datum = selected.datum();
        // var timestamp = localeTimestamp(datum.captured_at);
        // var attribution = d3_select('.openstreetcam-js-dom .Attribution');
        // var capturedAt = attribution.selectAll('.captured-at');
        // if (capturedAt.empty()) {
        //     attribution
        //         .append('span')
        //         .text('|');
        //     capturedAt = attribution
        //         .append('span')
        //         .attr('class', 'captured-at');
        // }
        // capturedAt
        //     .text(timestamp);

        // this.updateDetections();

        return this;
    },


    cache: function(_) {
        if (!arguments.length) return openstreetcamCache;
        openstreetcamCache = _;
        return this;
    }

};
