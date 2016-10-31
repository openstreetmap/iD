/* global Mapillary:false */
import * as d3 from 'd3';
import _ from 'lodash';
import rbush from 'rbush';
import { utilRebind } from '../util/rebind';
import { d3geoTile } from '../lib/d3.geo.tile';
import { utilDetect } from '../util/detect';
import { geoExtent } from '../geo/index';
import { svgIcon } from '../svg/index';
import { utilQsString } from '../util/index';


var apibase = 'https://a.mapillary.com/v2/',
    viewercss = 'mapillary-js/mapillary.min.css',
    viewerjs = 'mapillary-js/mapillary.min.js',
    trafficocss = 'traffico/stylesheets/traffico.css',
    clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi',
    maxResults = 1000,
    maxPages = 10,
    tileZoom = 14,
    dispatch = d3.dispatch('loadedImages', 'loadedSigns'),
    mapillaryCache,
    mapillaryClicks,
    mapillaryImage,
    mapillarySignDefs,
    mapillaryViewer;


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


function getTiles(projection) {
    var s = projection.scale() * 2 * Math.PI,
        z = Math.max(Math.log(s) / Math.log(2) - 8, 0),
        ts = 256 * Math.pow(2, z - tileZoom),
        origin = [
            s / 2 - projection.translate()[0],
            s / 2 - projection.translate()[1]];

    return d3geoTile()
        .scaleExtent([tileZoom, tileZoom])
        .scale(s)
        .size(projection.clipExtent()[1])
        .translate(projection.translate())()
        .map(function(tile) {
            var x = tile[0] * ts - origin[0],
                y = tile[1] * ts - origin[1];

            return {
                id: tile.toString(),
                extent: geoExtent(
                    projection.invert([x, y + ts]),
                    projection.invert([x + ts, y])
                )
            };
        });
}


function loadTiles(which, url, projection) {
    var tiles = getTiles(projection).filter(function(t) {
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
    var cache = mapillaryCache[which],
        id = tile.id + ',' + String(page),
        rect = tile.extent.rectangle();

    if (cache.loaded[id] || cache.inflight[id]) return;

    cache.inflight[id] = d3.json(url +
        utilQsString({
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

            if (which === 'images') dispatch.call('loadedImages');
            if (which === 'signs') dispatch.call('loadedSigns');

            if (data.features.length === maxResults && nextPage < maxPages) {
                loadTilePage(which, url, tile, nextPage);
            }
        }
    );
}


// partition viewport into `psize` x `psize` regions
function partitionViewport(psize, projection) {
    var dimensions = projection.clipExtent()[1];
    psize = psize || 16;
    var cols = d3.range(0, dimensions[0], psize),
        rows = d3.range(0, dimensions[1], psize),
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
    return _.flatten(_.compact(_.map(partitions, function(extent) {
        return rtree.search(extent.bbox())
            .slice(0, limit)
            .map(function(d) { return d.data; });
    })));
}



export default {

    init: function() {
        if (!mapillaryCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
        var cache = mapillaryCache;

        if (cache) {
            if (cache.images && cache.images.inflight) {
                _.forEach(cache.images.inflight, abortRequest);
            }
            if (cache.signs && cache.signs.inflight) {
                _.forEach(cache.signs.inflight, abortRequest);
            }
        }

        mapillaryCache = {
            images: { inflight: {}, loaded: {}, rtree: rbush() },
            signs:  { inflight: {}, loaded: {}, rtree: rbush() }
        };

        mapillaryImage = null;
        mapillaryClicks = [];
    },


    images: function(projection) {
        var psize = 16, limit = 3;
        return searchLimited(psize, limit, projection, mapillaryCache.images.rtree);
    },


    signs: function(projection) {
        var psize = 32, limit = 3;
        return searchLimited(psize, limit, projection, mapillaryCache.signs.rtree);
    },


    signsSupported: function() {
        var detected = utilDetect();
        if (detected.ie) return false;
        if ((detected.browser.toLowerCase() === 'safari') && (parseFloat(detected.version) < 10)) return false;
        return true;
    },


    signHTML: function(d) {
        if (!mapillarySignDefs) return;

        var detectionPackage = d.signs[0].package,
            type = d.signs[0].type,
            country = detectionPackage.split('_')[1];

        return mapillarySignDefs[country][type];
    },


    loadImages: function(projection) {
        var url = apibase + 'search/im/geojson?';
        loadTiles('images', url, projection);
    },


    loadSigns: function(context, projection) {
        var url = apibase + 'search/im/geojson/or?';
        loadTiles('signs', url, projection);

        // load traffico css
        d3.select('head').selectAll('#traffico')
            .data([0])
            .enter()
            .append('link')
            .attr('id', 'traffico')
            .attr('rel', 'stylesheet')
            .attr('href', context.asset(trafficocss));

        // load traffico sign defs
        if (!mapillarySignDefs) {
            mapillarySignDefs = {};
            _.each(['au', 'br', 'ca', 'de', 'us'], function(region) {
                d3.json(context.asset('traffico/string-maps/' + region + '-map.json'), function(err, data) {
                    if (err) return;
                    if (region === 'de') region = 'eu';
                    mapillarySignDefs[region] = data;
                });
            });
        }
    },


    loadViewer: function(context) {
        var that = this;
        var wrap = d3.select('#content').selectAll('.mapillary-wrap')
            .data([0]);

        var enter = wrap.enter()
            .append('div')
            .attr('class', 'mapillary-wrap')
            .classed('al', true)       // 'al'=left,  'ar'=right
            .classed('hidden', true);

        enter
            .append('button')
            .attr('class', 'thumb-hide')
            .on('click', function () { that.hideViewer(); })
            .append('div')
            .call(svgIcon('#icon-close'));

        enter
            .append('div')
            .attr('id', 'mly')
            .attr('class', 'mly-wrapper')
            .classed('active', false);

        // load mapillary-viewercss
        d3.select('head').selectAll('#mapillary-viewercss')
            .data([0])
            .enter()
            .append('link')
            .attr('id', 'mapillary-viewercss')
            .attr('rel', 'stylesheet')
            .attr('href', context.asset(viewercss));

        // load mapillary-viewerjs
        d3.select('head').selectAll('#mapillary-viewerjs')
            .data([0])
            .enter()
            .append('script')
            .attr('id', 'mapillary-viewerjs')
            .attr('src', context.asset(viewerjs));
    },


    showViewer: function() {
        d3.select('#content')
            .selectAll('.mapillary-wrap')
            .classed('hidden', false)
            .selectAll('.mly-wrapper')
            .classed('active', true);

        return this;
    },


    hideViewer: function() {
        d3.select('#content')
            .selectAll('.mapillary-wrap')
            .classed('hidden', true)
            .selectAll('.mly-wrapper')
            .classed('active', false);

        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
            .classed('selected', false);

        mapillaryImage = null;
        return this;
    },


    updateViewer: function(imageKey, context) {
        if (!imageKey) return;

        if (!mapillaryViewer) {
            this.initViewer(imageKey, context);
        } else {
            mapillaryViewer.moveToKey(imageKey);
        }

        return this;
    },


    initViewer: function(imageKey, context) {
        var that = this;
        if (Mapillary && imageKey) {
            var opts = {
                baseImageSize: 320,
                component: {
                    cover: false,
                    keyboard: false
                }
            };

            mapillaryViewer = new Mapillary.Viewer('mly', clientId, imageKey, opts);
            mapillaryViewer.on('nodechanged', nodeChanged);
        }

        function nodeChanged(node) {
            var clicks = mapillaryClicks;
            var index = clicks.indexOf(node.key);
            if (index > -1) {    // nodechange initiated from clicking on a marker..
                clicks.splice(index, 1);
            } else {             // nodechange initiated from the Mapillary viewer controls..
                var loc = node.computedLatLon ? [node.computedLatLon.lon, node.computedLatLon.lat] : [node.latLon.lon, node.latLon.lat];
                context.map().centerEase(loc);
                that.selectedImage(node.key, false);
            }
        }
    },


    selectedImage: function(imageKey, fromClick) {
        if (!arguments.length) return mapillaryImage;

        mapillaryImage = imageKey;
        if (fromClick) {
            mapillaryClicks.push(imageKey);
        }

        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
            .classed('selected', function(d) { return d.key === imageKey; });

        return this;
    },


    cache: function(_) {
        if (!arguments.length) return mapillaryCache;
        mapillaryCache = _;
        return this;
    },


    signDefs: function(_) {
        if (!arguments.length) return mapillarySignDefs;
        mapillarySignDefs = _;
        return this;
    }

};
