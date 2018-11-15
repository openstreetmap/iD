/* global Mapillary:false */
import _find from 'lodash-es/find';
import _forEach from 'lodash-es/forEach';
import _some from 'lodash-es/some';
import _union from 'lodash-es/union';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { request as d3_request } from 'd3-request';
import {
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import rbush from 'rbush';

import { geoExtent, geoScaleToZoom } from '../geo';
import { svgDefs } from '../svg';
import { utilQsString, utilRebind, utilTiler } from '../util';


var apibase = 'https://a.mapillary.com/v3/';
var viewercss = 'mapillary-js/mapillary.min.css';
var viewerjs = 'mapillary-js/mapillary.min.js';
var clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi';
var maxResults = 1000;
var tileZoom = 14;
var tiler = utilTiler().zoomExtent([tileZoom, tileZoom]).skipNullIsland(true);
var dispatch = d3_dispatch('loadedImages', 'loadedSigns', 'bearingChanged');
var _mlyFallback = false;
var _mlyCache;
var _mlyClicks;
var _mlySelectedImage;
var _mlyViewer;


function abortRequest(i) {
    i.abort();
}


function maxPageAtZoom(z) {
    if (z < 15)   return 2;
    if (z === 15) return 5;
    if (z === 16) return 10;
    if (z === 17) return 20;
    if (z === 18) return 40;
    if (z > 18)   return 80;
}


function loadTiles(which, url, projection) {
    var currZoom = Math.floor(geoScaleToZoom(projection.scale()));
    var tiles = tiler.getTiles(projection);

    // abort inflight requests that are no longer needed
    var cache = _mlyCache[which];
    _forEach(cache.inflight, function(v, k) {
        var wanted = _find(tiles, function(tile) { return k.indexOf(tile.id + ',') === 0; });

        if (!wanted) {
            abortRequest(v);
            delete cache.inflight[k];
        }
    });

    tiles.forEach(function(tile) {
        loadNextTilePage(which, currZoom, url, tile);
    });
}


function loadNextTilePage(which, currZoom, url, tile) {
    var cache = _mlyCache[which];
    var rect = tile.extent.rectangle();
    var maxPages = maxPageAtZoom(currZoom);
    var nextPage = cache.nextPage[tile.id] || 0;
    var nextURL = cache.nextURL[tile.id] || url +
        utilQsString({
            per_page: maxResults,
            page: nextPage,
            client_id: clientId,
            bbox: [rect[0], rect[1], rect[2], rect[3]].join(','),
        });

    if (nextPage > maxPages) return;

    var id = tile.id + ',' + String(nextPage);
    if (cache.loaded[id] || cache.inflight[id]) return;
    cache.inflight[id] = d3_request(nextURL)
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
                var loc = feature.geometry.coordinates;
                var d;

                // An image (shown as a green dot on the map) is a single street photo with extra
                // information such as location, camera angle (CA), camera model, and so on.
                // Each image feature is a GeoJSON Point
                if (which === 'images') {
                    d = {
                        loc: loc,
                        key: feature.properties.key,
                        ca: feature.properties.ca,
                        captured_at: feature.properties.captured_at,
                        captured_by: feature.properties.username,
                        pano: feature.properties.pano
                    };

                    cache.forImageKey[d.key] = d;     // cache imageKey -> image

                // Mapillary organizes images as sequences. A sequence of images are continuously captured
                // by a user at a give time. Sequences are shown on the map as green lines.
                // Each sequence feature is a GeoJSON LineString
                } else if (which === 'sequences') {
                    var sequenceKey = feature.properties.key;
                    cache.lineString[sequenceKey] = feature;           // cache sequenceKey -> lineString
                    feature.properties.coordinateProperties.image_keys.forEach(function(imageKey) {
                        cache.forImageKey[imageKey] = sequenceKey;     // cache imageKey -> sequenceKey
                    });
                    return false;    // because no `d` data worth loading into an rbush

                // An image detection is a semantic pixel area on an image. The area could indicate
                // sky, trees, sidewalk in the image. A detection can be a polygon, a bounding box, or a point.
                // Each image_detection feature is a GeoJSON Point (located where the image was taken)
                } else if (which === 'image_detections') {
                    d = {
                        key: feature.properties.key,
                        image_key: feature.properties.image_key,
                        value: feature.properties.value,
                        package: feature.properties.package,
                        shape: feature.properties.shape
                    };

                    // cache imageKey -> image_detections
                    if (!cache.forImageKey[d.image_key]) {
                        cache.forImageKey[d.image_key] = [];
                    }
                    cache.forImageKey[d.image_key].push(d);
                    return false;    // because no `d` data worth loading into an rbush


                // A map feature is a real world object that can be shown on a map. It could be any object
                // recognized from images, manually added in images, or added on the map.
                // Each map feature is a GeoJSON Point (located where the feature is)
                } else if (which === 'map_features') {
                    d = {
                        loc: loc,
                        key: feature.properties.key,
                        value: feature.properties.value,
                        package: feature.properties.package,
                        detections: feature.properties.detections
                    };
                }

                return {
                    minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
                };

            }).filter(Boolean);

            if (cache.rtree && features) {
                cache.rtree.load(features);
            }

            if (which === 'images' || which === 'sequences') {
                dispatch.call('loadedImages');
            } else if (which === 'map_features') {
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



export default {

    init: function() {
        if (!_mlyCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
        var cache = _mlyCache;

        if (cache) {
            if (cache.images && cache.images.inflight) {
                _forEach(cache.images.inflight, abortRequest);
            }
            if (cache.image_detections && cache.image_detections.inflight) {
                _forEach(cache.image_detections.inflight, abortRequest);
            }
            if (cache.map_features && cache.map_features.inflight) {
                _forEach(cache.map_features.inflight, abortRequest);
            }
            if (cache.sequences && cache.sequences.inflight) {
                _forEach(cache.sequences.inflight, abortRequest);
            }
        }

        _mlyCache = {
            images: { inflight: {}, loaded: {}, nextPage: {}, nextURL: {}, rtree: rbush(), forImageKey: {} },
            image_detections: { inflight: {}, loaded: {}, nextPage: {}, nextURL: {}, forImageKey: {} },
            map_features: { inflight: {}, loaded: {}, nextPage: {}, nextURL: {}, rtree: rbush() },
            sequences: { inflight: {}, loaded: {}, nextPage: {}, nextURL: {}, rtree: rbush(), forImageKey: {}, lineString: {} }
        };

        _mlySelectedImage = null;
        _mlyClicks = [];
    },


    images: function(projection) {
        var limit = 5;
        return searchLimited(limit, projection, _mlyCache.images.rtree);
    },


    signs: function(projection) {
        var limit = 5;
        return searchLimited(limit, projection, _mlyCache.map_features.rtree);
    },


    sequences: function(projection) {
        var viewport = projection.clipExtent();
        var min = [viewport[0][0], viewport[1][1]];
        var max = [viewport[1][0], viewport[0][1]];
        var bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
        var sequenceKeys = {};

        // all sequences for images in viewport
        _mlyCache.images.rtree.search(bbox)
            .forEach(function(d) {
                var sequenceKey = _mlyCache.sequences.forImageKey[d.data.key];
                if (sequenceKey) {
                    sequenceKeys[sequenceKey] = true;
                }
            });

        // Return lineStrings for the sequences
        return Object.keys(sequenceKeys).map(function(sequenceKey) {
            return _mlyCache.sequences.lineString[sequenceKey];
        });
    },


    signsSupported: function() {
        return true;
    },


    loadImages: function(projection) {
        loadTiles('images', apibase + 'images?', projection);
        loadTiles('sequences', apibase + 'sequences?', projection);
    },


    loadSigns: function(context, projection) {
        // if we are looking at signs, we'll actually need to fetch images too
        loadTiles('images', apibase + 'images?', projection);
        loadTiles('map_features', apibase + 'map_features?layers=trafficsigns&min_nbr_image_detections=1&', projection);
        loadTiles('image_detections', apibase + 'image_detections?layers=trafficsigns&', projection);
    },


    loadViewer: function(context) {
        // add mly-wrapper
        var wrap = d3_select('#photoviewer').selectAll('.mly-wrapper')
            .data([0]);

        wrap.enter()
            .append('div')
            .attr('id', 'mly')
            .attr('class', 'photo-wrapper mly-wrapper')
            .classed('hide', true);

        // load mapillary-viewercss
        d3_select('head').selectAll('#mapillary-viewercss')
            .data([0])
            .enter()
            .append('link')
            .attr('id', 'mapillary-viewercss')
            .attr('rel', 'stylesheet')
            .attr('href', context.asset(viewercss));

        // load mapillary-viewerjs
        d3_select('head').selectAll('#mapillary-viewerjs')
            .data([0])
            .enter()
            .append('script')
            .attr('id', 'mapillary-viewerjs')
            .attr('src', context.asset(viewerjs));

        // load mapillary signs sprite
        var defs = context.container().select('defs');
        defs.call(svgDefs(context).addSprites, ['mapillary-sprite']);

        // Register viewer resize handler
        context.ui().photoviewer.on('resize', function() {
            if (_mlyViewer) {
                _mlyViewer.resize();
            }
        });
    },


    showViewer: function() {
        var wrap = d3_select('#photoviewer')
            .classed('hide', false);

        var isHidden = wrap.selectAll('.photo-wrapper.mly-wrapper.hide').size();

        if (isHidden && _mlyViewer) {
            wrap
                .selectAll('.photo-wrapper:not(.mly-wrapper)')
                .classed('hide', true);

            wrap
                .selectAll('.photo-wrapper.mly-wrapper')
                .classed('hide', false);

            _mlyViewer.resize();
        }

        return this;
    },


    hideViewer: function() {
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


    parsePagination: parsePagination,


    updateViewer: function(imageKey, context) {
        if (!imageKey) return this;

        if (!_mlyViewer) {
            this.initViewer(imageKey, context);
        } else {
            _mlyViewer.moveToKey(imageKey)
                .catch(function(e) { console.error('mly3', e); });  // eslint-disable-line no-console
        }

        return this;
    },


    initViewer: function(imageKey, context) {
        var that = this;
        if (window.Mapillary && imageKey) {
            var opts = {
                baseImageSize: 320,
                component: {
                    cover: false,
                    keyboard: false,
                    tag: true
                }
            };

            // Disable components requiring WebGL support
            if (!Mapillary.isSupported() && Mapillary.isFallbackSupported()) {
                _mlyFallback = true;
                opts.component = {
                    cover: false,
                    direction: false,
                    imagePlane: false,
                    keyboard: false,
                    mouse: false,
                    sequence: false,
                    tag: false,
                    image: true,        // fallback
                    navigation: true    // fallback
                };
            }

            _mlyViewer = new Mapillary.Viewer('mly', clientId, null, opts);
            _mlyViewer.on('nodechanged', nodeChanged);
            _mlyViewer.on('bearingchanged', bearingChanged);
            _mlyViewer.moveToKey(imageKey)
                .catch(function(e) { console.error('mly3', e); });  // eslint-disable-line no-console
        }

        // nodeChanged: called after the viewer has changed images and is ready.
        //
        // There is some logic here to batch up clicks into a _mlyClicks array
        // because the user might click on a lot of markers quickly and nodechanged
        // may be called out of order asychronously.
        //
        // Clicks are added to the array in `selectedImage` and removed here.
        //
        function nodeChanged(node) {
            if (!_mlyFallback) {
                _mlyViewer.getComponent('tag').removeAll();  // remove previous detections
            }

            var clicks = _mlyClicks;
            var index = clicks.indexOf(node.key);
            var selectedKey = _mlySelectedImage && _mlySelectedImage.key;

            if (index > -1) {              // `nodechanged` initiated from clicking on a marker..
                clicks.splice(index, 1);   // remove the click
                // If `node.key` matches the current _mlySelectedImage, call `selectImage()`
                // one more time to update the detections and attribution..
                if (node.key === selectedKey) {
                    that.selectImage(_mlySelectedImage, node.key, true);
                }
            } else {             // `nodechanged` initiated from the Mapillary viewer controls..
                var loc = node.computedLatLon ? [node.computedLatLon.lon, node.computedLatLon.lat] : [node.latLon.lon, node.latLon.lat];
                context.map().centerEase(loc);
                that.selectImage(undefined, node.key, true);
            }
        }

        function bearingChanged(e) {
            dispatch.call('bearingChanged', undefined, e);
        }
    },


    // Pass the image datum itself in `d` or the `imageKey` string.
    // This allows images to be selected from places that dont have access
    // to the full image datum (like the street signs layer or the js viewer)
    selectImage: function(d, imageKey, fromViewer) {
        if (!d && imageKey) {
            // If the user clicked on something that's not an image marker, we
            // might get in here.. Cache lookup can fail, e.g. if the user
            // clicked a streetsign, but images are loading slowly asynchronously.
            // We'll try to carry on anyway if there is no datum.  There just
            // might be a delay before user sees detections, captured_at, etc.
            d = _mlyCache.images.forImageKey[imageKey];
        }

        _mlySelectedImage = d;
        var viewer = d3_select('#photoviewer');
        if (!viewer.empty()) viewer.datum(d);

        imageKey = (d && d.key) || imageKey;
        if (!fromViewer && imageKey) {
            _mlyClicks.push(imageKey);
        }

        this.setStyles(null, true);

        // if signs signs are shown, highlight the ones that appear in this image
        d3_selectAll('.layer-mapillary-signs .icon-sign')
            .classed('selected', function(d) {
                return _some(d.detections, function(detection) {
                    return detection.image_key === imageKey;
                });
            });

        if (d) {
            this.updateDetections(d);
        }

        return this;
    },


    getSelectedImage: function() {
        return _mlySelectedImage;
    },


    getSequenceKeyForImage: function(d) {
        var imageKey = d && d.key;
        return imageKey && _mlyCache.sequences.forImageKey[imageKey];
    },


    setStyles: function(hovered, reset) {
        if (reset) {  // reset all layers
            d3_selectAll('.viewfield-group')
                .classed('highlighted', false)
                .classed('hovered', false)
                .classed('selected', false);

            d3_selectAll('.sequence')
                .classed('highlighted', false)
                .classed('selected', false);
        }

        var hoveredImageKey = hovered && hovered.key;
        var hoveredSequenceKey = this.getSequenceKeyForImage(hovered);
        var hoveredLineString = hoveredSequenceKey && _mlyCache.sequences.lineString[hoveredSequenceKey];
        var hoveredImageKeys = (hoveredLineString && hoveredLineString.properties.coordinateProperties.image_keys) || [];

        var viewer = d3_select('#photoviewer');
        var selected = viewer.empty() ? undefined : viewer.datum();
        var selectedImageKey = selected && selected.key;
        var selectedSequenceKey = this.getSequenceKeyForImage(selected);
        var selectedLineString = selectedSequenceKey && _mlyCache.sequences.lineString[selectedSequenceKey];
        var selectedImageKeys = (selectedLineString && selectedLineString.properties.coordinateProperties.image_keys) || [];

        // highlight sibling viewfields on either the selected or the hovered sequences
        var highlightedImageKeys = _union(hoveredImageKeys, selectedImageKeys);

        d3_selectAll('.layer-mapillary-images .viewfield-group')
            .classed('highlighted', function(d) { return highlightedImageKeys.indexOf(d.key) !== -1; })
            .classed('hovered', function(d) { return d.key === hoveredImageKey; })
            .classed('selected', function(d) { return d.key === selectedImageKey; });

        d3_selectAll('.layer-mapillary-images .sequence')
            .classed('highlighted', function(d) { return d.properties.key === hoveredSequenceKey; })
            .classed('selected', function(d) { return d.properties.key === selectedSequenceKey; });

        // update viewfields if needed
        d3_selectAll('.viewfield-group .viewfield')
            .attr('d', viewfieldPath);

        function viewfieldPath() {
            var d = this.parentNode.__data__;
            if (d.pano && d.key !== selectedImageKey) {
                return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
            } else {
                return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
            }
        }

        return this;
    },


    updateDetections: function(d) {
        if (!_mlyViewer || _mlyFallback) return;

        var imageKey = d && d.key;
        if (!imageKey) return;

        var detections = _mlyCache.image_detections.forImageKey[imageKey] || [];
        detections.forEach(function(data) {
            var tag = makeTag(data);
            if (tag) {
                var tagComponent = _mlyViewer.getComponent('tag');
                tagComponent.add([tag]);
            }
        });

        function makeTag(data) {
            var valueParts = data.value.split('--');
            if (valueParts.length !== 3) return;

            var text = valueParts[1].replace(/-/g, ' ');
            var tag;

            // Currently only two shapes <Polygon|Point>
            if (data.shape.type === 'Polygon') {
                var polygonGeometry = new Mapillary
                    .TagComponent
                    .PolygonGeometry(data.shape.coordinates[0]);

                tag = new Mapillary.TagComponent.OutlineTag(
                    data.key,
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

            } else if (data.shape.type === 'Point') {
                var pointGeometry = new Mapillary
                    .TagComponent
                    .PointGeometry(data.shape.coordinates[0]);

                tag = new Mapillary.TagComponent.SpotTag(
                    data.key,
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


    cache: function() {
        return _mlyCache;
    }

};
