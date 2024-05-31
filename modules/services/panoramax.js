import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { zoom as d3_zoom, zoomIdentity as d3_zoomIdentity } from 'd3-zoom';

import Protobuf from 'pbf';
import RBush from 'rbush';
import { VectorTile } from '@mapbox/vector-tile';

import { utilRebind, utilTiler, utilQsString, utilStringQs, utilSetTransform } from '../util';
import { geoExtent, geoScaleToZoom } from '../geo';
import { localizer } from '../core/localizer';

const apiUrl = 'https://panoramax.openstreetmap.fr/';
const tileUrl = apiUrl + 'api/map/{z}/{x}/{y}.pbf';

const pictureLayer = 'pictures';
const sequenceLayer = 'sequences';

const minZoom = 15;
const dispatch = d3_dispatch('loadedImages', 'loadedLines');
const imgZoom = d3_zoom()
    .extent([[0, 0], [320, 240]])
    .translateExtent([[0, 0], [320, 240]])
    .scaleExtent([1, 15]);
const pannellumViewerCSS = 'pannellum/pannellum.css';
const pannellumViewerJS = 'pannellum/pannellum.js';
const resolution = 1080;

let _activeImage;
let _cache;
let _loadViewerPromise;
let _pannellumViewer;
let _sceneOptions = {
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

// Load all data for the specified type from Panoramax vector tiles
function loadTiles(which, url, maxZoom, projection) {
    const tiler = utilTiler().zoomExtent([minZoom, maxZoom]).skipNullIsland(true);
    const tiles = tiler.getTiles(projection);

    tiles.forEach(function(tile) {
        loadTile(which, url, tile);
    });
}


// Load all data for the specified type from one vector tile
function loadTile(which, url, tile) {
    const cache = _cache.requests;
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
            if (data.byteLength === 0) {
                throw new Error('No Data');
            }

            loadTileDataToCache(data, tile, which);

            if (which === 'images') {
                dispatch.call('loadedImages');
            } else {
                dispatch.call('loadedLines');
            }
        })
        .catch(function (e) {
            if (e.message === 'No Data') {
                cache.loaded[tileId] = true;
            } else {
                console.error(e); // eslint-disable-line no-console
            }
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

    if (vectorTile.layers.hasOwnProperty(pictureLayer)) {
        features = [];
        cache = _cache.images;
        layer = vectorTile.layers[pictureLayer];

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            loc = feature.geometry.coordinates;

            d = {
                loc: loc,
                capture_time: feature.properties.ts,
                id: feature.properties.id,
                acc_id: feature.properties.account_id,
                sequence_id: feature.properties.sequences.split("\"")[1],
                heading: feature.properties.heading,
                resolution: feature.properties.resolution,
                type: feature.properties.type,
                model: feature.properties.model,
            };
            console.log(d.sequence_id)
            cache.forImageId[d.id] = d;
            features.push({
                minX: loc[0], minY: loc[1], maxX: loc[0], maxY: loc[1], data: d
            });
        }
        if (cache.rtree) {
            cache.rtree.load(features);
        }
    }

    if (vectorTile.layers.hasOwnProperty(sequenceLayer)) {
        cache = _cache.sequences;
        layer = vectorTile.layers[sequenceLayer];

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]);
            if (cache.lineString[feature.properties.id]) {
                cache.lineString[feature.properties.id].push(feature);
            } else {
                cache.lineString[feature.properties.id] = [feature];
            }
        }
    }

}

export default {
    init: function() {
        if (!_cache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    },

    reset: function() {
        if (_cache) {
            Object.values(_cache.requests.inflight).forEach(function(request) { request.abort(); });
        }

        _cache = {
            images: { rtree: new RBush(), forImageId: {} },
            sequences: { rtree: new RBush(), lineString: {} },
            requests: { loaded: {}, inflight: {} }
        };

        _activeImage = null;
    },

    // Get visible images
    images: function(projection) {
        const limit = 5;
        return searchLimited(limit, projection, _cache.images.rtree);
    },

    cachedImage: function(imageKey) {
        return _cache.images.forImageId[imageKey];
    },


    // Load images in the visible area
    loadImages: function(projection) {
        let url = tileUrl;
        loadTiles('images', url, 15, projection);
    },

    // Load line in the visible area
    loadLines: function(projection) {
        let url = tileUrl;
        loadTiles('line', url, 15, projection);
    },

    // Get visible sequences
    sequences: function(projection) {
        const viewport = projection.clipExtent();
        const min = [viewport[0][0], viewport[1][1]];
        const max = [viewport[1][0], viewport[0][1]];
        const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
        const sequenceIds = {};
        let lineStrings = [];

        _cache.images.rtree.search(bbox)
            .forEach(function(d) {
                if (d.data.sequence_id) {
                    sequenceIds[d.data.sequence_id] = true;
                }
            });

        Object.keys(sequenceIds).forEach(function(sequenceId) {
            if (_cache.sequences.lineString[sequenceId]) {
                lineStrings = lineStrings.concat(_cache.sequences.lineString[sequenceId]);
            }
        });

        return lineStrings;
    },

    // Set the currently visible image
    setActiveImage: function(image) {
        if (image) {
            _activeImage = {
                id: image.id,
                sequence_id: image.sequence_id
            };
        } else {
            _activeImage = null;
        }
    },

    // Update the currently highlighted sequence and selected bubble.
    setStyles: function(context, hovered) {
        const hoveredImageId = hovered && hovered.id;
        const hoveredSequenceId = hovered && hovered.sequence_id;
        const selectedSequenceId = _activeImage && _activeImage.sequence_id;
        const selectedImageId =  _activeImage && _activeImage.id;

        const markers = context.container().selectAll('.layer-panoramax .viewfield-group');
        const sequences = context.container().selectAll('.layer-panoramax .sequence');

        markers.classed('highlighted', function(d) { return d.id === hoveredImageId; })
            .classed('hovered', function(d) { return d.id === hoveredImageId; })
            .classed('currentView', function(d) { return d.id === selectedImageId; });

        sequences.classed('highlighted', function(d) { return d.properties.sequence_id === hoveredSequenceId; })
            .classed('currentView', function(d) { return d.properties.sequence_id === selectedSequenceId; });

        return this;
    },

    updateUrlImage: function(imageKey) {
        if (!window.mocha) {
            var hash = utilStringQs(window.location.hash);
            if (imageKey) {
                hash.photo = 'panoramax/' + imageKey;
            } else {
                delete hash.photo;
            }
            window.location.replace('#' + utilQsString(hash, true));
        }
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
        options.scenes[sceneID] = _sceneOptions;

        _pannellumViewer = window.pannellum.viewer('ideditor-viewer-panoramax-pnlm', options);
    },

    selectImage: function (context, id) {

        let that = this;

        let d = this.cachedImage(id);

        this.setActiveImage(d);

        this.updateUrlImage(d.id);

        let viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(d);

        this.setStyles(context, null);

        if (!d) return this;

        let wrap = context.container().select('.photoviewer .panoramax-wrapper');
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
            .attr('href', apiUrl + 'api/pictures/' + d.id + '/hd.jpg')
            .text('panoramax.fr');

        wrap
            .transition()
            .duration(100)
            .call(imgZoom.transform, d3_zoomIdentity);

        wrap
            .selectAll('img')
            .remove();

        wrap
            .selectAll('button.back')
            .classed('hide', !_cache.images.forImageId.hasOwnProperty(+id - 1));
        wrap
            .selectAll('button.forward')
            .classed('hide', !_cache.images.forImageId.hasOwnProperty(+id + 1));

        that.initOnlyPhoto(context, id);
        /*
        if (d.type == "equirectangular") {
            if (!_pannellumViewer) {
                that.initViewer();
            } else {
                // make a new scene
                _currScene += 1;
                let sceneID = _currScene.toString();
                _pannellumViewer
                    .addScene(sceneID, _sceneOptions)
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
        */

        function localeDateString(s) {
            if (!s) return null;
            var options = { day: 'numeric', month: 'short', year: 'numeric' };
            var d = new Date(s);
            if (isNaN(d.getTime())) return null;
            return d.toLocaleDateString(localizer.localeCode(), options);
        }

        return this;
    },

    initOnlyPhoto: function (context, id) {

        if (_pannellumViewer) {
            _pannellumViewer.destroy();
            _pannellumViewer = null;
        }

        let wrap = context.container().select('#ideditor-viewer-panoramax-simple');

        let imgWrap = wrap.select('img');

        if (!imgWrap.empty()) {
            imgWrap.attr('src',apiUrl + 'api/pictures/' + id + '/sd.jpg');
        } else {
            wrap.append('img')
                .attr('src',apiUrl + 'api/pictures/' + id + '/sd.jpg');
        }

    },

    ensureViewerLoaded: function(context) {

        let that = this;

        let imgWrap = context.container().select('#ideditor-viewer-panoramax-simple > img');

        if (!imgWrap.empty()) {
            imgWrap.remove();
        }

        if (_loadViewerPromise) return _loadViewerPromise;

        let wrap = context.container().select('.photoviewer').selectAll('.panoramax-wrapper')
            .data([0]);

        let wrapEnter = wrap.enter()
            .append('div')
            .attr('class', 'photo-wrapper panoramax-wrapper')
            .classed('hide', true)
            .on('dblclick.zoom', null);

        wrapEnter
            .append('div')
            .attr('class', 'photo-attribution fillD');

        const controlsEnter = wrapEnter
            .append('div')
            .attr('class', 'photo-controls-wrap')
            .append('div')
            .attr('class', 'photo-controls-panoramax');

        controlsEnter
            .append('button')
            .classed('back', true)
            .on('click.back', step(-1))
            .text('◄');

        controlsEnter
            .append('button')
            .classed('forward', true)
            .on('click.forward', step(1))
            .text('►');

        wrapEnter
            .append('div')
            .attr('id', 'ideditor-viewer-panoramax-pnlm');

        wrapEnter
            .append('div')
            .attr('id', 'ideditor-viewer-panoramax-simple-wrap')
            .call(imgZoom.on('zoom', zoomPan))
            .append('div')
            .attr('id', 'ideditor-viewer-panoramax-simple');



        // Register viewer resize handler
        context.ui().photoviewer.on('resize.panoramax', () => {
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
            head.selectAll('#ideditor-panoramax-viewercss')
                .data([0])
                .enter()
                .append('link')
                .attr('id', 'ideditor-panoramax-viewercss')
                .attr('rel', 'stylesheet')
                .attr('crossorigin', 'anonymous')
                .attr('href', context.asset(pannellumViewerCSS))
                .on('load.servicePanoramax', loaded)
                .on('error.servicePanoramax', function() {
                    reject();
                });

            // load pannellum-viewerjs
            head.selectAll('#ideditor-panoramax-viewerjs')
                .data([0])
                .enter()
                .append('script')
                .attr('id', 'ideditor-panoramax-viewerjs')
                .attr('crossorigin', 'anonymous')
                .attr('src', context.asset(pannellumViewerJS))
                .on('load.servicePanoramax', loaded)
                .on('error.servicePanoramax', function() {
                    reject();
                });
        })
            .catch(function() {
                _loadViewerPromise = null;
            });

        function step(stepBy) {
            return function () {
                if (!_activeImage) return;
                const imageId = _activeImage.id;

                const nextIndex = imageId + stepBy;
                if (!nextIndex) return;

                const nextImage = _cache.images.forImageId[nextIndex];

                context.map().centerEase(nextImage.loc);

                that.selectImage(context, nextImage.id);
            };
        }

        function zoomPan(d3_event) {
            var t = d3_event.transform;
            context.container().select('.photoviewer #ideditor-viewer-panoramax-simple')
                .call(utilSetTransform, t.x, t.y, t.k);
        }

        return _loadViewerPromise;
    },

    showViewer:function (context) {
        let wrap = context.container().select('.photoviewer')
            .classed('hide', false);

        let isHidden = wrap.selectAll('.photo-wrapper.panoramax-wrapper.hide').size();

        if (isHidden) {
            wrap
                .selectAll('.photo-wrapper:not(.panoramax-wrapper)')
                .classed('hide', true);

            wrap
                .selectAll('.photo-wrapper.panoramax-wrapper')
                .classed('hide', false);
        }

        return this;
    },

    hideViewer: function (context) {
        let viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(null);

        this.updateUrlImage(null);

        viewer
            .classed('hide', true)
            .selectAll('.photo-wrapper')
            .classed('hide', true);

        context.container().selectAll('.viewfield-group, .sequence, .icon-sign')
            .classed('currentView', false);

        this.setActiveImage();

        return this.setStyles(context, null);
    },

    cache: function() {
        return _cache;
    }
};
