
import _filter from 'lodash-es/filter';
import _find from 'lodash-es/find';
import _flatten from 'lodash-es/flatten';
import _forEach from 'lodash-es/forEach';
import _isEmpty from 'lodash-es/isEmpty';
import _map from 'lodash-es/map';
import _some from 'lodash-es/some';
import _union from 'lodash-es/union';

import { range as d3_range } from 'd3-array';
import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    request as d3_request,
    json as d3_json
} from 'd3-request';

import {
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import rbush from 'rbush';

import { jsonpRequest } from '../util/jsonp_request';
import { d3geoTile as d3_geoTile } from '../lib/d3.geo.tile';
import { geoExtent } from '../geo';
import { utilDetect } from '../util/detect';
import { utilQsString, utilRebind } from '../util';

var apibase = 'https://a.mapillary.com/v3/',
    bubbleApi = 'https://dev.virtualearth.net/mapcontrol/HumanScaleServices/GetBubbles.ashx?',
    streetsideImagesApi = 'https://t.ssl.ak.tiles.virtualearth.net/tiles/',
    appkey = 'An-VWpS-o_m7aV8Lxa0oR9cC3bxwdhdCYEGEFHMP9wyMbmRJFzWfMDD1z3-DXUuE',
    streetsideViewerCss = 'pannellum-streetside/pannellum.css',
    streetsideViewer = 'pannellum-streetside/pannellum.js',
    viewercss = 'mapillary-js/mapillary.min.css',
    viewerjs = 'mapillary-js/mapillary.js',
    clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi',
    maxResults = 1000,
    tileZoom = 16.5, 
    dispatch = d3_dispatch('loadedBubbles'),
    _mlyFallback = false,
    _mlyCache,
    _mlyClicks,
    _mlySelectedImage,
    _mlySignDefs,
    _mlySignSprite,
    _mlyViewer;


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
    if (z < 15) return 2;
    if (z === 15) return 5;
    if (z === 16) return 10;
    if (z === 17) return 20;
    if (z === 18) return 40;
    if (z > 18) return 80;
}


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

// using d3.geo.tiles.js from lib, gets tile extents for the current
// map view extent
function getTiles(projection) {
    console.log('getTiles()');
    //s is the current map scale
    //z is the 'Level of Detail', or zoom-level, where Level 1 is far from the earth, and Level 23 is close to the ground.
    //ts ('tile size') here is the formula for determining the width/height of the map in pixels, but with a modification. 
    //  See 'Ground Resolution and Map Scale': //https://msdn.microsoft.com/en-us/library/bb259689.aspx. 
    //  Here, by subtracting constant 'tileZoom' from z (the level), you end up with a much smaller value for the tile size (in pixels).
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
        .map(function (tile) {
            //console.log('d3_geoTile: ', tile);
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
    console.log('loadTiles() for: ', which);
    var s = projection.scale() * 2 * Math.PI,
        currZoom = Math.floor(Math.max(Math.log(s) / Math.log(2) - 8, 0));

    // breakup the map view into tiles
    var tiles = getTiles(projection).filter(function (t) {
        return !nearNullIsland(t.xyz[0], t.xyz[1], t.xyz[2]);
    });
    console.log("loadTiles(), tiles = ", tiles);

    // which.inflight seems to always be undefined
    _filter(which.inflight, function (v, k) {
        var wanted = _find(tiles, function (tile) { return k === (tile.id + ',0'); });
        if (!wanted) delete which.inflight[k];
        return !wanted;
    }).map(abortRequest);

    tiles.forEach(function (tile) {
       loadNextTilePage(which, currZoom, url, tile);
    });
}

// load data for the next tile page in line
function loadNextTilePage(which, currZoom, url, tile) {
    console.log('loadNextTilePage()');
    var cache = _mlyCache[which],
        //maxPages = maxPageAtZoom(currZoom),
        nextPage = cache.nextPage[tile.id] || 0;
        
        var id = tile.id + ',' + String(nextPage);

        //console.log('id = ', id);
        //console.log('cache.loaded[id]: ', cache.loaded[id]);
        //console.log('cache.inflight[id]: ', cache.inflight[id]);
        
        if (cache.loaded[id] || cache.inflight[id]) return;

        cache.inflight[id] = getBubbles(url, tile, function(bubbles){
            console.log("GET Response - bubbles: ", bubbles);
            cache.loaded[id] = true;
            delete cache.inflight[id];
            if (!bubbles) return;
            // remove first element, statistic info on request, not a bubble
            bubbles.shift();
            console.log('bubbles.length', bubbles.length);
            var features = bubbles.map(function (bubble) {
                //console.log("bubble: ", bubble);
                var loc = [bubble.lo, bubble.la];
                var d = {
                    loc: loc,
                    key: bubble.id,
                    ca: bubble.he,
                    captured_at: bubble.cd,
                    captured_by: "microsoft",
                    nbn: bubble.nbn,
                    pbn: bubble.pbn,
                    rn: bubble.rn,
                    pano: true
                };
                var feature = {
                    geometry: {
                        coordinates: [bubble.lo, bubble.la],
                        type: "Point"
                    },
                    properties: d,
                    type: "Feature"
                };
                var bubbleId = bubble.id;
                cache.points[bubbleId] = feature;
                cache.forImageKey[bubbleId] = bubbleId;
                // return false;  // because no `d` data worth loading into an rbush
                return {
                    minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
                };

            }).filter(Boolean);
            //console.log("bubble features: ", features);
            cache.rtree.load(features);
            //console.log('cache.nextPage[tile.id]', cache.nextPage[tile.id]);
            if (which === 'bubbles'){
                dispatch.call('loadedBubbles');
            }
            // if (bubbles.length === maxResults) {  // more pages to load
            //     cache.nextPage[tile.id] = nextPage + 1;
            //     loadNextTilePage(which, currZoom, url, tile);
            // } else {
            //     cache.nextPage[tile.id] = Infinity;     // no more pages to load
            // }
        });
}

function getBubbles(url, tile, callback) {
    console.log('services - streetside - getBubbles()');
    var rect = tile.extent.rectangle();
    var urlForRequest = url + utilQsString({
        n: rect[3],
        s: rect[1],
        e: rect[2],
        w: rect[0],
        appkey: appkey,
        jsCallback: '{callback}'
    });
    console.log('url for request',urlForRequest);
    jsonpRequest(urlForRequest, function (data) {
        if (!data || data.error) {
            callback(null);
        } else {
            callback(data);
        }
    });
}

// extract links to pages of API results
function parsePagination(links) {
    return links.split(',').map(function (rel) {
        var elements = rel.split(';');
        if (elements.length === 2) {
            return [
                /<(.+)>/.exec(elements[0])[1],
                /rel="(.+)"/.exec(elements[1])[1]
            ];
        } else {
            return ['', ''];
        }
    }).reduce(function (pagination, val) {
        pagination[val[1]] = val[0];
        return pagination;
    }, {});
}


// partition viewport into `psize` x `psize` regions
function partitionViewport(psize, projection) {
    var dimensions = projection.clipExtent()[1];
    psize = psize || 16;
    var cols = d3_range(0, dimensions[0], psize),
        rows = d3_range(0, dimensions[1], psize),
        partitions = [];

    rows.forEach(function (y) {
        cols.forEach(function (x) {
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
    // console.timeEnd('previous');

    // console.time('new');
    // results = partitions.reduce(function(result, extent) {
    //     var found = rtree.search(extent.bbox())
    //         .map(function(d) { return d.data; })
    //         .sort(function(a, b) {
    //             return a.loc[1] - b.loc[1];
    //             // return a.key.localeCompare(b.key);
    //         })
    //         .slice(0, limit);

    //     return (found.length ? result.concat(found) : result);
    // }, []);
    // console.timeEnd('new');

    return results;
}



export default {
    // initialize streetside
    init: function () {
        if (!_mlyCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },
    // reset the cache
    reset: function () {
        var cache = _mlyCache;

        if (cache) {
            if (cache.bubbles && cache.bubbles.inflight) {
                _forEach(cache.bubbles.inflight, abortRequest);
            }
        }

        _mlyCache = {
            bubbles: { inflight: {}, loaded: {}, nextPage: {}, nextURL: {}, rtree: rbush(), forImageKey: {}, points: {} }
        };

        _mlySelectedImage = null;
        _mlyClicks = [];
    },

    //called by update() in svg - services.js
    bubbles: function (projection) {
        //console.log('services - streetside - bubbles()');
        var psize = 32, limit = 3;
        return searchLimited(psize, limit, projection, _mlyCache.bubbles.rtree);
    },

    

    // this is called a bunch of times repeatedly 
    loadBubbles: function (projection) {
        //console.log('services - streetside - loadImages()');
        loadTiles('bubbles', bubbleApi, projection);
    },

    // create the streeside viewer
    loadViewer: function (context) {
        //console.log('services - streetside - loadViewer()');
        // create ms-wrapper a photo wrapper class
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
            .attr('id','viewer-streetside');
            //.attr('class','photo-viewer-streetside');

        // inject div to support photo attribution into ms-wrapper
        wrapEnter
            .append('div')
            .attr('class', 'photo-attribution-streetside fillD');

        // // inject child div for the pannellum viewer
        // var wrap2 = d3_select('#viewer-streetside-wrapper').selectAll('#streetside-viewer').data([0]);
        // wrap2.enter()
        //     .append('div')
        //     .attr('id','viewer-streetside');

        // load streetside pannellum viewer css
        d3_select('head').selectAll('#streetside-viewercss')
        .data([0])
        .enter()
        .append('link')
        .attr('id', 'streetside-viewercss')
        .attr('rel', 'stylesheet')
        .attr('href', context.asset(streetsideViewerCss));

        // load streetside pannellum viewer js
        d3_select('head').selectAll('#streetside-viewerjs')
            .data([0])
            .enter()
            .append('script')
            .attr('id', 'streetside-viewerjs')
            .attr('src', context.asset(streetsideViewer));
    },


    showViewer: function () {
        //console.log('services - streetside - showViewer()');
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

            //_mlyViewer.resize();
        }

        return this;
    },


    hideViewer: function () {
        _mlySelectedImage = null;

        if (!_mlyFallback && _mlyViewer) {
            _mlyViewer.getComponent('sequence').stop();
        }

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

    // Pass the image datum itself in `d` or the `imageKey` string.
    // This allows images to be selected from places that dont have access
    // to the full image datum (like the street signs layer or the js viewer)
    selectImage: function (d, imageKey, fromViewer) {
        //console.log('services - streetside - selectIamge(); d = ',d);
        //console.log('services - streetside - selectIamge(); imageKey = ',imageKey);
        //console.log('services - streetside - selectIamge(); fromViewer = ',fromViewer);
        if (!d && imageKey) {
            // If the user clicked on something that's not an image marker, we
            // might get in here.. Cache lookup can fail, e.g. if the user
            // clicked a streetsign, but images are loading slowly asynchronously.
            // We'll try to carry on anyway if there is no datum.  There just
            // might be a delay before user sees detections, captured_at, etc.
            d = _mlyCache.bubbles.forImageKey[imageKey];
        }

        _mlySelectedImage = d;
        var viewer = d3_select('#photoviewer');
        if (!viewer.empty()) viewer.datum(d);

        imageKey = (d && d.key) || imageKey;
        if (!fromViewer && imageKey) {
            _mlyClicks.push(imageKey);
        }

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
                    .text('©' + year +' Microsoft');

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
                .text('Report a privacy concern with this image');

            //this.updateDetections(d);

            var bubbleIdQuadKey = d.key.toString(4);
            var paddingNeeded = 16 - bubbleIdQuadKey.length;
            for (var i = 0; i < paddingNeeded ;i++)
            {
                bubbleIdQuadKey = "0" + bubbleIdQuadKey;
            }
            var imgLocIdxArr = ['01','02','03','10','11','12']; //Order matters here: front=01, right=02, back=03, left=10 up=11,= down=12
            var imgUrlPrefix = streetsideImagesApi + 'hs' + bubbleIdQuadKey;
            var imgUrlSuffix = '.jpg?g=6338&n=z';
            pannellum.viewer('viewer-streetside', {
                "type": "cubemap",
                "cubeMap": [
                    imgUrlPrefix + imgLocIdxArr[0] +  imgUrlSuffix,
                    imgUrlPrefix + imgLocIdxArr[1] +  imgUrlSuffix,
                    imgUrlPrefix + imgLocIdxArr[2] +  imgUrlSuffix,
                    imgUrlPrefix + imgLocIdxArr[3] +  imgUrlSuffix,
                    imgUrlPrefix + imgLocIdxArr[4] +  imgUrlSuffix,
                    imgUrlPrefix + imgLocIdxArr[5] +  imgUrlSuffix
                ],
                "showFullscreenCtrl": false,
                "autoLoad": true
            }); 
        }
        ////console.log("clicked a streetside image: ", d);
        return this;
    },

    getSelectedImage: function () {
        return _mlySelectedImage;
    },

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
        var highlightedBubbleKeys = _union(hoveredBubbleKey, selectedBubbleKey);

        d3_selectAll('.layer-streetside-images .viewfield-group')
            .classed('highlighted', function (d) { return highlightedBubbleKeys.indexOf(d.key) !== -1; })
            .classed('hovered', function (d) { return d.key === hoveredBubbleKey; })
            .classed('selected', function (d) { return d.key === selectedBubbleKey; });

        d3_selectAll('.layer-streetside-images .sequence')
            .classed('highlighted', function (d) { return d.properties.key === hoveredSequenceKey; })
            .classed('selected', function (d) { return d.properties.key === selectedSequenceKey; });

        return this;
    },


    cache: function () {
        return _mlyCache;
    },


    signDefs: function (_) {
        if (!arguments.length) return _mlySignDefs;
        _mlySignDefs = _;
        return this;
    }

};
