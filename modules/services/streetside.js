import _flatten from 'lodash-es/flatten';
import _forEach from 'lodash-es/forEach';
import _map from 'lodash-es/map';
import _union from 'lodash-es/union';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { range as d3_range } from 'd3-array';
import { timer as d3_timer } from 'd3-timer';

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

import Q from 'q';

var bubbleApi = 'https://dev.virtualearth.net/mapcontrol/HumanScaleServices/GetBubbles.ashx?';
var streetsideImagesApi = 'https://t.ssl.ak.tiles.virtualearth.net/tiles/';
var bubbleAppKey = 'AuftgJsO0Xs8Ts4M1xZUQJQXJNsvmh3IV8DkNieCiy3tCwCUMq76-WpkrBtNAuEm';
var pannellumViewerCSS = 'pannellum-streetside/pannellum.css';
var pannellumViewerJS = 'pannellum-streetside/pannellum.js';
var maxResults = 2000;
var tileZoom = 16.5;
var dispatch = d3_dispatch('loadedBubbles', 'viewerChanged');
var _currScene = 0;
var _ssCache;
var _pannellumViewer;
var _sceneOptions;
var _dataUrlArray = [];
var _faceImgInfoGroups = [];

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
    var options = { day: 'numeric', month: 'short', year: 'numeric' };
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
    var cache = _ssCache[which];
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
            if (cache.points[bubble.id]) return null;  // skip duplicates

            var loc = [bubble.lo, bubble.la];
            var d = {
                loc: loc,
                key: bubble.id,
                ca: bubble.he,
                captured_at: bubble.cd,
                captured_by: 'microsoft',
                // nbn: bubble.nbn,
                // pbn: bubble.pbn,
                // ad: bubble.ad,
                // rn: bubble.rn,
                pr: bubble.pr,  // previous
                ne: bubble.ne,  // next
                pano: true,
                sequenceKey: null
            };

            cache.points[bubble.id] = d;

            // a sequence starts here
            if (bubble.pr === undefined) {
                cache.leaders.push(bubble.id);
            }

            return {
                minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
            };

        }).filter(Boolean);

        cache.rtree.load(features);

        connectSequences();

        if (which === 'bubbles') {
            dispatch.call('loadedBubbles');
        }
    });
}


// call this sometimes to connect the bubbles into sequences
function connectSequences() {
    var cache = _ssCache.bubbles;
    var keepLeaders = [];

    for (var i = 0; i < cache.leaders.length; i++) {
        var bubble = cache.points[cache.leaders[i]];
        var seen = {};

        // try to make a sequence.. use the key of the leader bubble.
        var sequence = { key: bubble.key, bubbles: [] };
        var complete = false;

        do {
            sequence.bubbles.push(bubble);
            seen[bubble.key] = true;

            if (bubble.ne === undefined) {
                complete = true;
            } else {
                bubble = cache.points[bubble.ne];  // advance to next
            }
        } while (bubble && !seen[bubble.key] && !complete);


        if (complete) {
            _ssCache.sequences[sequence.key] = sequence;

            // assign bubbles to the sequence
            for (var j = 0; j < sequence.bubbles.length; j++) {
                sequence.bubbles[j].sequenceKey = sequence.key;
            }

            // create a GeoJSON LineString
            sequence.geojson = {
                type: 'LineString',
                properties: { key: sequence.key },
                coordinates: sequence.bubbles.map(function (d) { return d.loc; })
            };

        } else {
            keepLeaders.push(cache.leaders[i]);
        }
    }

    // couldn't complete these, save for later
    cache.leaders = keepLeaders;
}

/**
 * getBubbles() handles the request to the server for a tile extent of 'bubbles' (streetside image locations).
 */
function getBubbles(url, tile, callback) {
    var rect = tile.extent.rectangle();
    var urlForRequest = url + utilQsString({
        n: rect[3],
        s: rect[1],
        e: rect[2],
        w: rect[0],
        c: maxResults,
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
    limit = limit || 3;

    var partitions = partitionViewport(psize, projection);
    var results;

    results = _flatten(_map(partitions, function (extent) {
        return rtree.search(extent.bbox())
            .slice(0, limit)
            .map(function (d) { return d.data; });
    }));

    return results;
}
/**
 * getImage()
 */
function getImage(imgInfo){
    var response = Q.defer();
    var canvas = document.getElementById('canvas' + imgInfo.face);
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.onload = function() {
        ctx.drawImage(img, imgInfo.dx, imgInfo.dy);
        response.resolve({imgInfo:imgInfo, status: 'ok'});
    };
    img.onerror = function(){
        console.log('img onerror !');
        response.resolve({data: imgInfo, status: 'error'});
    };
    img.setAttribute("crossorigin","");
    img.src = imgInfo.url;
    return response.promise;
}
/**
 * loadCanvas()
 */
function loadCanvas(imgInfoGroup){
    var response = Q.defer();
    var getImagePromises = [];
    imgInfoGroup.forEach(function(imgInfo){
        getImagePromises.push(getImage(imgInfo))
    });
    Q.all(getImagePromises).then(function(data){
        console.log('loadCanvas - All Get Images done: ', data);
        var canvas = document.getElementById('canvas' + data[0].imgInfo.face);
        switch(data[0].imgInfo.face){
            case '01':
                _dataUrlArray[0] = canvas.toDataURL('image/jpeg',1.0)
                break;
            case '02':
                _dataUrlArray[1] = canvas.toDataURL('image/jpeg',1.0)
                break;
            case '03':
                _dataUrlArray[2] = canvas.toDataURL('image/jpeg',1.0)
                break;
            case '10':
                _dataUrlArray[3] = canvas.toDataURL('image/jpeg',1.0)
                break;
            case '11':
                _dataUrlArray[4] = canvas.toDataURL('image/jpeg',1.0)
                break;
            case '12':
                _dataUrlArray[5] = canvas.toDataURL('image/jpeg',1.0)
                break;
        }
        response.resolve({status:'loadCanvas for face ' + data[0].imgInfo.face + 'ok'});
    });
    return response.promise;
};
/**
 * processImages()
 */
function processImages(imgFaceInfoGroups){
    var response = Q.defer();
    var loadCanvasPromises = [];
    //call loadCanvas once with each group of infos....
    imgFaceInfoGroups.forEach(function(faceImgGroup){
        loadCanvasPromises.push(loadCanvas(faceImgGroup));
    });
    Q.all(loadCanvasPromises).then(function(data){
        response.resolve({status: 'processImages done'})
    });
    return response.promise;
};

export default {
    /**
     * init() initialize streetside.
     */
    init: function () {
        if (!_ssCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    /**
     * reset() reset the cache.
     */
    reset: function () {
        var cache = _ssCache;

        if (cache) {
            if (cache.bubbles && cache.bubbles.inflight) {
                _forEach(cache.bubbles.inflight, abortRequest);
            }
        }

        _ssCache = {
            bubbles: { inflight: {}, loaded: {}, nextPage: {}, rtree: rbush(), points: {}, leaders: [] },
            sequences: {}
        };
    },

    /**
     * bubbles()
     */
    bubbles: function (projection) {
        var psize = 32, limit = 3;
        return searchLimited(psize, limit, projection, _ssCache.bubbles.rtree);
    },


    sequences: function(projection) {
        var viewport = projection.clipExtent();
        var min = [viewport[0][0], viewport[1][1]];
        var max = [viewport[1][0], viewport[0][1]];
        var bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
        var seen = {};
        var results = [];

        // all sequences for bubbles in viewport
        _ssCache.bubbles.rtree.search(bbox)
            .forEach(function(d) {
                var key = d.data.sequenceKey;
                if (key && !seen[key]) {
                    seen[key] = true;
                    results.push(_ssCache.sequences[key].geojson);
                }
            });

        return results;
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


    initViewer: function () {
        if (!window.pannellum) return;
        if (_pannellumViewer) return;

        var sceneID = ++_currScene + '';
        var options = {
            'default': { firstScene: sceneID },
            scenes: {}
        };
        options.scenes[sceneID] = _sceneOptions;

        _pannellumViewer = window.pannellum.viewer('viewer-streetside', options);

        _pannellumViewer
            .on('mousedown', function() {
                d3_select(window).on('mousemove.pannellum', function() {
                    dispatch.call('viewerChanged');
                });
            })
            .on('mouseup', function() {
                d3_select(window).on('mousemove.pannellum', null);
                // continue dispatching events for a few seconds, in case viewer has inertia.
                var t = d3_timer(function(elapsed) {
                    dispatch.call('viewerChanged');
                    if (elapsed > 2000) {
                        t.stop();
                    }
                });
            });
    },


    /**
     * loadViewer() create the streeside viewer.
     */
    loadViewer: function (context) {
        // Add the Streetside working canvases. These are used for 'stitching', or combining, 
        // multiple images for each of the six faces, before passing to the Pannellum control as DataUrls
        var bodyWrap = d3_select('body')
            .append('div')
            .attr('id','divForCanvasWork')
            .attr('display','none');
        var canvasDivWrap = d3_select('#divForCanvasWork')
            .selectAll('canvas')
            .data(['canvas01','canvas02','canvas03','canvas10','canvas11','canvas12'])
            .enter()
            .append('canvas')
            .attr('id',function(d){return d})
            .attr('width','512')
            .attr('height','512');
        
        // create ms-wrapper, a photo wrapper class
        var wrap = d3_select('#photoviewer').selectAll('.ms-wrapper')
            .data([0]);

        // inject ms-wrapper into the photoviewer div
        // (used by all to house each custom photo viewer)
        var wrapEnter = wrap.enter()
            .append('div')
            .attr('id', 'ms')
            .attr('class', 'photo-wrapper ms-wrapper')
            .classed('hide', true);

        // inject div to support streetside viewer (pannellum) and attribution line
        wrapEnter
            .append('div')
            .attr('id', 'viewer-streetside')
            .append('div')
            .attr('class', 'photo-attribution fillD');

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
    showViewer: function (yaw) {
        console.log('showViewer(), _sceneOptions = ', _sceneOptions)
        if (!_sceneOptions) return;

        if (yaw !== undefined) {
            _sceneOptions.yaw = yaw;
        }

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
        var response = Q.defer();

        var viewer = d3_select('#photoviewer');
        if (!viewer.empty()) viewer.datum(d);

        this.setStyles(null, true);

        var wrap = d3_select('#photoviewer .ms-wrapper');
        var attribution = wrap.selectAll('.photo-attribution').html('');
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
            var imgUrlPrefix = streetsideImagesApi + 'hs' + bubbleIdQuadKey;
            var imgUrlSuffix = '.jpg?g=6338&n=z';
            // Order matters here: front=01, right=02, back=03, left=10, up=11, down=12
            var imgFaceCodes = ['01','02','03','10','11','12'];
            var fourImgPerFaceLocationCodes = ['0','1','2','3'];
            var fourImgPerFaceLocationPositions = [{dx:0,dy:0},{dx:256,dy:0},{dx:0,dy:256},{dx:256,dy:256}];
            imgFaceCodes.forEach(function(faceCode){
                var faceImgInfoGroup = [];
                fourImgPerFaceLocationCodes.forEach(function(loc,idx_l){
                    var imgInfoObj = {};
                    imgInfoObj.face = faceCode;
                    imgInfoObj.url = imgUrlPrefix + faceCode + loc + imgUrlSuffix;
                    imgInfoObj.dx = fourImgPerFaceLocationPositions[idx_l].dx;
                    imgInfoObj.dy = fourImgPerFaceLocationPositions[idx_l].dy;
                    faceImgInfoGroup.push(imgInfoObj);
                });
                _faceImgInfoGroups.push(faceImgInfoGroup);
            });

            processImages(_faceImgInfoGroups).then(function(data){
                _sceneOptions = {
                    showFullscreenCtrl: false,
                    autoLoad: true,
                    compass: true,
                    northOffset: d.ca,
                    yaw: 0,
                    type: 'cubemap',
                    cubeMap: [
                        _dataUrlArray[0],
                        _dataUrlArray[1],
                        _dataUrlArray[2],
                        _dataUrlArray[3],
                        _dataUrlArray[4],
                        _dataUrlArray[5]
                    ]
                };
                response.resolve({status: 'ok'});
            });
        }
        return response.promise;
    },
    

    getSequenceKeyForBubble: function(d) {
        return d && d.sequenceKey;
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
        var hoveredSequenceKey = this.getSequenceKeyForBubble(hovered);
        var hoveredSequence = hoveredSequenceKey && _ssCache.sequences[hoveredSequenceKey];
        var hoveredBubbleKeys =  (hoveredSequence && hoveredSequence.bubbles.map(function (d) { return d.key; })) || [];

        var viewer = d3_select('#photoviewer');
        var selected = viewer.empty() ? undefined : viewer.datum();
        var selectedBubbleKey = selected && selected.key;
        var selectedSequenceKey = this.getSequenceKeyForBubble(selected);
        var selectedSequence = selectedSequenceKey && _ssCache.sequences[selectedSequenceKey];
        var selectedBubbleKeys = (selectedSequence && selectedSequence.bubbles.map(function (d) { return d.key; })) || [];

        // highlight sibling viewfields on either the selected or the hovered sequences
        var highlightedBubbleKeys = _union(hoveredBubbleKeys, selectedBubbleKeys);

        d3_selectAll('.layer-streetside-images .viewfield-group')
            .classed('highlighted', function (d) { return highlightedBubbleKeys.indexOf(d.key) !== -1; })
            .classed('hovered', function (d) { return d.key === hoveredBubbleKey; })
            .classed('selected', function (d) { return d.key === selectedBubbleKey; });

        d3_selectAll('.layer-streetside-images .sequence')
            .classed('highlighted', function (d) { return d.properties.key === hoveredSequenceKey; })
            .classed('selected', function (d) { return d.properties.key === selectedSequenceKey; });

        // update viewfields if needed
        d3_selectAll('.viewfield-group .viewfield')
            .attr('d', viewfieldPath);

        function viewfieldPath() {
            var d = this.parentNode.__data__;
            if (d.pano && d.key !== selectedBubbleKey) {
                return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
            } else {
                return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
            }
        }

        return this;
    },

    /**
     * cache().
     */
    cache: function () {
        return _ssCache;
    }
};
