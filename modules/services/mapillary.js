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


var apibase = 'https://a.mapillary.com/v3/',
    viewercss = 'mapillary-js/mapillary.min.css',
    viewerjs = 'mapillary-js/mapillary.min.js',
    clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi',
    maxResults = 1000,
    tileZoom = 14,
    dispatch = d3.dispatch('loadedImages', 'loadedSigns'),
    mapillaryCache,
    mapillaryClicks,
    mapillaryImage,
    mapillarySignDefs,
    mapillarySignSprite,
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

    _.filter(which.inflight, function(v, k) {
        var wanted = _.find(tiles, function(tile) { return k === (tile.id + ',0'); });
        if (!wanted) delete which.inflight[k];
        return !wanted;
    }).map(abortRequest);

    tiles.forEach(function(tile) {
        loadNextTilePage(which, currZoom, url, tile);
    });
}


function loadNextTilePage(which, currZoom, url, tile) {
    var cache = mapillaryCache[which],
        rect = tile.extent.rectangle(),
        maxPages = maxPageAtZoom(currZoom),
        nextPage = cache.nextPage[tile.id] || 0,
        nextURL = cache.nextURL[tile.id] || url +
            utilQsString({
                per_page: maxResults,
                page: nextPage,
                client_id: clientId,
                bbox: [rect[0], rect[1], rect[2], rect[3]].join(','),
            });

    if (nextPage > maxPages) return;

    var id = tile.id + ',' + String(nextPage);
    if (cache.loaded[id] || cache.inflight[id]) return;
    cache.inflight[id] = d3.request(nextURL)
        .mimeType('application/json')
        .response(function(xhr) {
            var linkHeader = xhr.getResponseHeader('Link');
            if (linkHeader) {
                var pagination = parsePagination(xhr.getResponseHeader('Link'));
                if (pagination.next) {
                    cache.nextURL[tile.id] = pagination.next;
                }
            }
            return JSON.parse(xhr.responseText);
        })
        .get(function(err, data) {
            cache.loaded[id] = true;
            delete cache.inflight[id];
            if (err || !data.features || !data.features.length) return;

            var features = data.features.map(function(feature) {
                var loc = feature.geometry.coordinates,
                    d;

                if (which === 'images') {
                    d = {
                        loc: loc,
                        key: feature.properties.key,
                        ca: feature.properties.ca,
                        captured_at: feature.properties.captured_at,
                        pano: feature.properties.pano
                    };
                } else if (which === 'objects') {
                    d = {
                        loc: loc,
                        key: feature.properties.key,
                        value: feature.properties.value,
                        package: feature.properties.package,
                        detections: feature.properties.detections
                    };

                    // cache image_key -> detection_key
                    feature.properties.detections.forEach(function(detection) {
                        var ik = detection.image_key;
                        var dk = detection.detection_key;
                        if (!mapillaryCache.detections[ik]) {
                            mapillaryCache.detections[ik] = {};
                        }
                        if (!mapillaryCache.detections[ik][dk]) {
                            mapillaryCache.detections[ik][dk] = {};
                        }
                    });
                }

                return {
                    minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
                };
            });

            cache.rtree.load(features);

            if (which === 'images') {
                dispatch.call('loadedImages');
            } else if (which === 'objects') {
                dispatch.call('loadedSigns');
            }

            if (data.features.length === maxResults) {  // more pages to load
                cache.nextPage[tile.id] = nextPage + 1;
                loadNextTilePage(which, currZoom, url, tile);
            } else {
                cache.nextPage[tile.id] = Infinity;     // no more pages to load
            }
        });
}

// extract links to pages of API results
function parsePagination(links) {
    return links.split(',').map(function(rel) {
        var elements = rel.split(';');
        if (elements.length === 2) {
            return [
                /<(.+)>/.exec(elements[0])[1],
                /rel="(.+)"/.exec(elements[1])[1]
                ];
        } else {
            return ['',''];
        }
    }).reduce(function(pagination, val) {
        pagination[val[1]] = val[0];
        return pagination;
    }, {});
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
            if (cache.objects && cache.objects.inflight) {
                _.forEach(cache.objects.inflight, abortRequest);
            }
        }

        mapillaryCache = {
            images: { inflight: {}, loaded: {}, nextPage: {}, nextURL: {}, rtree: rbush() },
            objects:  { inflight: {}, loaded: {}, nextPage: {}, nextURL: {}, rtree: rbush() },
            detections: {}
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
        return searchLimited(psize, limit, projection, mapillaryCache.objects.rtree);
    },


    signsSupported: function() {
        var detected = utilDetect();
        if (detected.ie) return false;
        if ((detected.browser.toLowerCase() === 'safari') && (parseFloat(detected.version) < 10)) return false;
        return true;
    },


    signHTML: function(d) {
        if (!mapillarySignDefs || !mapillarySignSprite) return;
        var position = mapillarySignDefs[d.value];
        if (!position) return '<div></div>';
        var iconStyle = [
            'background-image:url(' + mapillarySignSprite + ')',
            'background-repeat:no-repeat',
            'height:' + position.height + 'px',
            'width:' + position.width + 'px',
            'background-position-x:-' + position.x + 'px',
            'background-position-y:-' + position.y + 'px',
        ];

        return '<div style="' + iconStyle.join(';') +'"></div>';
    },


    loadImages: function(projection) {
        var url = apibase + 'images?';
        loadTiles('images', url, projection);
    },


    loadSigns: function(context, projection) {
        var url = apibase + 'objects?';
        loadTiles('objects', url, projection);

        // load traffic sign defs
        if (!mapillarySignDefs) {
            mapillarySignSprite = context.asset('img/traffic-signs/traffic-signs.png');
            mapillarySignDefs = {};
            d3.json(context.asset('img/traffic-signs/traffic-signs.json'), function(err, data) {
                if (err) return;
                mapillarySignDefs = data;
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


    parsePagination: parsePagination,


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
                    keyboard: false,
                    tag: true
                }
            };

            mapillaryViewer = new Mapillary.Viewer('mly', clientId, imageKey, opts);
            mapillaryViewer.on('nodechanged', nodeChanged);
        }

        // nodeChanged: called after the viewer has changed images and is ready.
        //
        // There is some logic here to batch up clicks into a mapillaryClicks array
        // because the user might click on a lot of markers quickly and nodechanged
        // may be called out of order asychronously.
        //
        // Clicks are added to the array in `selectedImage` and removed here.
        //
        function nodeChanged(node) {
            mapillaryViewer.getComponent('tag').removeAll();  // remove previous detections

            var clicks = mapillaryClicks;
            var index = clicks.indexOf(node.key);
            if (index > -1) {    // `nodechanged` initiated from clicking on a marker..
                clicks.splice(index, 1);
                // If `node.key` matches the current mapillaryImage, call `selectedImage()`
                // one more time to update the detections and attribution..
                if (node.key === mapillaryImage) {
                    that.selectedImage(node.key, false);
                }
            } else {             // `nodechanged` initiated from the Mapillary viewer controls..
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

        d3.selectAll('.layer-mapillary-images .viewfield-group')
            .classed('selected', function(d) {
                return d.key === imageKey;
            });

        d3.selectAll('.layer-mapillary-signs .icon-sign')
            .classed('selected', function(d) {
                return _.some(d.detections, function(detection) {
                    return detection.image_key === imageKey;
                });
            });

        if (!imageKey)  return this;


        function localeTimestamp(s) {
            if (!s) return null;
            var d = new Date(s);
            if (isNaN(d.getTime())) return null;
            return d.toLocaleString(undefined, { timeZone: 'UTC' });
        }

        var selected = d3.selectAll('.layer-mapillary-images .viewfield-group.selected');
        if (selected.empty()) return this;

        var datum = selected.datum();
        var timestamp = localeTimestamp(datum.captured_at);
        var attribution = d3.select('.mapillary-js-dom .Attribution');
        var capturedAt = attribution.selectAll('.captured-at');
        if (capturedAt.empty()) {
            attribution
                .append('span')
                .text('|');
            capturedAt = attribution
                .append('span')
                .attr('class', 'captured-at');
        }
        capturedAt
            .text(timestamp);

        this.updateDetections();

        return this;
    },


    updateDetections: function() {
        if (!mapillaryViewer) return;

        var detections = mapillaryCache.detections[mapillaryImage];
        _.each(detections, function(data, k) {
            if (_.isEmpty(data)) {
                loadDetection(k);
            } else {
                var tag = makeTag(data);
                if (tag) {
                    var tagComponent = mapillaryViewer.getComponent('tag');
                    tagComponent.add([tag]);
                }
            }
        });


        function loadDetection(detectionKey) {
            var url = apibase + 'detections/'+
                detectionKey + '?' + utilQsString({
                    client_id: clientId,
                });

            d3.request(url)
                .mimeType('application/json')
                .response(function(xhr) {
                    return JSON.parse(xhr.responseText);
                })
                .get(function(err, data) {
                    if (!data || !data.properties) return;

                    var ik = data.properties.image_key;
                    mapillaryCache.detections[ik][detectionKey] = data;

                    if (mapillaryImage === ik) {
                        var tag = makeTag(data);
                        if (tag) {
                            var tagComponent = mapillaryViewer.getComponent('tag');
                            tagComponent.add([tag]);
                        }
                    }
                });
        }


        function makeTag(data) {
            var valueParts = data.properties.value.split('--');
            if (valueParts.length !== 3) return;

            var text = valueParts[1].replace(/-/g, ' ');
            var tag;

            // Currently only two shapes <Polygon|Point>
            if (data.properties.shape.type === 'Polygon') {
                var polygonGeometry = new Mapillary
                    .TagComponent
                    .PolygonGeometry(data.properties.shape.coordinates[0]);

                tag = new Mapillary.TagComponent.OutlineTag(
                    data.properties.key,
                    polygonGeometry,
                    {
                        text: text,
                        textColor: 0xffff00,
                        lineColor: 0xffff00,
                        lineWidth: 2,
                        fillColor: 0xffff00,
                        fillOpacity: 0.3,
                    }
                );

            } else if (data.properties.shape.type === 'Point') {
                var pointGeometry = new Mapillary
                    .TagComponent
                    .PointGeometry(data.properties.shape.coordinates[0]);

                tag = new Mapillary.TagComponent.SpotTag(
                    data.properties.key,
                    pointGeometry,
                    {
                        text: text,
                        color: 0xffff00,
                        textColor: 0xffff00
                    }
                );
            }

            return tag;
        }
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
