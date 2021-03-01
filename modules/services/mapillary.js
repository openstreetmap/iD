/* global Mapillary:false */
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import Protobuf from 'pbf';
import RBush from 'rbush';
import vt from '@mapbox/vector-tile';

import { geoExtent, geoScaleToZoom } from '../geo';
import { utilQsString, utilRebind, utilTiler, utilStringQs } from '../util';

const imageDetectionUrl = 'https://a.mapillary.com/v3/image_detections';
const tileUrl = 'https://tiles3.mapillary.com/v0.1/{z}/{x}/{y}.mvt';
const mapFeatureTileUrl = 'https://a.mapillary.com/v3/tiles/map_features/{z}/{x}/{y}.mvt';
const clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzo1ZWYyMmYwNjdmNDdlNmVi';
const mapFeatureValues = [
    'construction--flat--crosswalk-plain',
    'marking--discrete--crosswalk-zebra',
    'object--banner',
    'object--bench',
    'object--bike-rack',
    'object--billboard',
    'object--catch-basin',
    'object--cctv-camera',
    'object--fire-hydrant',
    'object--mailbox',
    'object--manhole',
    'object--phone-booth',
    'object--sign--advertisement',
    'object--sign--information',
    'object--sign--store',
    'object--street-light',
    'object--support--utility-pole',
    'object--traffic-light--*',
    'object--traffic-light--pedestrians',
    'object--trash-can'
].join(',');

const viewercss = 'mapillary-js/mapillary.min.css';
const viewerjs = 'mapillary-js/mapillary.min.js';
const minZoom = 14;
const dispatch = d3_dispatch('change', 'loadedImages', 'loadedSigns', 'loadedMapFeatures', 'bearingChanged', 'nodeChanged');

let _loadViewerPromise;
let _mlyActiveImage;
let _mlyCache;
let _mlyClicks;
let _mlyFallback = false;
let _mlyHighlightedDetection;
let _mlyShowFeatureDetections = false;
let _mlyShowSignDetections = false;
let _mlyViewer;
let _mlyViewerFilter = ['all'];

function abortRequest(controller) {
    controller.abort();
}


function loadTiles(which, url, maxZoom, projection) {
    const tiler = utilTiler().zoomExtent([minZoom, maxZoom]).skipNullIsland(true);
    const tiles = tiler.getTiles(projection);

    tiles.forEach(function(tile) {
        loadTile(which, url, tile);
    });
}


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
            } else if (which === 'map_features') {
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


function loadTileDataToCache(data, tile, which) {
    const vectorTile = new vt.VectorTile(new Protobuf(data));
    let features,
        cache,
        layer,
        i,
        feature,
        loc,
        d;

    if (vectorTile.layers.hasOwnProperty('mapillary-images')) {
        features = [];
        cache = _mlyCache.images;
        layer = vectorTile.layers['mapillary-images'];

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            loc = feature.geometry.coordinates;
            d = {
                loc: loc,
                key: feature.properties.key,
                ca: feature.properties.ca,
                captured_at: feature.properties.captured_at,
                captured_by: feature.properties.userkey,
                pano: feature.properties.pano,
                skey: feature.properties.skey,
            };
            cache.forImageKey[d.key] = d;
            features.push({
                minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
            });
        }
        if (cache.rtree) {
            cache.rtree.load(features);
        }
    }

    if (vectorTile.layers.hasOwnProperty('mapillary-sequences')) {
        features = [];
        cache = _mlyCache.sequences;
        layer = vectorTile.layers['mapillary-sequences'];

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            if (cache.lineString[feature.properties.key]) {
                cache.lineString[feature.properties.key].push(feature);
            } else {
                cache.lineString[feature.properties.key] = [feature];
            }
        }
    }

    if (vectorTile.layers.hasOwnProperty('mapillary-map-features')) {
        features = [];
        cache = _mlyCache[which];
        layer = vectorTile.layers['mapillary-map-features'];

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            loc = feature.geometry.coordinates;
            d = {
                loc: loc,
                key: feature.properties.key,
                value: feature.properties.value,
                detections: JSON.parse(feature.properties.detections),
                first_seen_at: feature.properties.first_seen_at,
                last_seen_at: feature.properties.last_seen_at
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


function loadData(which, url) {
    const cache = _mlyCache[which];
    const options = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };

    return fetch(url, options)
        .then(function(response) {
            if (!response.ok) {
                throw new Error(response.status + ' ' + response.statusText);
            }
            return response.json();
        })
        .then(function(data) {
            if (!data || !data.features || !data.features.length) {
                throw new Error('No Data');
            }

            data.features.forEach(function(feature) {
                if (which === 'image_detections') {
                    const imageKey = feature.properties.image_key;
                    if (!cache.forImageKey[imageKey]) {
                        cache.forImageKey[imageKey] = [];
                    }
                    cache.forImageKey[imageKey].push({
                        key: feature.properties.key,
                        image_key: feature.properties.image_key,
                        value: feature.properties.value,
                        shape: feature.properties.shape
                    });
                }
            });
        });
}


// partition viewport into higher zoom tiles
function partitionViewport(projection) {
    const z = geoScaleToZoom(projection.scale());
    const z2 = (Math.ceil(z * 2) / 2) + 2.5;   // round to next 0.5 and add 2.5
    const tiler = utilTiler().zoomExtent([z2, z2]);

    return tiler.getTiles(projection)
        .map(function(tile) { return tile.extent; });
}


// no more than `limit` results per partition.
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
    // initialize Mapillary
    init: function() {
        if (!_mlyCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    // reset cache and state
    reset: function() {
        if (_mlyCache) {
            Object.values(_mlyCache.requests.inflight).forEach(abortRequest);
        }

        _mlyCache = {
            images: { rtree: new RBush(), forImageKey: {} },
            image_detections: { forImageKey: {} },
            map_features: { rtree: new RBush() },
            points: { rtree: new RBush() },
            sequences: { rtree: new RBush(), lineString: {} },
            requests: { loaded: {}, inflight: {} }
        };

        _mlyActiveImage = null;
        _mlyClicks = [];
    },

    // get visible images
    images: function(projection) {
        const limit = 5;
        return searchLimited(limit, projection, _mlyCache.images.rtree);
    },

    /**
     * get visible traffic signs
     */
    signs: function(projection) {
        const limit = 5;
        return searchLimited(limit, projection, _mlyCache.map_features.rtree);
    },

    // get visible map (point) features
    mapFeatures: function(projection) {
        const limit = 5;
        return searchLimited(limit, projection, _mlyCache.points.rtree);
    },

    // get cached image by key
    cachedImage: function(imageKey) {
        return _mlyCache.images.forImageKey[imageKey];
    },

    // get visible sequences
    sequences: function(projection) {
        const viewport = projection.clipExtent();
        const min = [viewport[0][0], viewport[1][1]];
        const max = [viewport[1][0], viewport[0][1]];
        const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
        const sequenceKeys = {};
        let lineStrings = [];
        // find sequences for images in viewport
        _mlyCache.images.rtree.search(bbox)
            .forEach(function(d) {
                if (d.data.skey) {
                    sequenceKeys[d.data.skey] = true;
                }
            });

        Object.keys(sequenceKeys).forEach(function(sequenceKey) {
            lineStrings = lineStrings.concat(_mlyCache.sequences.lineString[sequenceKey]);
        });

        return lineStrings;
    },


    loadImages: function(projection) {
        loadTiles('images', tileUrl, 14, projection);
    },


    loadSigns: function(projection) {
        loadTiles('map_features', `${mapFeatureTileUrl}?layers=trafficsigns&per_page=1000&client_id=${clientId}`, 18, projection);
    },


    loadMapFeatures: function(projection) {
        loadTiles('points', `${mapFeatureTileUrl}?layers=points&per_page=1000&client_id=${clientId}`, 18, projection);
    },


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


    loadSignResources: function(context) {
        context.ui().svgDefs.addSprites(['mapillary-sprite'], false /* don't override colors */ );
        return this;
    },


    loadObjectResources: function(context) {
        context.ui().svgDefs.addSprites(['mapillary-object-sprite'], false /* don't override colors */ );
        return this;
    },


    // remove previous detections in viewer
    resetTags: function() {
        if (_mlyViewer && !_mlyFallback) {
            _mlyViewer.getComponent('tag').removeAll();
        }
    },


    // show map feature detections in viewer
    showFeatureDetections: function(value) {
        _mlyShowFeatureDetections = value;
        if (!_mlyShowFeatureDetections && !_mlyShowSignDetections) {
            this.resetTags();
        }
    },


    // show traffic sign detections in viewer
    showSignDetections: function(value) {
        _mlyShowSignDetections = value;
        if (!_mlyShowFeatureDetections && !_mlyShowSignDetections) {
            this.resetTags();
        }
    },


    // apply filter to viewer
    filterViewer: function(context) {
        const showsPano = context.photos().showsPanoramic();
        const showsFlat = context.photos().showsFlat();
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();
        const filter = ['all'];

        if (!showsPano) filter.push(['==', 'pano', false]);
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

        dispatch.call('nodeChanged');
        dispatch.call('loadedMapFeatures');
        dispatch.call('loadedSigns');

        return this.setStyles(context, null, true);
    },


    // update the URL with current image key
    updateUrlImage: function(imageKey) {
        if (!window.mocha) {
            const hash = utilStringQs(window.location.hash);
            if (imageKey) {
                hash.photo = 'mapillary/' + imageKey;
            } else {
                delete hash.photo;
            }
            window.location.replace('#' + utilQsString(hash, true));
        }
    },


    // highlight the detection in the viewer that is related to the clicked map feature
    highlightDetection: function(detection) {
        if (detection) {
            _mlyHighlightedDetection = detection.detection_key;
        }

        return this;
    },


    initViewer: function(context) {
        const that = this;
        if (!window.Mapillary) return;

        var opts = {
            apiClient: clientId,
            container: 'ideditor-mly',
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

        _mlyViewer = new Mapillary.Viewer(opts);
        _mlyViewer.on('nodechanged', nodeChanged);
        _mlyViewer.on('bearingchanged', bearingChanged);
        if (_mlyViewerFilter) {
            _mlyViewer.setFilter(_mlyViewerFilter);
        }

        // Register viewer resize handler
        context.ui().photoviewer.on('resize.mapillary', function() {
            if (_mlyViewer) _mlyViewer.resize();
        });

        // nodeChanged: called after the viewer has changed images and is ready.
        //
        // There is some logic here to batch up clicks into a _mlyClicks array
        // because the user might click on a lot of markers quickly and nodechanged
        // may be called out of order asynchronously.
        //
        // Clicks are added to the array in `selectedImage` and removed here.
        //
        function nodeChanged(node) {
            that.resetTags();
            const clicks = _mlyClicks;
            const index = clicks.indexOf(node.key);
            that.setActiveImage(node);
            that.setStyles(context, null, true);

            if (index > -1) {              // `nodechanged` initiated from clicking on a marker..
                clicks.splice(index, 1);   // remove the click
            } else {             // `nodechanged` initiated from the Mapillary viewer controls..
                const loc = node.computedLatLon ? [node.computedLatLon.lon, node.computedLatLon.lat] : [node.latLon.lon, node.latLon.lat];
                context.map().centerEase(loc);
                that.selectImage(context, node.key, true);
            }
            dispatch.call('nodeChanged');
        }

        function bearingChanged(e) {
            dispatch.call('bearingChanged', undefined, e);
        }
    },


    // Pass in the image key string as `imageKey`.
    // This allows images to be selected from places that dont have access
    // to the full image datum (like the street signs layer or the js viewer)
    selectImage: function(context, imageKey, fromViewer) {
        this.updateUrlImage(imageKey);

        const d = _mlyCache.images.forImageKey[imageKey];

        const viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(d);

        imageKey = (d && d.key) || imageKey;
        if (!fromViewer && imageKey) {
            _mlyClicks.push(imageKey);
        }

        if (_mlyShowFeatureDetections) {
            this.updateDetections(imageKey, `${imageDetectionUrl}?layers=points&values=${mapFeatureValues}&image_keys=${imageKey}&client_id=${clientId}`);
        }

        if (_mlyShowSignDetections) {
            this.updateDetections(imageKey, `${imageDetectionUrl}?layers=trafficsigns&image_keys=${imageKey}&client_id=${clientId}`);
        }

        if (_mlyViewer && imageKey) {
            _mlyViewer.moveToKey(imageKey)
                .catch(function(e) { console.error('mly3', e); });  // eslint-disable-line no-console
        }

        return this;
    },


    getActiveImage: function() {
        return _mlyActiveImage;
    },


    setActiveImage: function(node) {
        if (node) {
            _mlyActiveImage = {
                ca: node.originalCA,
                key: node.key,
                loc: [node.originalLatLon.lon, node.originalLatLon.lat],
                pano: node.pano,
                sequenceKey: node.sequenceKey
            };
        } else {
            _mlyActiveImage = null;
        }

    },


    // Updates the currently highlighted sequence and selected bubble.
    // Reset is only necessary when interacting with the viewport because
    // this implicitly changes the currently selected bubble/sequence
    setStyles: function(context, hovered, reset) {
        if (reset) {  // reset all layers
            context.container().selectAll('.viewfield-group')
                .classed('highlighted', false)
                .classed('hovered', false);

            context.container().selectAll('.sequence')
                .classed('highlighted', false)
                .classed('currentView', false);
        }

        const hoveredImageKey = hovered && hovered.key;
        const hoveredSequenceKey = hovered && hovered.skey;

        const selectedImageKey = _mlyActiveImage && _mlyActiveImage.key;
        const selectedSequenceKey = _mlyActiveImage && _mlyActiveImage.sequenceKey;

        context.container().selectAll('.layer-mapillary .viewfield-group')
            .classed('highlighted', function(d) { return d.skey === selectedSequenceKey; })
            .classed('hovered', function(d) { return d.key === hoveredImageKey; });

        context.container().selectAll('.layer-mapillary .sequence')
            .classed('highlighted', function(d) { return d.properties.key === hoveredSequenceKey; })
            .classed('currentView', function(d) { return d.properties.key === selectedSequenceKey; });

        // update viewfields if needed
        context.container().selectAll('.viewfield-group .viewfield')
            .attr('d', viewfieldPath);

        function viewfieldPath() {
            const d = this.parentNode.__data__;
            if (d.pano && d.key !== selectedImageKey) {
                return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
            } else {
                return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
            }
        }

        return this;
    },


    updateDetections: function(imageKey, url) {
        if (!_mlyViewer || _mlyFallback) return;
        if (!imageKey) return;

        if (!_mlyCache.image_detections.forImageKey[imageKey]) {
            loadData('image_detections', url)
                .then(() => {
                    showDetections(_mlyCache.image_detections.forImageKey[imageKey] || []);
            });
        } else {
            showDetections(_mlyCache.image_detections.forImageKey[imageKey]);
        }

        function showDetections(detections) {
            const tagComponent = _mlyViewer.getComponent('tag');
            detections.forEach(function(data) {
                const tag = makeTag(data);
                if (tag) {
                    tagComponent.add([tag]);
                }
            });
        }

        function makeTag(data) {
            const valueParts = data.value.split('--');
            if (!valueParts.length) return;

            let tag;
            let text;
            let color = 0xffffff;

            if (_mlyHighlightedDetection === data.key) {
                color = 0xffff00;
                text = valueParts[1];
                if (text === 'flat' || text === 'discrete' || text === 'sign') {
                    text = valueParts[2];
                }
                text = text.replace(/-/g, ' ');
                text = text.charAt(0).toUpperCase() + text.slice(1);
                _mlyHighlightedDetection = null;
            }

            if (data.shape.type === 'Polygon') {
                const polygonGeometry = new Mapillary
                    .TagComponent
                    .PolygonGeometry(data.shape.coordinates[0]);

                tag = new Mapillary.TagComponent.OutlineTag(
                    data.key,
                    polygonGeometry,
                    {
                        text: text,
                        textColor: color,
                        lineColor: color,
                        lineWidth: 2,
                        fillColor: color,
                        fillOpacity: 0.3,
                    }
                );

            } else if (data.shape.type === 'Point') {
                const pointGeometry = new Mapillary
                    .TagComponent
                    .PointGeometry(data.shape.coordinates[0]);

                tag = new Mapillary.TagComponent.SpotTag(
                    data.key,
                    pointGeometry,
                    {
                        text: text,
                        color: color,
                        textColor: color
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
