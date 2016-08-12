import { rebind } from '../util/rebind';
import * as d3 from 'd3';
/* global Mapillary:false */
import _ from 'lodash';
import { d3geoTile } from '../../js/lib/d3.geo.tile';
import { Detect } from '../util/detect';
import { Extent } from '../geo/index';
import { Icon } from '../svg/index';
import { qsString } from '../util/index';

import rbush from 'rbush';

var mapillary = {},
    apibase = 'https://a.mapillary.com/v2/',
    viewercss = 'https://npmcdn.com/mapillary-js@1.3.0/dist/mapillary-js.min.css',
    viewerjs = 'https://npmcdn.com/mapillary-js@1.3.0/dist/mapillary-js.min.js',
    clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi',
    maxResults = 1000,
    maxPages = 10,
    tileZoom = 14,
    dispatch = d3.dispatch('loadedImages', 'loadedSigns');

function loadSignStyles(context) {
    d3.select('head').selectAll('#traffico')
        .data([0])
        .enter()
        .append('link')
        .attr('id', 'traffico')
        .attr('rel', 'stylesheet')
        .attr('href', context.asset('traffico/stylesheets/traffico.css'));
}

function loadSignDefs(context) {
    if (mapillary.sign_defs) return;
    mapillary.sign_defs = {};

    _.each(['au', 'br', 'ca', 'de', 'us'], function(region) {
        d3.json(context.asset('traffico/string-maps/' + region + '-map.json'), function(err, data) {
            if (err) return;
            if (region === 'de') region = 'eu';
            mapillary.sign_defs[region] = data;
        });
    });
}

function loadViewer() {
    // mapillary-wrap
    var wrap = d3.select('#content').selectAll('.mapillary-wrap')
        .data([0]);

    var enter = wrap.enter().append('div')
        .attr('class', 'mapillary-wrap')
        .classed('al', true)       // 'al'=left,  'ar'=right
        .classed('hidden', true);

    enter.append('button')
        .attr('class', 'thumb-hide')
        .on('click', function () { mapillary.hideViewer(); })
        .append('div')
        .call(Icon('#icon-close'));

    enter.append('div')
        .attr('id', 'mly')
        .attr('class', 'mly-wrapper')
        .classed('active', false);

    // mapillary-viewercss
    d3.select('head').selectAll('#mapillary-viewercss')
        .data([0])
        .enter()
        .append('link')
        .attr('id', 'mapillary-viewercss')
        .attr('rel', 'stylesheet')
        .attr('href', viewercss);

    // mapillary-viewerjs
    d3.select('head').selectAll('#mapillary-viewerjs')
        .data([0])
        .enter()
        .append('script')
        .attr('id', 'mapillary-viewerjs')
        .attr('src', viewerjs);
}

function initViewer(imageKey, context) {

    function nodeChanged(d) {
        var clicks = mapillary.clicks;
        var index = clicks.indexOf(d.key);
        if (index > -1) {    // nodechange initiated from clicking on a marker..
            clicks.splice(index, 1);
        } else {             // nodechange initiated from the Mapillary viewer controls..
            var loc = d.apiNavImIm ? [d.apiNavImIm.lon, d.apiNavImIm.lat] : [d.latLon.lon, d.latLon.lat];
            context.map().centerEase(loc);
            mapillary.setSelectedImage(d.key, false);
        }
    }

    if (Mapillary && imageKey) {
        var opts = {
            baseImageSize: 320,
            cover: false,
            cache: true,
            debug: false,
            imagePlane: true,
            loading: true,
            sequence: true
        };

        var viewer = new Mapillary.Viewer('mly', clientId, imageKey, opts);
        viewer.on('nodechanged', nodeChanged);
        viewer.on('loadingchanged', mapillary.setViewerLoading);
        mapillary.viewer = viewer;
    }
}

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

function getTiles(projection, dimensions) {
    var s = projection.scale() * 2 * Math.PI,
        z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
        ts = 256 * Math.pow(2, z - tileZoom),
        origin = [
            s / 2 - projection.translate()[0],
            s / 2 - projection.translate()[1]];

    return d3geoTile()
        .scaleExtent([tileZoom, tileZoom])
        .scale(s)
        .size(dimensions)
        .translate(projection.translate())()
        .map(function(tile) {
            var x = tile[0] * ts - origin[0],
                y = tile[1] * ts - origin[1];

            return {
                id: tile.toString(),
                extent: Extent(
                    projection.invert([x, y + ts]),
                    projection.invert([x + ts, y]))
            };
        });
}

function loadTiles(which, url, projection, dimensions) {
    var tiles = getTiles(projection, dimensions).filter(function(t) {
          var xyz = t.id.split(',');
          return !nearNullIsland(xyz[0], xyz[1], xyz[2]);
        });

    _.filter(which.inflight, function(v, k) {
        var wanted = _.find(tiles, function(tile) { return k === (tile.id + ',0'); });
        if (!wanted) delete which.inflight[k];
        return !wanted;
    }).map(abortRequest);

    tiles.forEach(function(tile) {
        loadTilePage(which, url, tile, 0);
    });
}

function loadTilePage(which, url, tile, page) {
    var cache = mapillary.cache[which],
        id = tile.id + ',' + String(page),
        rect = tile.extent.rectangle();

    if (cache.loaded[id] || cache.inflight[id]) return;

    cache.inflight[id] = d3.json(url +
        qsString({
            geojson: 'true',
            limit: maxResults,
            page: page,
            client_id: clientId,
            min_lon: rect[0],
            min_lat: rect[1],
            max_lon: rect[2],
            max_lat: rect[3]
        }), function(err, data) {
            cache.loaded[id] = true;
            delete cache.inflight[id];
            if (err || !data.features || !data.features.length) return;

            var features = [],
                nextPage = page + 1,
                feature, loc, d;

            for (var i = 0; i < data.features.length; i++) {
                feature = data.features[i];
                loc = feature.geometry.coordinates;
                d = { key: feature.properties.key, loc: loc };
                if (which === 'images') d.ca = feature.properties.ca;
                if (which === 'signs') d.signs = feature.properties.rects;

                features.push({minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d});
            }

            cache.rtree.load(features);

            if (which === 'images') dispatch.call("loadedImages");
            if (which === 'signs') dispatch.call("loadedSigns");

            if (data.features.length === maxResults && nextPage < maxPages) {
                loadTilePage(which, url, tile, nextPage);
            }
        }
    );
}

// partition viewport into `psize` x `psize` regions
function partitionViewport(psize, projection, dimensions) {
    psize = psize || 16;
    var cols = d3.range(0, dimensions[0], psize),
        rows = d3.range(0, dimensions[1], psize),
        partitions = [];

    rows.forEach(function(y) {
        cols.forEach(function(x) {
            var min = [x, y + psize],
                max = [x + psize, y];
            partitions.push(
                Extent(projection.invert(min), projection.invert(max)));
        });
    });

    return partitions;
}

// no more than `limit` results per partition.
function searchLimited(psize, limit, projection, dimensions, rtree) {
    limit = limit || 3;

    var partitions = partitionViewport(psize, projection, dimensions);
    return _.flatten(_.compact(_.map(partitions, function(extent) {
        return rtree.search(extent.bbox())
            .slice(0, limit)
            .map(function(d) { return d.data; });
    })));
}

// this function is only used by test cases
export function getMapillary() {
    return mapillary;
}

export function init() {

    mapillary.loadImages = function(projection, dimensions) {
        var url = apibase + 'search/im/geojson?';
        loadTiles('images', url, projection, dimensions);
    };

    mapillary.loadSigns = function(context, projection, dimensions) {
        var url = apibase + 'search/im/geojson/or?';
        loadSignStyles(context);
        loadSignDefs(context);
        loadTiles('signs', url, projection, dimensions);
    };

    mapillary.loadViewer = function() {
        loadViewer();
    };

    mapillary.images = function(projection, dimensions) {
        var psize = 16, limit = 3;
        return searchLimited(psize, limit, projection, dimensions, mapillary.cache.images.rtree);
    };

    mapillary.signs = function(projection, dimensions) {
        var psize = 32, limit = 3;
        return searchLimited(psize, limit, projection, dimensions, mapillary.cache.signs.rtree);
    };

    mapillary.signsSupported = function() {
        var detected = Detect();
        return (!(detected.ie || detected.browser.toLowerCase() === 'safari'));
    };

    mapillary.signHTML = function(d) {
        if (!mapillary.sign_defs) return;

        var detectionPackage = d.signs[0].package,
            type = d.signs[0].type,
            country = detectionPackage.split('_')[1];

        return mapillary.sign_defs[country][type];
    };

    mapillary.showViewer = function() {
        d3.select('#content')
            .selectAll('.mapillary-wrap')
            .classed('hidden', false)
            .selectAll('.mly-wrapper')
            .classed('active', true);

        return mapillary;
    };

    mapillary.hideViewer = function() {
        d3.select('#content')
            .selectAll('.mapillary-wrap')
            .classed('hidden', true)
            .selectAll('.mly-wrapper')
            .classed('active', false);

        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
            .classed('selected', false);

        mapillary.image = null;

        return mapillary;
    };

    mapillary.setViewerLoading = function(loading) {
        var canvas = d3.select('#content')
            .selectAll('.mly-wrapper canvas');

        if (canvas.empty()) return;   // viewer not loaded yet

        var cover = d3.select('#content')
            .selectAll('.mly-wrapper .Cover');

        cover.classed('CoverDone', !loading);

        var button = cover.selectAll('.CoverButton')
            .data(loading ? [0] : []);

        button.enter()
            .append('div')
            .attr('class', 'CoverButton')
            .append('div')
            .attr('class', 'uil-ripple-css')
            .append('div');

        button.exit()
            .remove();

        return mapillary;
    };

    mapillary.updateViewer = function(imageKey, context) {
        if (!mapillary) return;
        if (!imageKey) return;

        if (!mapillary.viewer) {
            initViewer(imageKey, context);
        } else {
            mapillary.viewer.moveToKey(imageKey);
        }

        return mapillary;
    };

    mapillary.getSelectedImage = function() {
        if (!mapillary) return null;
        return mapillary.image;
    };

    mapillary.setSelectedImage = function(imageKey, fromClick) {
        if (!mapillary) return null;

        mapillary.image = imageKey;
        if (fromClick) {
            mapillary.clicks.push(imageKey);
        }

        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
            .classed('selected', function(d) { return d.key === imageKey; });

        return mapillary;
    };

    mapillary.reset = function() {
        var cache = mapillary.cache;

        if (cache) {
            _.forEach(cache.images.inflight, abortRequest);
            _.forEach(cache.signs.inflight, abortRequest);
        }

        mapillary.cache = {
            images: { inflight: {}, loaded: {}, rtree: rbush() },
            signs:  { inflight: {}, loaded: {}, rtree: rbush() }
        };

        mapillary.image = null;
        mapillary.clicks = [];

        return mapillary;
    };

    if (!mapillary.cache) {
        mapillary.reset();
    }

    mapillary.event = rebind(mapillary, dispatch, 'on');

    return mapillary;
}
