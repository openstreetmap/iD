/* global mapillary:false */
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import Protobuf from 'pbf';
import RBush from 'rbush';
import { VectorTile } from '@mapbox/vector-tile';

import { geoExtent, geoScaleToZoom } from '../geo';
import { utilQsString, utilRebind, utilTiler, utilStringQs } from '../util';

const accessToken = 'MLY|4100327730013843|5bb78b81720791946a9a7b956c57b7cf';
const apiUrl = 'https://graph.mapillary.com/';
const baseTileUrl = 'https://tiles.mapillary.com/maps/vtp';
const mapFeatureTileUrl = `${baseTileUrl}/mly_map_feature_point/2/{z}/{x}/{y}?access_token=${accessToken}`;
const tileUrl = `${baseTileUrl}/mly1_public/2/{z}/{x}/{y}?access_token=${accessToken}`;
const trafficSignTileUrl = `${baseTileUrl}/mly_map_feature_traffic_sign/2/{z}/{x}/{y}?access_token=${accessToken}`;

const viewercss = 'mapillary-js/mapillary.css';
const viewerjs = 'mapillary-js/mapillary.js';
const minZoom = 14;
const dispatch = d3_dispatch('change', 'loadedImages', 'loadedSigns', 'loadedMapFeatures', 'bearingChanged', 'imageChanged');

let _loadViewerPromise;
let _mlyActiveImage;
let _mlyCache;
let _mlyFallback = false;
let _mlyHighlightedDetection;
let _mlyShowFeatureDetections = false;
let _mlyShowSignDetections = false;
let _mlyViewer;
let _mlyViewerFilter = ['all'];


// Load all data for the specified type from Mapillary vector tiles
function loadTiles(which, url, maxZoom, projection) {
    const tiler = utilTiler().zoomExtent([minZoom, maxZoom]).skipNullIsland(true);
    const tiles = tiler.getTiles(projection);

    tiles.forEach(function(tile) {
        loadTile(which, url, tile);
    });
}


// Load all data for the specified type from one vector tile
function loadTile(which, url, tile) {
    const cache = _mlyCache.requests;
    const tileId = `${tile.id}-${which}`;
    if (cache.loaded[tileId] || cache.inflight[tileId]) return;
    const controller = new AbortController();
    cache.inflight[tileId] = controller;
    const requestUrl = url.replace('{x}', tile.xyz[0])
        .replace('{y}', tile.xyz[1])
        .replace('{z}', tile.xyz[2]);

    fetch(requestUrl, { signal: controller.signal })
        .then(function(response) {
            if (!response.ok) {
                throw new Error(response.status + ' ' + response.statusText);
            }
            cache.loaded[tileId] = true;
            delete cache.inflight[tileId];
            return response.arrayBuffer();
        })
        .then(function(data) {
            if (!data) {
                throw new Error('No Data');
            }
            loadTileDataToCache(data, tile, which);

            if (which === 'images') {
                dispatch.call('loadedImages');
            } else if (which === 'signs') {
                dispatch.call('loadedSigns');
            } else if (which === 'points') {
                dispatch.call('loadedMapFeatures');
            }
        })
        .catch(function() {
            cache.loaded[tileId] = true;
            delete cache.inflight[tileId];
        });
}


// Load the data from the vector tile into cache
function loadTileDataToCache(data, tile, which) {
    const vectorTile = new VectorTile(new Protobuf(data));
    let features,
        cache,
        layer,
        i,
        feature,
        loc,
        d;

    if (vectorTile.layers.hasOwnProperty('image')) {
        features = [];
        cache = _mlyCache.images;
        layer = vectorTile.layers.image;

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            loc = feature.geometry.coordinates;
            d = {
                loc: loc,
                captured_at: feature.properties.captured_at,
                ca: feature.properties.compass_angle,
                id: feature.properties.id,
                is_pano: feature.properties.is_pano,
                sequence_id: feature.properties.sequence_id,
            };
            cache.forImageId[d.id] = d;
            features.push({
                minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
            });
        }
        if (cache.rtree) {
            cache.rtree.load(features);
        }
    }

    if (vectorTile.layers.hasOwnProperty('sequence')) {
        features = [];
        cache = _mlyCache.sequences;
        layer = vectorTile.layers.sequence;

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            if (cache.lineString[feature.properties.id]) {
                cache.lineString[feature.properties.id].push(feature);
            } else {
                cache.lineString[feature.properties.id] = [feature];
            }
        }
    }

    if (vectorTile.layers.hasOwnProperty('point')) {
        features = [];
        cache = _mlyCache[which];
        layer = vectorTile.layers.point;

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            loc = feature.geometry.coordinates;

            d = {
                loc: loc,
                id: feature.properties.id,
                first_seen_at: feature.properties.first_seen_at,
                last_seen_at: feature.properties.last_seen_at,
                value: feature.properties.value
            };
            features.push({
                minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
            });
        }
        if (cache.rtree) {
            cache.rtree.load(features);
        }
    }

    if (vectorTile.layers.hasOwnProperty('traffic_sign')) {
        features = [];
        cache = _mlyCache[which];
        layer = vectorTile.layers.traffic_sign;

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            loc = feature.geometry.coordinates;

            d = {
                loc: loc,
                id: feature.properties.id,
                first_seen_at: feature.properties.first_seen_at,
                last_seen_at: feature.properties.last_seen_at,
                value: feature.properties.value
            };
            features.push({
                minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
            });
        }
        if (cache.rtree) {
            cache.rtree.load(features);
        }
    }
}


// Get data from the API
function loadData(url) {
    return fetch(url)
        .then(function(response) {
            if (!response.ok) {
                throw new Error(response.status + ' ' + response.statusText);
            }
            return response.json();
        })
        .then(function(result) {
            if (!result) {
                return [];
            }
            return result.data || [];
        });
}


// Partition viewport into higher zoom tiles
function partitionViewport(projection) {
    const z = geoScaleToZoom(projection.scale());
    const z2 = (Math.ceil(z * 2) / 2) + 2.5;   // round to next 0.5 and add 2.5
    const tiler = utilTiler().zoomExtent([z2, z2]);

    return tiler.getTiles(projection)
        .map(function(tile) { return tile.extent; });
}


// Return no more than `limit` results per partition.
function searchLimited(limit, projection, rtree) {
    limit = limit || 5;

    return partitionViewport(projection)
        .reduce(function(result, extent) {
            const found = rtree.search(extent.bbox())
                .slice(0, limit)
                .map(function(d) { return d.data; });

            return (found.length ? result.concat(found) : result);
        }, []);
}


export default {
    // Initialize Mapillary
    init: function() {
        if (!_mlyCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    // Reset cache and state
    reset: function() {
        if (_mlyCache) {
            Object.values(_mlyCache.requests.inflight).forEach(function(request) { request.abort(); });
        }

        _mlyCache = {
            images: { rtree: new RBush(), forImageId: {} },
            image_detections: { forImageId: {} },
            signs: { rtree: new RBush() },
            points: { rtree: new RBush() },
            sequences: { rtree: new RBush(), lineString: {} },
            requests: { loaded: {}, inflight: {} }
        };

        _mlyActiveImage = null;
    },

    // Get visible images
    images: function(projection) {
        const limit = 5;
        return searchLimited(limit, projection, _mlyCache.images.rtree);
    },

    // Get visible traffic signs
    signs: function(projection) {
        const limit = 5;
        return searchLimited(limit, projection, _mlyCache.signs.rtree);
    },

    // Get visible map (point) features
    mapFeatures: function(projection) {
        const limit = 5;
        return searchLimited(limit, projection, _mlyCache.points.rtree);
    },

    // Get cached image by id
    cachedImage: function(imageId) {
        return _mlyCache.images.forImageId[imageId];
    },

    // Get visible sequences
    sequences: function(projection) {
        const viewport = projection.clipExtent();
        const min = [viewport[0][0], viewport[1][1]];
        const max = [viewport[1][0], viewport[0][1]];
        const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
        const sequenceIds = {};
        let lineStrings = [];

        _mlyCache.images.rtree.search(bbox)
            .forEach(function(d) {
                if (d.data.sequence_id) {
                    sequenceIds[d.data.sequence_id] = true;
                }
            });

        Object.keys(sequenceIds).forEach(function(sequenceId) {
            if (_mlyCache.sequences.lineString[sequenceId]) {
                lineStrings = lineStrings.concat(_mlyCache.sequences.lineString[sequenceId]);
            }
        });

        return lineStrings;
    },


    // Load images in the visible area
    loadImages: function(projection) {
        loadTiles('images', tileUrl, 14, projection);
    },


    // Load traffic signs in the visible area
    loadSigns: function(projection) {
        loadTiles('signs', trafficSignTileUrl, 14, projection);
    },


    // Load map (point) features in the visible area
    loadMapFeatures: function(projection) {
        loadTiles('points', mapFeatureTileUrl, 14, projection);
    },


    // Return a promise that resolves when the image viewer (Mapillary JS) library has finished loading
    ensureViewerLoaded: function(context) {
        if (_loadViewerPromise) return _loadViewerPromise;

        // add mly-wrapper
        const wrap = context.container().select('.photoviewer')
            .selectAll('.mly-wrapper')
            .data([0]);

        wrap.enter()
            .append('div')
            .attr('id', 'ideditor-mly')
            .attr('class', 'photo-wrapper mly-wrapper')
            .classed('hide', true);

        const that = this;

        _loadViewerPromise = new Promise((resolve, reject) => {
            let loadedCount = 0;
            function loaded() {
                loadedCount += 1;

                // wait until both files are loaded
                if (loadedCount === 2) resolve();
            }

            const head = d3_select('head');

            // load mapillary-viewercss
            head.selectAll('#ideditor-mapillary-viewercss')
                .data([0])
                .enter()
                .append('link')
                .attr('id', 'ideditor-mapillary-viewercss')
                .attr('rel', 'stylesheet')
                .attr('crossorigin', 'anonymous')
                .attr('href', context.asset(viewercss))
                .on('load.serviceMapillary', loaded)
                .on('error.serviceMapillary', function() {
                    reject();
                });

            // load mapillary-viewerjs
            head.selectAll('#ideditor-mapillary-viewerjs')
                .data([0])
                .enter()
                .append('script')
                .attr('id', 'ideditor-mapillary-viewerjs')
                .attr('crossorigin', 'anonymous')
                .attr('src', context.asset(viewerjs))
                .on('load.serviceMapillary', loaded)
                .on('error.serviceMapillary', function() {
                    reject();
                });
        })
        .catch(function() {
            _loadViewerPromise = null;
        })
        .then(function() {
            that.initViewer(context);
        });

        return _loadViewerPromise;
    },


    // Load traffic sign image sprites
    loadSignResources: function(context) {
        context.ui().svgDefs.addSprites(['mapillary-sprite'], false /* don't override colors */ );
        return this;
    },


    // Load map (point) feature image sprites
    loadObjectResources: function(context) {
        context.ui().svgDefs.addSprites(['mapillary-object-sprite'], false /* don't override colors */ );
        return this;
    },


    // Remove previous detections in image viewer
    resetTags: function() {
        if (_mlyViewer && !_mlyFallback) {
            _mlyViewer.getComponent('tag').removeAll();
        }
    },


    // Show map feature detections in image viewer
    showFeatureDetections: function(value) {
        _mlyShowFeatureDetections = value;
        if (!_mlyShowFeatureDetections && !_mlyShowSignDetections) {
            this.resetTags();
        }
    },


    // Show traffic sign detections in image viewer
    showSignDetections: function(value) {
        _mlyShowSignDetections = value;
        if (!_mlyShowFeatureDetections && !_mlyShowSignDetections) {
            this.resetTags();
        }
    },


    // Apply filter to image viewer
    filterViewer: function(context) {
        const showsPano = context.photos().showsPanoramic();
        const showsFlat = context.photos().showsFlat();
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();
        const filter = ['all'];

        if (!showsPano) filter.push([ '!=', 'cameraType', 'spherical' ]);
        if (!showsFlat && showsPano) filter.push(['==', 'pano', true]);
        if (fromDate) {
            filter.push(['>=', 'capturedAt', new Date(fromDate).getTime()]);
        }
        if (toDate) {
            filter.push(['>=', 'capturedAt', new Date(toDate).getTime()]);
        }

        if (_mlyViewer) {
            _mlyViewer.setFilter(filter);
        }
        _mlyViewerFilter = filter;

        return filter;
    },


    // Make the image viewer visible
    showViewer: function(context) {
        const wrap = context.container().select('.photoviewer')
            .classed('hide', false);

        const isHidden = wrap.selectAll('.photo-wrapper.mly-wrapper.hide').size();

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


    // Hide the image viewer and resets map markers
    hideViewer: function(context) {
        _mlyActiveImage = null;

        if (!_mlyFallback && _mlyViewer) {
            _mlyViewer.getComponent('sequence').stop();
        }

        const viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(null);

        viewer
            .classed('hide', true)
            .selectAll('.photo-wrapper')
            .classed('hide', true);

        this.updateUrlImage(null);

        dispatch.call('imageChanged');
        dispatch.call('loadedMapFeatures');
        dispatch.call('loadedSigns');

        return this.setStyles(context, null);
    },


    // Update the URL with current image id
    updateUrlImage: function(imageId) {
        if (!window.mocha) {
            const hash = utilStringQs(window.location.hash);
            if (imageId) {
                hash.photo = 'mapillary/' + imageId;
            } else {
                delete hash.photo;
            }
            window.location.replace('#' + utilQsString(hash, true));
        }
    },


    // Highlight the detection in the viewer that is related to the clicked map feature
    highlightDetection: function(detection) {
        if (detection) {
            _mlyHighlightedDetection = detection.id;
        }

        return this;
    },


    // Initialize image viewer (Mapillar JS)
    initViewer: function(context) {
        const that = this;
        if (!window.mapillary) return;

        const opts = {
            accessToken: accessToken,
            component: {
                cover: false,
                keyboard: false,
                tag: true
            },
            container: 'ideditor-mly',
        };

        // Disable components requiring WebGL support
        if (!mapillary.isSupported() && mapillary.isFallbackSupported()) {
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

        _mlyViewer = new mapillary.Viewer(opts);
        _mlyViewer.on('image', imageChanged);
        _mlyViewer.on('bearing', bearingChanged);

        if (_mlyViewerFilter) {
            _mlyViewer.setFilter(_mlyViewerFilter);
        }

        // Register viewer resize handler
        context.ui().photoviewer.on('resize.mapillary', function() {
            if (_mlyViewer) _mlyViewer.resize();
        });

        // imageChanged: called after the viewer has changed images and is ready.
        function imageChanged(node) {
            that.resetTags();
            const image = node.image;
            that.setActiveImage(image);
            that.setStyles(context, null);
            const loc = [image.originalLngLat.lng, image.originalLngLat.lat];
            context.map().centerEase(loc);
            that.updateUrlImage(image.id);

            if (_mlyShowFeatureDetections || _mlyShowSignDetections) {
                that.updateDetections(image.id, `${apiUrl}/${image.id}/detections?access_token=${accessToken}&fields=id,image,geometry,value`);
            }
            dispatch.call('imageChanged');
        }


        // bearingChanged: called when the bearing changes in the image viewer.
        function bearingChanged(e) {
            dispatch.call('bearingChanged', undefined, e);
        }
    },


    // Move to an image
    selectImage: function(context, imageId) {
        if (_mlyViewer && imageId) {
            _mlyViewer.moveTo(imageId)
                .catch(function(e) {
                    console.error('mly3', e); // eslint-disable-line no-console
                });
        }

        return this;
    },


    // Return the currently displayed image
    getActiveImage: function() {
        return _mlyActiveImage;
    },


    // Return a list of detection objects for the given id
    getDetections: function(id) {
        return loadData(`${apiUrl}/${id}/detections?access_token=${accessToken}&fields=id,value,image`);
    },


    // Set the currently visible image
    setActiveImage: function(image) {
        if (image) {
            _mlyActiveImage = {
                ca: image.originalCompassAngle,
                id: image.id,
                loc: [image.originalLngLat.lng, image.originalLngLat.lat],
                is_pano: image.cameraType === 'spherical',
                sequence_id: image.sequenceId
            };
        } else {
            _mlyActiveImage = null;
        }
    },


    // Update the currently highlighted sequence and selected bubble.
    setStyles: function(context, hovered) {
        const hoveredImageId = hovered && hovered.id;
        const hoveredSequenceId = hovered && hovered.sequence_id;
        const selectedSequenceId = _mlyActiveImage && _mlyActiveImage.sequence_id;

        context.container().selectAll('.layer-mapillary .viewfield-group')
            .classed('highlighted', function(d) { return (d.sequence_id === selectedSequenceId) || (d.id === hoveredImageId); })
            .classed('hovered', function(d) { return d.id === hoveredImageId; });

        context.container().selectAll('.layer-mapillary .sequence')
            .classed('highlighted', function(d) { return d.properties.id === hoveredSequenceId; })
            .classed('currentView', function(d) { return d.properties.id === selectedSequenceId; });

        return this;
    },


    // Get detections for the current image and shows them in the image viewer
    updateDetections: function(imageId, url) {
        if (!_mlyViewer || _mlyFallback) return;
        if (!imageId) return;
        const cache = _mlyCache.image_detections;
        if (cache.forImageId[imageId]) {
            showDetections(_mlyCache.image_detections.forImageId[imageId]);
        } else {
            loadData(url)
                .then(detections => {
                    detections.forEach(function(detection) {
                        if (!cache.forImageId[imageId]) {
                            cache.forImageId[imageId] = [];
                        }
                        cache.forImageId[imageId].push({
                            geometry: detection.geometry,
                            id: detection.id,
                            image_id: imageId,
                            value:detection.value
                        });
                    });

                    showDetections(_mlyCache.image_detections.forImageId[imageId] || []);
                });
        }


        // Create a tag for each detection and shows it in the image viewer
        function showDetections(detections) {
            const tagComponent = _mlyViewer.getComponent('tag');
            detections.forEach(function(data) {
                const tag = makeTag(data);
                if (tag) {
                    tagComponent.add([tag]);
                }
            });
        }


        // Create a Mapillary JS tag object
        function makeTag(data) {
            const valueParts = data.value.split('--');
            if (!valueParts.length) return;

            let tag;
            let text;
            let color = 0xffffff;

            if (_mlyHighlightedDetection === data.id) {
                color = 0xffff00;
                text = valueParts[1];
                if (text === 'flat' || text === 'discrete' || text === 'sign') {
                    text = valueParts[2];
                }
                text = text.replace(/-/g, ' ');
                text = text.charAt(0).toUpperCase() + text.slice(1);
                _mlyHighlightedDetection = null;
            }

            var decodedGeometry = window.atob(data.geometry);
            var uintArray = new Uint8Array(decodedGeometry.length);
            for (var i = 0; i < decodedGeometry.length; i++) {
                uintArray[i] = decodedGeometry.charCodeAt(i);
            }
            const tile = new VectorTile(new Protobuf(uintArray.buffer));
            const layer = tile.layers['mpy-or'];

            const geometries = layer.feature(0).loadGeometry();

            const polygon = geometries.map(ring =>
                ring.map(point =>
                    [point.x / layer.extent, point.y / layer.extent]));

            tag = new mapillary.OutlineTag(
                data.id,
                new mapillary.PolygonGeometry(polygon[0]),
                {
                    text: text,
                    textColor: color,
                    lineColor: color,
                    lineWidth: 2,
                    fillColor: color,
                    fillOpacity: 0.3,
                }
            );

            return tag;
        }
    },


    // Return the current cache
    cache: function() {
        return _mlyCache;
    }
};
