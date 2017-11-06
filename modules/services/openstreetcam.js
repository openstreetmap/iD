import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _flatten from 'lodash-es/flatten';
import _forEach from 'lodash-es/forEach';
import _map from 'lodash-es/map';

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
        .header('Content-type', 'application/x-www-form-urlencoded')
        .response(function(xhr) { return JSON.parse(xhr.responseText); })
        .post(params, function(err, data) {
            cache.loaded[id] = true;
            delete cache.inflight[id];
            if (err || !data.currentPageItems || !data.currentPageItems.length) return;

            function localeDateString(s) {
                if (!s) return null;
                var d = new Date(s);
                if (isNaN(d.getTime())) return null;
                return d.toLocaleDateString();
            }

            var features = data.currentPageItems.map(function(item) {
                var loc = [+item.lng, +item.lat],
                    d;

                if (which === 'images') {
                    d = {
                        loc: loc,
                        key: item.id,
                        ca: +item.heading,
                        captured_at: localeDateString(item.shot_date || item.date_added),
                        captured_by: item.username,
                        imagePath: item.lth_name,
                        sequence_id: +item.sequence_id,
                        sequence_index: +item.sequence_index
                    };

                    // cache sequence info
                    var seq = openstreetcamCache.sequences[d.sequence_id];
                    if (!seq) {
                        seq = { rotation: 0, images: [] };
                        openstreetcamCache.sequences[d.sequence_id] = seq;
                    }
                    seq.images[d.sequence_index] = d;
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
            images: { inflight: {}, loaded: {}, nextPage: {}, rtree: rbush() },
            sequences: {}
        };

        openstreetcamImage = null;
    },


    images: function(projection) {
        var psize = 16, limit = 3;
        return searchLimited(psize, limit, projection, openstreetcamCache.images.rtree);
    },


    sequences: function(projection) {
        var viewport = projection.clipExtent();
        var min = [viewport[0][0], viewport[1][1]];
        var max = [viewport[1][0], viewport[0][1]];
        var bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
        var seq_ids = {};

        // all sequences for images in viewport
        openstreetcamCache.images.rtree.search(bbox)
            .forEach(function(d) { seq_ids[d.data.sequence_id] = true; });

        // make linestrings from those sequences
        var lineStrings = [];
        Object.keys(seq_ids).forEach(function(seq_id) {
            var seq = openstreetcamCache.sequences[seq_id];
            var images = seq && seq.images;
            if (images) {
                lineStrings.push({
                    type: 'LineString',
                    coordinates: images.map(function (d) { return d.loc; }).filter(Boolean)
                });
            }
        });
        return lineStrings;
    },


    loadImages: function(projection) {
        var url = apibase + '/1.0/list/nearby-photos/';
        loadTiles('images', url, projection);
    },


    loadViewer: function() {
        // add osc-wrapper
        var wrap = d3_select('#photoviewer').selectAll('.osc-wrapper')
            .data([0]);

        var wrapEnter = wrap.enter()
            .append('div')
            .attr('class', 'photo-wrapper osc-wrapper')
            .classed('hide', true);

        wrapEnter
            .append('div')
            .attr('class', 'osc-attribution fillD');

        var controlsEnter = wrapEnter
            .append('div')
            .attr('class', 'osc-controls-wrap')
            .append('div')
            .attr('class', 'osc-controls');

        controlsEnter
            .append('button')
            .text('◄');

        controlsEnter
            .append('button')
            .on('click.rotate-ccw', rotate(-90))
            .text('⤿');

        controlsEnter
            .append('button')
            .on('click.rotate-cw', rotate(90))
            .text('⤾');

        controlsEnter
            .append('button')
            .text('►');


        function rotate(deg) {
            return function() {
                if (!openstreetcamImage) return;
                var seq_id = openstreetcamImage.sequence_id;
                var seq = openstreetcamCache.sequences[seq_id];

                if (!seq) {
                    seq = { rotation: 0, coords: [] };
                    openstreetcamCache.sequences[seq_id] = seq;
                }

                var r = seq.rotation || 0;
                r += deg;
                seq.rotation = r;

                d3_select('#photoviewer .osc-wrapper .osc-image')
                    .transition()
                    .duration(100)
                    .style('transform', 'rotate(' + r + 'deg)');
            };
        }
    },


    showViewer: function() {
        var viewer = d3_select('#photoviewer')
            .classed('hide', false);

        var isHidden = viewer.selectAll('.photo-wrapper.osc-wrapper.hide').size();

        if (isHidden) {
            viewer
                .selectAll('.photo-wrapper:not(.osc-wrapper)')
                .classed('hide', true);

            viewer
                .selectAll('.photo-wrapper.osc-wrapper')
                .classed('hide', false);
        }

        return this;
    },


    hideViewer: function() {
        d3_select('#photoviewer')
            .classed('hide', true)
            .selectAll('.photo-wrapper')
            .classed('hide', true);

        d3_selectAll('.layer-openstreetcam-images .viewfield-group')
            .classed('selected', false);

        openstreetcamImage = null;
        return this;
    },


    updateViewer: function(d) {
        var wrap = d3_select('#photoviewer .osc-wrapper');

        wrap.selectAll('.osc-image')
            .remove();

        if (d) {
            var seq = openstreetcamCache.sequences[d.sequence_id];
            var r = (seq && seq.rotation) || 0;

            wrap.append('img')
                .attr('class', 'osc-image')
                .style('transform', 'rotate(' + r + 'deg)')
                .attr('src', apibase + '/' + d.imagePath);

            var attribution = wrap.selectAll('.osc-attribution').html('');

            if (d.captured_by) {
                attribution
                    .append('a')
                    .attr('class', 'captured_by')
                    .attr('target', '_blank')
                    .attr('href', apibase + '/user/' + d.captured_by)
                    .text('@' + d.captured_by);

                attribution
                    .append('span')
                    .text('|');
            }

            if (d.captured_at) {
                attribution
                    .append('span')
                    .attr('class', 'captured_at')
                    .text(d.captured_at);

                attribution
                    .append('span')
                    .text('|');
            }

            attribution
                .append('a')
                .attr('class', 'image_link')
                .attr('target', '_blank')
                .attr('href', apibase + '/details/' + d.sequence_id + '/' + d.sequence_index)
                .text('openstreetcam.org');
        }
        return this;
    },


    selectedImage: function(d) {
        if (!arguments.length) return openstreetcamImage;
        openstreetcamImage = d;

        d3_selectAll('.viewfield-group')
            .classed('selected', function(d) {
                return d.key === openstreetcamImage.key;
            });

        return this;
    },


    cache: function(_) {
        if (!arguments.length) return openstreetcamCache;
        openstreetcamCache = _;
        return this;
    }

};
