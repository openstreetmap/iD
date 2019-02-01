import _extend from 'lodash-es/extend';
import _find from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';
import _union from 'lodash-es/union';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { timer as d3_timer } from 'd3-timer';

import {
    event as d3_event,
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import rbush from 'rbush';
import { t } from '../util/locale';
import { jsonpRequest } from '../util/jsonp_request';

import {
    geoExtent,
    geoMetersToLat,
    geoMetersToLon,
    geoPointInPolygon,
    geoRotate,
    geoScaleToZoom,
    geoVecLength
} from '../geo';

import { utilDetect } from '../util/detect';
import { utilQsString, utilRebind, utilTiler } from '../util';

import Q from 'q';


var bubbleApi = 'https://dev.virtualearth.net/mapcontrol/HumanScaleServices/GetBubbles.ashx?';
var streetsideImagesApi = 'https://t.ssl.ak.tiles.virtualearth.net/tiles/';
var bubbleAppKey = 'AuftgJsO0Xs8Ts4M1xZUQJQXJNsvmh3IV8DkNieCiy3tCwCUMq76-WpkrBtNAuEm';
var pannellumViewerCSS = 'pannellum-streetside/pannellum.css';
var pannellumViewerJS = 'pannellum-streetside/pannellum.js';
var maxResults = 2000;
var tileZoom = 16.5;
var tiler = utilTiler().zoomExtent([tileZoom, tileZoom]).skipNullIsland(true);
var dispatch = d3_dispatch('loadedBubbles', 'viewerChanged');
var minHfov = 10;         // zoom in degrees:  20, 10, 5
var maxHfov = 90;         // zoom out degrees
var defaultHfov = 45;

var _hires = false;
var _resolution = 512;    // higher numbers are slower - 512, 1024, 2048, 4096
var _currScene = 0;
var _ssCache;
var _pannellumViewer;
var _sceneOptions;
var _dataUrlArray = [];


/**
 * abortRequest().
 */
function abortRequest(i) {
    i.abort();
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
 * loadTiles() wraps the process of generating tiles and then fetching image points for each tile.
 */
function loadTiles(which, url, projection, margin) {
    var tiles = tiler.margin(margin).getTiles(projection);

    // abort inflight requests that are no longer needed
    var cache = _ssCache[which];
    _forEach(cache.inflight, function(v, k) {
        var wanted = _find(tiles, function(tile) { return k.indexOf(tile.id + ',') === 0; });

        if (!wanted) {
            abortRequest(v);
            delete cache.inflight[k];
        }
    });

    tiles.forEach(function (tile) {
       loadNextTilePage(which, url, tile);
    });
}

/**
 * loadNextTilePage() load data for the next tile page in line.
 */
function loadNextTilePage(which, url, tile) {
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

        var features = bubbles.map(function(bubble) {
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

    return jsonpRequest(urlForRequest, function (data) {
        if (!data || data.error) {
            callback(null);
        } else {
            callback(data);
        }
    });
}


// partition viewport into higher zoom tiles
function partitionViewport(projection) {
    var z = geoScaleToZoom(projection.scale());
    var z2 = (Math.ceil(z * 2) / 2) + 2.5;   // round to next 0.5 and add 2.5
    var tiler = utilTiler().zoomExtent([z2, z2]);

    return tiler.getTiles(projection)
        .map(function(tile) { return tile.extent; });
}


// no more than `limit` results per partition.
function searchLimited(limit, projection, rtree) {
    limit = limit || 5;

    return partitionViewport(projection)
        .reduce(function(result, extent) {
            var found = rtree.search(extent.bbox())
                .slice(0, limit)
                .map(function(d) { return d.data; });

            return (found.length ? result.concat(found) : result);
        }, []);
}


/**
 * getImage()
 */
function getImage(imgInfo) {
    var response = Q.defer();
    var img = new Image();

    img.onload = function() {
        var canvas = document.getElementById('canvas' + imgInfo.face);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, imgInfo.x, imgInfo.y);
        response.resolve({imgInfo:imgInfo, status: 'ok'});
    };
    img.onerror = function() {
        response.resolve({data: imgInfo, status: 'error'});
    };
    img.setAttribute('crossorigin', '');
    img.src = imgInfo.url;

    return response.promise;
}


/**
 * loadCanvas()
 */
function loadCanvas(imgInfoGroup) {
    var response = Q.defer();
    var getImagePromises = imgInfoGroup.map(function(imgInfo) {
        return getImage(imgInfo);
    });

    Q.all(getImagePromises).then(function(data) {
        var canvas = document.getElementById('canvas' + data[0].imgInfo.face);
        switch (data[0].imgInfo.face) {
            case '01':
                _dataUrlArray[0] = canvas.toDataURL('image/jpeg', 1.0);
                break;
            case '02':
                _dataUrlArray[1] = canvas.toDataURL('image/jpeg', 1.0);
                break;
            case '03':
                _dataUrlArray[2] = canvas.toDataURL('image/jpeg', 1.0);
                break;
            case '10':
                _dataUrlArray[3] = canvas.toDataURL('image/jpeg', 1.0);
                break;
            case '11':
                _dataUrlArray[4] = canvas.toDataURL('image/jpeg', 1.0);
                break;
            case '12':
                _dataUrlArray[5] = canvas.toDataURL('image/jpeg', 1.0);
                break;
        }
        response.resolve({status:'loadCanvas for face ' + data[0].imgInfo.face + 'ok'});
    });

    return response.promise;
}


function setupCanvas(selection, reset) {
    if (reset) {
        selection.selectAll('#divForCanvasWork')
            .remove();
    }

    // Add the Streetside working canvases. These are used for 'stitching', or combining,
    // multiple images for each of the six faces, before passing to the Pannellum control as DataUrls
    selection.selectAll('#divForCanvasWork')
        .data([0])
        .enter()
        .append('div')
        .attr('id', 'divForCanvasWork')
        .attr('display', 'none')
        .selectAll('canvas')
        .data(['canvas01', 'canvas02', 'canvas03', 'canvas10', 'canvas11', 'canvas12'])
        .enter()
        .append('canvas')
        .attr('id', function(d) { return d; })
        .attr('width', _resolution)
        .attr('height', _resolution);
}


/**
 * processFaces()
 */
function processFaces(imgFaceInfoGroups) {
    var response = Q.defer();
    var loadCanvasPromises = imgFaceInfoGroups.map(function(faceImgGroup) {
        return loadCanvas(faceImgGroup);
    });

    Q.all(loadCanvasPromises).then(function() {
        response.resolve({status: 'processFaces done'});
    });

    return response.promise;
}



function qkToXY(qk) {
    var x = 0;
    var y = 0;
    var scale = 256;
    for (var i = qk.length; i > 0; i--) {
        var key = qk[i-1];
        x += (+(key === '1' || key === '3')) * scale;
        y += (+(key === '2' || key === '3')) * scale;
        scale *= 2;
    }
    return [x, y];
}


function getQuadKeys() {
    var dim = _resolution / 256;
    var quadKeys;

    if (dim === 16) {
        quadKeys = [
            '0000','0001','0010','0011','0100','0101','0110','0111',  '1000','1001','1010','1011','1100','1101','1110','1111',
            '0002','0003','0012','0013','0102','0103','0112','0113',  '1002','1003','1012','1013','1102','1103','1112','1113',
            '0020','0021','0030','0031','0120','0121','0130','0131',  '1020','1021','1030','1031','1120','1121','1130','1131',
            '0022','0023','0032','0033','0122','0123','0132','0133',  '1022','1023','1032','1033','1122','1123','1132','1133',
            '0200','0201','0210','0211','0300','0301','0310','0311',  '1200','1201','1210','1211','1300','1301','1310','1311',
            '0202','0203','0212','0213','0302','0303','0312','0313',  '1202','1203','1212','1213','1302','1303','1312','1313',
            '0220','0221','0230','0231','0320','0321','0330','0331',  '1220','1221','1230','1231','1320','1321','1330','1331',
            '0222','0223','0232','0233','0322','0323','0332','0333',  '1222','1223','1232','1233','1322','1323','1332','1333',

            '2000','2001','2010','2011','2100','2101','2110','2111',  '3000','3001','3010','3011','3100','3101','3110','3111',
            '2002','2003','2012','2013','2102','2103','2112','2113',  '3002','3003','3012','3013','3102','3103','3112','3113',
            '2020','2021','2030','2031','2120','2121','2130','2131',  '3020','3021','3030','3031','3120','3121','3130','3131',
            '2022','2023','2032','2033','2122','2123','2132','2133',  '3022','3023','3032','3033','3122','3123','3132','3133',
            '2200','2201','2210','2211','2300','2301','2310','2311',  '3200','3201','3210','3211','3300','3301','3310','3311',
            '2202','2203','2212','2213','2302','2303','2312','2313',  '3202','3203','3212','3213','3302','3303','3312','3313',
            '2220','2221','2230','2231','2320','2321','2330','2331',  '3220','3221','3230','3231','3320','3321','3330','3331',
            '2222','2223','2232','2233','2322','2323','2332','2333',  '3222','3223','3232','3233','3322','3323','3332','3333'
        ];

    } else if (dim === 8) {
        quadKeys = [
            '000','001','010','011',  '100','101','110','111',
            '002','003','012','013',  '102','103','112','113',
            '020','021','030','031',  '120','121','130','131',
            '022','023','032','033',  '122','123','132','133',

            '200','201','210','211',  '300','301','310','311',
            '202','203','212','213',  '302','303','312','313',
            '220','221','230','231',  '320','321','330','331',
            '222','223','232','233',  '322','323','332','333'
        ];

    } else if (dim === 4) {
        quadKeys = [
            '00','01',  '10','11',
            '02','03',  '12','13',

            '20','21',  '30','31',
            '22','23',  '32','33'
        ];

    } else {  // dim === 2
        quadKeys = [
            '0', '1',
            '2', '3'
        ];
    }

    return quadKeys;
}



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
        var limit = 5;
        return searchLimited(limit, projection, _ssCache.bubbles.rtree);
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
    loadBubbles: function (projection, margin) {
        // by default: request 2 nearby tiles so we can connect sequences.
        if (margin === undefined) margin = 2;

        loadTiles('bubbles', bubbleApi, projection, margin);
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
        var that = this;

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

        var controlsEnter = wrapEnter
            .append('div')
            .attr('class', 'photo-controls-wrap')
            .append('div')
            .attr('class', 'photo-controls');

        controlsEnter
            .append('button')
            .on('click.back', step(-1))
            .text('◄');

        controlsEnter
            .append('button')
            .on('click.forward', step(1))
            .text('►');


        // create working canvas for stitching together images
        wrap = wrap
            .merge(wrapEnter)
            .call(setupCanvas, true);

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


        // Register viewer resize handler
        context.ui().photoviewer.on('resize', function() {
            if (_pannellumViewer) {
                _pannellumViewer.resize();
            }
        });


        function step(stepBy) {
            return function() {
                var viewer = d3_select('#photoviewer');
                var selected = viewer.empty() ? undefined : viewer.datum();
                if (!selected) return;

                var nextID = (stepBy === 1 ? selected.ne : selected.pr);
                var yaw = _pannellumViewer.getYaw();
                var ca = selected.ca + yaw;
                var origin = selected.loc;

                // construct a search trapezoid pointing out from current bubble
                var meters = 35;
                var p1 = [
                    origin[0] + geoMetersToLon(meters / 5, origin[1]),
                    origin[1]
                ];
                var p2 = [
                    origin[0] + geoMetersToLon(meters / 2, origin[1]),
                    origin[1] + geoMetersToLat(meters)
                ];
                var p3 = [
                    origin[0] - geoMetersToLon(meters / 2, origin[1]),
                    origin[1] + geoMetersToLat(meters)
                ];
                var p4 = [
                    origin[0] - geoMetersToLon(meters / 5, origin[1]),
                    origin[1]
                ];

                var poly = [p1, p2, p3, p4, p1];

                // rotate it to face forward/backward
                var angle = (stepBy === 1 ? ca : ca + 180) * (Math.PI / 180);
                poly = geoRotate(poly, -angle, origin);

                var extent = poly.reduce(function(extent, point) {
                    return extent.extend(geoExtent(point));
                }, geoExtent());

                // find nearest other bubble in the search polygon
                var minDist = Infinity;
                _ssCache.bubbles.rtree.search(extent.bbox())
                    .forEach(function(d) {
                        if (d.data.key === selected.key) return;
                        if (!geoPointInPolygon(d.data.loc, poly)) return;

                        var dist = geoVecLength(d.data.loc, selected.loc);
                        var theta = selected.ca - d.data.ca;
                        var minTheta = Math.min(Math.abs(theta), 360 - Math.abs(theta));
                        if (minTheta > 20) {
                            dist += 5;  // penalize distance if camera angles don't match
                        }

                        if (dist < minDist) {
                            nextID = d.data.key;
                            minDist = dist;
                        }
                    });

                var nextBubble = nextID && _ssCache.bubbles.points[nextID];
                if (!nextBubble) return;

                context.map().centerEase(nextBubble.loc);

                that.selectImage(nextBubble)
                    .then(function(r) {
                        if (r.status === 'ok') {
                            _sceneOptions.yaw = yaw;
                            that.showViewer();
                        }
                    });
            };
        }
    },

    /**
     * showViewer()
     */
    showViewer: function (yaw) {
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
        var that = this;

        var viewer = d3_select('#photoviewer');
        if (!viewer.empty()) viewer.datum(d);

        this.setStyles(null, true);

        var wrap = d3_select('#photoviewer .ms-wrapper');
        var attribution = wrap.selectAll('.photo-attribution').html('');

        wrap.selectAll('.pnlm-load-box')   // display "loading.."
            .style('display', 'block');

        if (!d) {
            response.resolve({status: 'ok'});
            return response.promise;
        }

        var line1 = attribution
            .append('div')
            .attr('class', 'attribution-row');

        // Add hires checkbox
        var label = line1
            .append('label')
            .attr('class', 'streetside-hires');

        label
            .append('input')
            .attr('type', 'checkbox')
            .attr('id', 'streetside-hires-input')
            .property('checked', _hires)
            .on('click', function() {
                d3_event.stopPropagation();

                _hires = !_hires;
                _resolution = _hires ? 1024 : 512;
                wrap.call(setupCanvas, true);

                var viewstate = {
                    yaw: _pannellumViewer.getYaw(),
                    pitch: _pannellumViewer.getPitch(),
                    hfov: _pannellumViewer.getHfov()
                };

                that.selectImage(d)
                    .then(function(r) {
                        if (r.status === 'ok') {
                            _sceneOptions = _extend(_sceneOptions, viewstate);
                            that.showViewer();
                        }
                    });
            });

        label
            .append('span')
            .text(t('streetside.hires'));


        var captureInfo = line1
            .append('div')
            .attr('class', 'attribution-capture-info');

        // Add capture date
        if (d.captured_by) {
            var yyyy = (new Date()).getFullYear();

            captureInfo
                .append('a')
                .attr('class', 'captured_by')
                .attr('target', '_blank')
                .attr('href', 'https://www.microsoft.com/en-us/maps/streetside')
                .text('©' + yyyy + ' Microsoft');

            captureInfo
                .append('span')
                .text('|');
        }

        if (d.captured_at) {
            captureInfo
                .append('span')
                .attr('class', 'captured_at')
                .text(localeTimestamp(d.captured_at));
        }

        // Add image links
        var line2 = attribution
            .append('div')
            .attr('class', 'attribution-row');

        line2
            .append('a')
            .attr('class', 'image-view-link')
            .attr('target', '_blank')
            .attr('href', 'https://www.bing.com/maps?cp=' + d.loc[1] + '~' + d.loc[0] +
                '&lvl=17&dir=' + d.ca + '&style=x&v=2&sV=1')
            .text(t('streetside.view_on_bing'));

        line2
            .append('a')
            .attr('class', 'image-report-link')
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

        // Cubemap face code order matters here: front=01, right=02, back=03, left=10, up=11, down=12
        var faceKeys = ['01','02','03','10','11','12'];

        // Map images to cube faces
        var quadKeys = getQuadKeys();
        var faces = faceKeys.map(function(faceKey) {
            return quadKeys.map(function(quadKey) {
                var xy = qkToXY(quadKey);
                return {
                    face: faceKey,
                    url: imgUrlPrefix + faceKey + quadKey + imgUrlSuffix,
                    x: xy[0],
                    y: xy[1]
                };
            });
        });

        processFaces(faces).then(function() {
            _sceneOptions = {
                showFullscreenCtrl: false,
                autoLoad: true,
                compass: true,
                northOffset: d.ca,
                yaw: 0,
                minHfov: minHfov,
                maxHfov: maxHfov,
                hfov: defaultHfov,
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
