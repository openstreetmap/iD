import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import Protobuf from 'pbf';
import RBush from 'rbush';
import { VectorTile } from '@mapbox/vector-tile';

import { utilRebind, utilTiler } from '../util';
import {geoExtent, geoScaleToZoom} from '../geo';
import {localizer} from '../core/localizer';

const apiUrl = 'https://end.mapilio.com';
const imageBaseUrl = 'https://cdn.mapilio.com/im';
const baseTileUrl = 'https://geo.mapilio.com/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=mapilio:';
const pointLayer = 'map_points';
const lineLayer = 'map_roads_line';
const tileStyle = '&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}';

const minZoom = 14;
const dispatch = d3_dispatch('change', 'loadedImages', 'loadedLine');
const pannellumViewerCSS = 'pannellum-streetside/pannellum.css';
const pannellumViewerJS = 'pannellum-streetside/pannellum.js';
const resolution = 1080;

let _mlyActiveImage;
let _mlyCache;
let _loadViewerPromise;
let _pannellumViewer;
let _mlySceneOptions = {
    showFullscreenCtrl: false,
    autoLoad: true,
    yaw: 0,
    minHfov: 10,
    maxHfov: 90,
    hfov: 60,
};
let _currScene = 0;


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

// Load all data for the specified type from Mapilio vector tiles
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
            } else {
                dispatch.call('loadedLines');
            }
        })
        .catch(function() {
            cache.loaded[tileId] = true;
            delete cache.inflight[tileId];
        });
}


// Load the data from the vector tile into cache
function loadTileDataToCache(data, tile) {
    const vectorTile = new VectorTile(new Protobuf(data));
    let features,
        cache,
        layer,
        i,
        feature,
        loc,
        d;
    if (vectorTile.layers.hasOwnProperty(pointLayer)) {
        features = [];
        cache = _mlyCache.images;
        layer = vectorTile.layers[pointLayer];

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            loc = feature.geometry.coordinates;

            let resolutionArr = feature.properties.resolution.split('x');
            let sourceWidth = Math.max(resolutionArr[0], resolutionArr[1]);
            let sourceHeight = Math.min(resolutionArr[0] ,resolutionArr[1]);
            let isPano = sourceWidth % sourceHeight === 0;

            d = {
                loc: loc,
                capture_time: feature.properties.capture_time,
                id: feature.properties.id,
                sequence_id: feature.properties.sequence_uuid,
                heading: feature.properties.heading,
                resolution: feature.properties.resolution,
                isPano: isPano
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

    if (vectorTile.layers.hasOwnProperty(lineLayer)) {
        cache = _mlyCache.sequences;
        layer = vectorTile.layers[lineLayer];

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            if (cache.lineString[feature.properties.sequence_uuid]) {
                cache.lineString[feature.properties.sequence_uuid].push(feature);
            } else {
                cache.lineString[feature.properties.sequence_uuid] = [feature];
            }
        }
    }

}

function getImageData(imageId, sequenceId) {

    return fetch(apiUrl + `/api/sequence-detail?sequence_uuid=${sequenceId}`, {method: 'GET'})
        .then(function (response) {
            if (!response.ok) {
                throw new Error(response.status + ' ' + response.statusText);
            }
            return response.json();
        })
        .then(function (data) {
            let index = data.data.findIndex((feature) => feature.id === imageId);
            const {filename, uploaded_hash} = data.data[index];
            _mlySceneOptions.panorama = imageBaseUrl + '/' + uploaded_hash + '/' + filename + '/' + resolution;
        });
}


export default {
    // Initialize Mapilio
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

    cachedImage: function(imageKey) {
        return _mlyCache.images.forImageId[imageKey];
    },


    // Load images in the visible area
    loadImages: function(projection) {
        let url = baseTileUrl + pointLayer + tileStyle;
        loadTiles('images', url, 14, projection);
    },

    // Load line in the visible area
    loadLines: function(projection) {
        let url = baseTileUrl + lineLayer + tileStyle;
        loadTiles('line', url, 14, projection);
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

    // Set the currently visible image
    setActiveImage: function(image) {
        if (image) {
            _mlyActiveImage = {
                id: image.id,
                sequence_id: image.sequence_id
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
        const selectedImageId =  _mlyActiveImage && _mlyActiveImage.id;

        const markers = context.container().selectAll('.layer-mapilio .viewfield-group');
        const sequences = context.container().selectAll('.layer-mapilio .sequence');

        markers.classed('highlighted', function(d) { return d.id === hoveredImageId; })
            .classed('hovered', function(d) { return d.id === hoveredImageId; })
            .classed('currentView', function(d) { return d.id === selectedImageId; });

        sequences.classed('highlighted', function(d) { return d.properties.sequence_uuid === hoveredSequenceId; })
            .classed('currentView', function(d) { return d.properties.sequence_uuid === selectedSequenceId; });

        return this;
    },

    initViewer: function () {
        if (!window.pannellum) return;
        if (_pannellumViewer) return;

        _currScene += 1;
        const sceneID = _currScene.toString();
        const options = {
            'default': { firstScene: sceneID },
            scenes: {}
        };
        options.scenes[sceneID] = _mlySceneOptions;

        _pannellumViewer = window.pannellum.viewer('ideditor-viewer-mapilio', options);
    },

    selectImage: function (context, id) {

        let that = this;

        let d = this.cachedImage(id);

        this.setActiveImage(d);

        let viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(d);

        this.setStyles(context, null);

        if (!d) return this;

        let wrap = context.container().select('.photoviewer .mapilio-wrapper');
        let attribution = wrap.selectAll('.photo-attribution').text('');

        if (d.capture_time) {
            attribution
                .append('span')
                .attr('class', 'captured_at')
                .text(localeDateString(d.capture_time));

            attribution
                .append('span')
                .text('|');
        }

        attribution
            .append('a')
            .attr('class', 'image-link')
            .attr('target', '_blank')
            .attr('href', `https://mapilio.com/app?lat=${d.loc[1]}&lng=${d.loc[0]}&zoom=17&pId=${d.id}`)
            .text('mapilio.com');

        getImageData(d.id,d.sequence_id).then(function () {

            if (d.isPano){
                if (!_pannellumViewer) {
                    that.initViewer();
                } else {
                    // make a new scene
                    _currScene += 1;
                    let sceneID = _currScene.toString();
                    _pannellumViewer
                        .addScene(sceneID, _mlySceneOptions)
                        .loadScene(sceneID);

                    // remove previous scene
                    if (_currScene > 2) {
                        sceneID = (_currScene - 1).toString();
                        _pannellumViewer
                            .removeScene(sceneID);
                    }
                }
            } else {
                // make non-panoramic photo viewer
                that.initOnlyPhoto(context);
            }
        });

        function localeDateString(s) {
            if (!s) return null;
            var options = { day: 'numeric', month: 'short', year: 'numeric' };
            var d = new Date(s);
            if (isNaN(d.getTime())) return null;
            return d.toLocaleDateString(localizer.localeCode(), options);
        }

        return this;
    },

    initOnlyPhoto: function (context) {

        if (_pannellumViewer) {
            _pannellumViewer.destroy();
            _pannellumViewer = null;
        }

        let wrap = context.container().select('#ideditor-viewer-mapilio');

        let imgWrap = wrap.select('img');

        wrap.style('height','100%');

        if (!imgWrap.empty()){
            imgWrap.attr('src',_mlySceneOptions.panorama);
        } else {
            wrap.append('img')
                .attr('src',_mlySceneOptions.panorama);
        }

    },

    ensureViewerLoaded: function(context) {

        let that = this;

        let imgWrap = context.container().select('#ideditor-viewer-mapilio > img');

        if (!imgWrap.empty()) {
            imgWrap.remove();
        }

        if (_loadViewerPromise) return _loadViewerPromise;

        let wrap = context.container().select('.photoviewer').selectAll('.mapilio-wrapper')
            .data([0]);

        let wrapEnter = wrap.enter()
            .append('div')
            .attr('class', 'photo-wrapper mapilio-wrapper')
            .classed('hide', true);

        wrapEnter
            .append('div')
            .attr('class', 'photo-attribution fillD');

        const controlsEnter = wrapEnter
            .append('div')
            .attr('class', 'photo-controls-wrap')
            .append('div')
            .attr('class', 'photo-controls-mapilio');

        controlsEnter
            .append('button')
            .on('click.back', step(-1))
            .text('◄');

        controlsEnter
            .append('button')
            .on('click.forward', step(1))
            .text('►');

        wrapEnter
            .append('div')
            .attr('id', 'ideditor-viewer-mapilio');


        // Register viewer resize handler
        context.ui().photoviewer.on('resize.mapilio', () => {
            if (_pannellumViewer) {
                _pannellumViewer.resize();
            }
        });

        _loadViewerPromise = new Promise((resolve, reject) => {
            let loadedCount = 0;
            function loaded() {
                loadedCount += 1;

                // wait until both files are loaded
                if (loadedCount === 2) resolve();
            }

            const head = d3_select('head');

            // load pannellum-viewercss
            head.selectAll('#ideditor-mapilio-viewercss')
                .data([0])
                .enter()
                .append('link')
                .attr('id', 'ideditor-mapilio-viewercss')
                .attr('rel', 'stylesheet')
                .attr('crossorigin', 'anonymous')
                .attr('href', context.asset(pannellumViewerCSS))
                .on('load.serviceMapilio', loaded)
                .on('error.serviceMapilio', function() {
                    reject();
                });

            // load pannellum-viewerjs
            head.selectAll('#ideditor-mapilio-viewerjs')
                .data([0])
                .enter()
                .append('script')
                .attr('id', 'ideditor-mapilio-viewerjs')
                .attr('crossorigin', 'anonymous')
                .attr('src', context.asset(pannellumViewerJS))
                .on('load.serviceMapilio', loaded)
                .on('error.serviceMapilio', function() {
                    reject();
                });
        })
            .catch(function() {
                _loadViewerPromise = null;
            });

        function step(stepBy) {
            return function () {
                if (!_mlyActiveImage) return;
                const imageId = _mlyActiveImage.id;

                const nextIndex = imageId + stepBy;
                if (!nextIndex) return;

                const nextImage = _mlyCache.images.forImageId[nextIndex];

                context.map().centerEase(nextImage.loc);

                that.selectImage(context, nextImage.id);
            };
        }

        return _loadViewerPromise;
    },

    showViewer:function (context) {
        let wrap = context.container().select('.photoviewer')
            .classed('hide', false);

        let isHidden = wrap.selectAll('.photo-wrapper.mapilio-wrapper.hide').size();

        if (isHidden) {
            wrap
                .selectAll('.photo-wrapper:not(.mapilio-wrapper)')
                .classed('hide', true);

            wrap
                .selectAll('.photo-wrapper.mapilio-wrapper')
                .classed('hide', false);
        }

        return this;
    },

    /**
     * hideViewer()
     */
    hideViewer: function (context) {
        let viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(null);

        viewer
            .classed('hide', true)
            .selectAll('.photo-wrapper')
            .classed('hide', true);

        context.container().selectAll('.viewfield-group, .sequence, .icon-sign')
            .classed('currentView', false);

        this.setActiveImage();

        return this.setStyles(context, null);
    },

    // Return the current cache
    cache: function() {
        return _mlyCache;
    }
};
