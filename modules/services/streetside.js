import _flatten from 'lodash-es/flatten';
import _forEach from 'lodash-es/forEach';
import _map from 'lodash-es/map';
import _union from 'lodash-es/union';

import { range as d3_range } from 'd3-array';
import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import rbush from 'rbush';
import { t } from '../util/locale';
import { jsonpRequest } from '../util/jsonp_request';
import { d3geoTile as d3_geoTile } from '../lib/d3.geo.tile';
import { geoExtent } from '../geo';
import { utilDetect } from '../util/detect';
import { utilQsString, utilRebind } from '../util';


var bubbleApi = 'https://dev.virtualearth.net/mapcontrol/HumanScaleServices/GetBubbles.ashx?';
var streetsideImagesApi = 'https://t.ssl.ak.tiles.virtualearth.net/tiles/';
var bubbleAppKey = 'AuftgJsO0Xs8Ts4M1xZUQJQXJNsvmh3IV8DkNieCiy3tCwCUMq76-WpkrBtNAuEm';
var pannellumViewerCSS = 'pannellum-streetside/pannellum.css';
var pannellumViewerJS = 'pannellum-streetside/pannellum.js';
var tileZoom = 16.5;
var dispatch = d3_dispatch('loadedBubbles');
var _currScene = 0;
var _bubbleCache;
var _pannellumViewer;
var _sceneOptions;

/**
 * abortRequest().
 */
function abortRequest(i) {
    i.abort();
}

/**
 * nearNullIsland().
 */
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

/**
 * localeTimeStamp().
 */
function localeTimestamp(s) {
    if (!s) return null;
    var detected = utilDetect();
    var options = {
        day: 'numeric', month: 'short', year: 'numeric'
        //hour: 'numeric', minute: 'numeric', second: 'numeric',
        //timeZone: 'UTC'
    };
    var d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString(detected.locale, options);
}

/**
 * getTiles() returns array of d3 geo tiles.
 * Using d3.geo.tiles.js from lib, gets tile extents for each grid tile in a grid created from
 * an area around (and including) the current map view extents.
 */
function getTiles(projection) {
    // s is the current map scale
    // z is the 'Level of Detail', or zoom-level, where Level 1 is far from the earth, and Level 23 is close to the ground.
    // ts ('tile size') here is the formula for determining the width/height of the map in pixels, but with a modification.
    // See 'Ground Resolution and Map Scale': //https://msdn.microsoft.com/en-us/library/bb259689.aspx.
    // As used here, by subtracting constant 'tileZoom' from z (the level), you end up with a much smaller value for the tile size (in pixels).
    var s = projection.scale() * 2 * Math.PI;
    var z = Math.max(Math.log(s) / Math.log(2) - 8, 0);
    var ts = 256 * Math.pow(2, z - tileZoom);
    var origin = [
        s / 2 - projection.translate()[0],
        s / 2 - projection.translate()[1]
    ];

    return d3_geoTile()
        .scaleExtent([tileZoom, tileZoom])
        .scale(s)
        .size(projection.clipExtent()[1])
        .translate(projection.translate())()
        .map(function (tile) {
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
}

/**
 * loadTiles() wraps the process of generating tiles and then fetching image points for each tile.
 */
function loadTiles(which, url, projection) {
    // console.log('loadTiles() for: ', which);
    var s = projection.scale() * 2 * Math.PI;
    var currZoom = Math.floor(Math.max(Math.log(s) / Math.log(2) - 8, 0));

    // breakup the map view into tiles
    var tiles = getTiles(projection).filter(function (t) {
        return !nearNullIsland(t.xyz[0], t.xyz[1], t.xyz[2]);
    });

    tiles.forEach(function (tile) {
       loadNextTilePage(which, currZoom, url, tile);
    });
}

/**
 * loadNextTilePage() load data for the next tile page in line.
 */
function loadNextTilePage(which, currZoom, url, tile) {
    // console.log('loadNextTilePage()');
    var cache = _bubbleCache[which];
    var nextPage = cache.nextPage[tile.id] || 0;
    var id = tile.id + ',' + String(nextPage);
    if (cache.loaded[id] || cache.inflight[id]) return;
    cache.inflight[id] = getBubbles(url, tile, function(bubbles) {
        cache.loaded[id] = true;
        delete cache.inflight[id];
        if (!bubbles) return;

        // [].shift() removes the first element, some statistics info, not a bubble point
        bubbles.shift();

        var features = bubbles.map(function (bubble) {
            var bubbleId = bubble.id;
            if (cache.points[bubbleId]) return null;  // skip duplicates

            var loc = [bubble.lo, bubble.la];
            var d = {
                loc: loc,
                key: bubble.id,
                ca: bubble.he,
                captured_at: bubble.cd,
                captured_by: 'microsoft',
                nbn: bubble.nbn,
                pbn: bubble.pbn,
                rn: bubble.rn,
                pano: true
            };
            var feature = {
                geometry: {
                    coordinates: [bubble.lo, bubble.la],
                    type: 'Point'
                },
                properties: d,
                type: 'Feature'
            };

            cache.points[bubbleId] = feature;
            cache.forImageKey[bubbleId] = bubbleId;

            return {
                minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
            };

        }).filter(Boolean);

        cache.rtree.load(features);
        if (which === 'bubbles'){
            dispatch.call('loadedBubbles');
        }
    });
}

/**
 * getBubbles() handles the request to the server for a tile extent of 'bubbles' (streetside image locations).
 */
function getBubbles(url, tile, callback) {
    //console.log('services - streetside - getBubbles()');
    var rect = tile.extent.rectangle();
    var urlForRequest = url + utilQsString({
        n: rect[3],
        s: rect[1],
        e: rect[2],
        w: rect[0],
        appkey: bubbleAppKey,
        jsCallback: '{callback}'
    });
    jsonpRequest(urlForRequest, function (data) {
        if (!data || data.error) {
            callback(null);
        } else {
            callback(data);
        }
    });
}

/**
 * partitionViewport() partition viewport into `psize` x `psize` regions.
 */
function partitionViewport(psize, projection) {
    var dimensions = projection.clipExtent()[1];
    psize = psize || 16;

    var cols = d3_range(0, dimensions[0], psize);
    var rows = d3_range(0, dimensions[1], psize);
    var partitions = [];
    rows.forEach(function (y) {
        cols.forEach(function (x) {
            var min = [x, y + psize];
            var max = [x + psize, y];
            partitions.push(geoExtent(projection.invert(min), projection.invert(max)));
        });
    });

    return partitions;
}

/**
 * searchLimited().
 */
function searchLimited(psize, limit, projection, rtree) {
    //console.log('services - streetside - searchLimited()');
    limit = limit || 3;

    var partitions = partitionViewport(psize, projection);
    var results;

    // console.time('previous');
    results = _flatten(_map(partitions, function (extent) {
        return rtree.search(extent.bbox())
            .slice(0, limit)
            .map(function (d) { return d.data; });
    }));

    return results;
}


export default {
    /**
     * init() initialize streetside.
     */
    init: function () {
        if (!_bubbleCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    /**
     * reset() reset the cache.
     */
    reset: function () {
        var cache = _bubbleCache;

        if (cache) {
            if (cache.bubbles && cache.bubbles.inflight) {
                _forEach(cache.bubbles.inflight, abortRequest);
            }
        }

        _bubbleCache = {
            bubbles: { inflight: {}, loaded: {}, nextPage: {}, nextURL: {}, rtree: rbush(), forImageKey: {}, points: {} }
        };
    },

    /**
     * bubbles()
     */
    bubbles: function (projection) {
        var psize = 32, limit = 3;
        return searchLimited(psize, limit, projection, _bubbleCache.bubbles.rtree);
    },

    /**
     * loadBubbles()
     */
    loadBubbles: function (projection) {
        loadTiles('bubbles', bubbleApi, projection);
    },


    viewer: function() {
        return _pannellumViewer;
    },


    initViewer: function (context) {
        if (!window.pannellum) return;
        if (_pannellumViewer) return;

        var sceneID = ++_currScene + '';
        var options = {
            'default': { firstScene: sceneID },
            scenes: {}
        };
        options.scenes[sceneID] = _sceneOptions;

        _pannellumViewer = window.pannellum.viewer('viewer-streetside', options);
    },


    /**
     * loadViewer() create the streeside viewer.
     */
    loadViewer: function (context) {
        // create ms-wrapper, a photo wrapper class
        var wrap = d3_select('#photoviewer').selectAll('.ms-wrapper')
            .data([0]);

        // inject ms-wrapper into the photoviewer div (used by all
        // to house each custom photo viewer)
        var wrapEnter = wrap.enter()
            .append('div')
            .attr('id', 'ms')
            .attr('class', 'photo-wrapper ms-wrapper')
            .classed('hide', true);

        // inject div to support streetside viewer (pannellum)
        wrapEnter
            .append('div')
            .attr('id', 'viewer-streetside');

        // inject div to support photo attribution into ms-wrapper
        wrapEnter
            .append('div')
            .attr('class', 'photo-attribution-streetside fillD');

        // load streetside pannellum viewer css
        d3_select('head').selectAll('#streetside-viewercss')
            .data([0])
            .enter()
            .append('link')
            .attr('id', 'streetside-viewercss')
            .attr('rel', 'stylesheet')
            .attr('href', context.asset(pannellumViewerCSS));

        // load streetside pannellum viewer js
        d3_select('head').selectAll('#streetside-viewerjs')
            .data([0])
            .enter()
            .append('script')
            .attr('id', 'streetside-viewerjs')
            .attr('src', context.asset(pannellumViewerJS));
    },

    /**
     * showViewer()
     */
    showViewer: function () {
        if (!_sceneOptions) return;

        if (!_pannellumViewer) {
            this.initViewer();
        } else {
            // make a new scene
            var sceneID = ++_currScene + '';
            _pannellumViewer
                .addScene(sceneID, _sceneOptions)
                .loadScene(sceneID);

            // remove previous scene
            if (_currScene > 2) {
                sceneID = (_currScene - 1) + '';
                _pannellumViewer
                    .removeScene(sceneID);
            }

        }

        var wrap = d3_select('#photoviewer')
            .classed('hide', false);

        var isHidden = wrap.selectAll('.photo-wrapper.ms-wrapper.hide').size();

        if (isHidden) {
            wrap
                .selectAll('.photo-wrapper:not(.ms-wrapper)')
                .classed('hide', true);

            wrap
                .selectAll('.photo-wrapper.ms-wrapper')
                .classed('hide', false);
        }

        return this;
    },

    /**
     * hideViewer()
     */
    hideViewer: function () {
        var viewer = d3_select('#photoviewer');
        if (!viewer.empty()) viewer.datum(null);

        viewer
            .classed('hide', true)
            .selectAll('.photo-wrapper')
            .classed('hide', true);

        d3_selectAll('.viewfield-group, .sequence, .icon-sign')
            .classed('selected', false);

        return this.setStyles(null, true);
    },

    /**
     * selectImage().
     */
    selectImage: function (d) {
        var viewer = d3_select('#photoviewer');
        if (!viewer.empty()) viewer.datum(d);

        this.setStyles(null, true);

        var wrap = d3_select('#photoviewer .ms-wrapper');
        var attribution = wrap.selectAll('.photo-attribution-streetside').html('');
        var year = (new Date()).getFullYear();

        if (d) {
            if (d.captured_by) {
                attribution
                    .append('a')
                    .attr('class', 'captured_by')
                    .attr('target', '_blank')
                    .attr('href', 'https://www.microsoft.com/en-us/maps/streetside')
                    .text('©' + year + ' Microsoft');

                attribution
                    .append('span')
                    .text('|');
            }

            if (d.captured_at) {
                attribution
                    .append('span')
                    .attr('class', 'captured_at')
                    .text(localeTimestamp(d.captured_at));
            }

            attribution
                .append('a')
                .attr('class', 'image_link')
                .attr('target', '_blank')
                .attr('href', 'https://www.bing.com/maps/privacyreport/streetsideprivacyreport?bubbleid=' + encodeURIComponent(d.key) +
                    '&focus=photo&lat=' + d.loc[1] + '&lng=' + d.loc[0] + '&z=17')
                .text(t('streetside.report'));


            var bubbleIdQuadKey = d.key.toString(4);
            var paddingNeeded = 16 - bubbleIdQuadKey.length;
            for (var i = 0; i < paddingNeeded; i++) {
                bubbleIdQuadKey = '0' + bubbleIdQuadKey;
            }

            // Order matters here: front=01, right=02, back=03, left=10, up=11, down=12
            var imgLocIdxArr = ['01','02','03','10','11','12'];
            var imgUrlPrefix = streetsideImagesApi + 'hs' + bubbleIdQuadKey;
            var imgUrlSuffix = '.jpg?g=6338&n=z';

            _sceneOptions = {
                showFullscreenCtrl: false,
                autoLoad: true,
                compass: true,
                type: 'cubemap',
                cubeMap: [
                    imgUrlPrefix + imgLocIdxArr[0] + imgUrlSuffix,
                    imgUrlPrefix + imgLocIdxArr[1] + imgUrlSuffix,
                    imgUrlPrefix + imgLocIdxArr[2] + imgUrlSuffix,
                    imgUrlPrefix + imgLocIdxArr[3] + imgUrlSuffix,
                    imgUrlPrefix + imgLocIdxArr[4] + imgUrlSuffix,
                    imgUrlPrefix + imgLocIdxArr[5] + imgUrlSuffix
                ]
            };
        }

        return this;
    },

    /**
     * setStyles().
     */
    setStyles: function (hovered, reset) {
        if (reset) {  // reset all layers
            d3_selectAll('.viewfield-group')
                .classed('highlighted', false)
                .classed('hovered', false)
                .classed('selected', false);

            d3_selectAll('.sequence')
                .classed('highlighted', false)
                .classed('selected', false);
        }
        var hoveredBubbleKey = hovered && hovered.key;
        var viewer = d3_select('#photoviewer');
        var selected = viewer.empty() ? undefined : viewer.datum();
        var selectedBubbleKey = selected && selected.key;
        var highlightedBubbleKeys = _union([hoveredBubbleKey], [selectedBubbleKey]);

        d3_selectAll('.layer-streetside-images .viewfield-group')
            .classed('highlighted', function (d) { return highlightedBubbleKeys.indexOf(d.key) !== -1; })
            .classed('hovered', function (d) { return d.key === hoveredBubbleKey; })
            .classed('selected', function (d) { return d.key === selectedBubbleKey; });

        // d3_selectAll('.layer-streetside-images .sequence')
        //     .classed('highlighted', function (d) { return d.properties.key === hoveredSequenceKey; })
        //     .classed('selected', function (d) { return d.properties.key === selectedSequenceKey; });

        return this;
    },

    /**
     * cache().
     */
    cache: function () {
        return _bubbleCache;
    }
};
