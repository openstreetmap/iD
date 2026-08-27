/* eslint-disable @typescript-eslint/no-this-alias */
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { zoom as d3_zoom, zoomIdentity as d3_zoomIdentity, type D3ZoomEvent } from 'd3-zoom';

import { deepEqual } from 'fast-equals';
import { PbfReader } from 'pbf';
import RBush from 'rbush';
import { VectorTile } from '@mapbox/vector-tile';

import { utilRebind, utilTiler, utilSetTransform } from '../util';
import { geoExtent } from '../geo';
import { services } from '.';
import { searchLimited, type WithBbox } from '../util/partition';
import { localeDateString } from '../util/date';
import { patchHash } from '../behavior';
import type { Projection } from '../geo/raw_mercator';
import type { Tile } from '../util/tiler';
import type { Vec2 } from '../geo/vector';
import type { Feature, LineString, Point } from 'geojson';
import type { coreContext } from '../core';

const apiUrl = 'https://end.mapilio.com';
const imageBaseUrl = 'https://cdn.mapilio.com/im';
const baseTileUrl = 'https://geo.mapilio.com/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=mapilio:';
const pointLayer = 'map_points';
const lineLayer = 'map_roads_line';
const tileStyle = '&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}';

const minZoom = 14;
const dispatch = d3_dispatch('loadedImages', 'loadedLines');
const imgZoom = d3_zoom<HTMLDivElement, 0>()
    .extent([[0, 0], [320, 240]])
    .translateExtent([[0, 0], [320, 240]])
    .scaleExtent([1, 15]);
const pannellumViewerCSS = 'pannellum/pannellum.css';
const pannellumViewerJS = 'pannellum/pannellum.js';
const resolution = 1080;
const hdResolution = 2080;

export interface MapilioImage {
    service: 'photo';
    loc: Vec2;
    capture_time: string;
    created_by_id: string;
    id: number;
    sequence_id: string;
    heading: number;
    resolution: string;
    isPano: boolean;
}

export type RawMapilioSequence = Feature<LineString, {
    id: string;
    sequence_uuid: string;
    capture_time: string;
}>;

type RawFeature = Feature<Point, {
    id: number;
    sequence_uuid: string;
    capture_time: string;
    created_by_id: string;
    resolution: `${number}x${number}`;
    heading: number;
}>;

interface SequenceDetails {
    data: {
        id: number;
        filename: string;
        uploaded_hash: string;
    }[];
}

let _useHd = false;
let _activeImage: {
    id: number;
    sequence_id: string;
} | null;
let _cache: {
    images: {
        rtree: RBush<WithBbox<MapilioImage>>;
        forImageId: {
            [imageId: string]: MapilioImage;
        };
    },
    sequences: {
        rtree: RBush<RawMapilioSequence>;
        lineString: {
            [sequenceId: string]: RawMapilioSequence[];
        };
    };
    requests: {
        loaded: {
            [tileId: string]: boolean;
        };
        inflight: {
            [tileId: string]: AbortController;
        };
    };
};
let _loadViewerPromise: Promise<void> | null;
let _pannellumViewer: Pannellum.Viewer | null;
let _sceneOptions: Pannellum.ConfigOptions = {
    showFullscreenCtrl: false,
    autoLoad: true,
    yaw: 0,
    minHfov: 10,
    maxHfov: 90,
    hfov: 60,
};
let _currScene = 0;

type Which = 'line' | 'images';

// Load all data for the specified type from Mapilio vector tiles
function loadTiles(which: Which, url: string, maxZoom: number, projection: Projection) {
    const tiler = utilTiler().zoomExtent([minZoom, maxZoom]).skipNullIsland(true);
    const tiles = tiler.getTiles(projection);

    tiles.forEach(function(tile) {
        loadTile(which, url, tile);
    });
}


// Load all data for the specified type from one vector tile
function loadTile(which: Which, url: string, tile: Tile) {
    const cache = _cache.requests;
    const tileId = `${tile.id}-${which}`;
    if (cache.loaded[tileId] || cache.inflight[tileId]) return;
    const controller = new AbortController();
    cache.inflight[tileId] = controller;
    const requestUrl = url
        .replace('{x}', String(tile.xyz[0]))
        .replace('{y}', String(tile.xyz[1]))
        .replace('{z}', String(tile.xyz[2]));

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

            loadTileDataToCache(data, tile);

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
function loadTileDataToCache(data: ArrayBuffer, tile: Tile) {
    const vectorTile = new VectorTile(new PbfReader(data));
    if (Object.hasOwnProperty.call(vectorTile.layers, pointLayer)) {
        const features = [];
        const cache = _cache.images;
        const layer = vectorTile.layers[pointLayer];

        for (let i = 0; i < layer.length; i++) {
            const feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]) as RawFeature;
            const loc = feature.geometry.coordinates as Vec2;

            let resolutionArr = feature.properties.resolution.split('x').map(Number) as Vec2;
            let sourceWidth = Math.max(resolutionArr[0], resolutionArr[1]);
            let sourceHeight = Math.min(resolutionArr[0] ,resolutionArr[1]);
            let isPano = sourceWidth % sourceHeight === 0;

            const d: MapilioImage = {
                service: 'photo',
                loc: loc,
                capture_time: feature.properties.capture_time,
                created_by_id: feature.properties.created_by_id,
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

    if (Object.hasOwnProperty.call(vectorTile.layers, lineLayer)) {
        const cache = _cache.sequences;
        const layer = vectorTile.layers[lineLayer];

        for (let i = 0; i < layer.length; i++) {
            const feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]) as RawMapilioSequence;
            if (cache.lineString[feature.properties.sequence_uuid]) {
                const cacheEntry = cache.lineString[feature.properties.sequence_uuid];
                if (cacheEntry.some(f => {
                    // for some reason, mapilio sometimes returns a large amount of duplicate
                    // sequence lines, causing very poor performance. this de-duplicates them,
                    // see https://github.com/openstreetmap/iD/issues/10532
                    const cachedCoords = f.geometry.coordinates;
                    const featureCoords = feature.geometry.coordinates;
                    return deepEqual(cachedCoords, featureCoords);
                })) continue;
                cacheEntry.push(feature);
            } else {
                cache.lineString[feature.properties.sequence_uuid] = [feature];
            }
        }
    }

}

function getImageData(imageId: number, sequenceId: string) {

    return fetch(apiUrl + `/api/sequence-detail?sequence_uuid=${sequenceId}`, {method: 'GET'})
        .then(function (response) {
            if (!response.ok) {
                throw new Error(response.status + ' ' + response.statusText);
            }
            return response.json();
        })
        .then(function (data: SequenceDetails) {
            let index = data.data.findIndex((feature) => feature.id === imageId);
            const {filename, uploaded_hash} = data.data[index];
            const targetResolution = _useHd ? hdResolution : resolution;
            _sceneOptions.panorama = imageBaseUrl + '/' + uploaded_hash + '/' + filename + '/' + targetResolution;
        });
}

function getUserData(userId: string) {
  return fetch(apiUrl + `/api/search-user?options[parameters][id]=${userId}`, {method: 'GET'})
    .then(function (response) {
      if (!response.ok) {
        throw new Error(response.status + ' ' + response.statusText);
      }
      return response.json();
    })
    .then(function (data) {
      return data.data[0].username;
    });
}


export default new class {
    event!: Pick<typeof dispatch, 'on'>;

    // Initialize Mapilio
    init() {
        if (!_cache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    }

    // Reset cache and state
    reset() {
        if (_cache) {
            Object.values(_cache.requests.inflight).forEach(function(request) { request.abort(); });
        }

        _cache = {
            images: { rtree: new RBush(), forImageId: {} },
            sequences: { rtree: new RBush(), lineString: {} },
            requests: { loaded: {}, inflight: {} }
        };
    }

    // Get visible images
    images(projection: Projection) {
        const limit = 5;
        return searchLimited(limit, projection, _cache.images.rtree);
    }

    cachedImage(imageKey: number) {
        return _cache.images.forImageId[imageKey];
    }


    // Load images in the visible area
    loadImages(projection: Projection) {
        let url = baseTileUrl + pointLayer + tileStyle;
        loadTiles('images', url, 14, projection);
    }

    // Load line in the visible area
    loadLines(projection: Projection) {
        let url = baseTileUrl + lineLayer + tileStyle;
        loadTiles('line', url, 14, projection);
    }

    // Get visible sequences
    sequences(projection: Projection) {
        const viewport = projection.clipExtent();
        const min: Vec2 = [viewport[0][0], viewport[1][1]];
        const max: Vec2 = [viewport[1][0], viewport[0][1]];
        const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
        const sequenceIds: Record<string, true> = {};
        let lineStrings: RawMapilioSequence[] = [];

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
    }

    // Set the currently visible image
    setActiveImage(image?: MapilioImage) {
        if (image) {
            _activeImage = {
                id: image.id,
                sequence_id: image.sequence_id
            };
        } else {
            _activeImage = null;
        }
    }


    // Update the currently highlighted sequence and selected bubble.
    setStyles(context: coreContext, hovered?: MapilioImage | null) {
        const hoveredImageId = hovered && hovered.id;
        const hoveredSequenceId = hovered && hovered.sequence_id;
        const selectedSequenceId = _activeImage && _activeImage.sequence_id;
        const selectedImageId =  _activeImage && _activeImage.id;

        const markers = context.container().selectAll<SVGElement, MapilioImage>('.layer-mapilio .viewfield-group');
        const sequences = context.container().selectAll<SVGElement, RawFeature>('.layer-mapilio .sequence');

        markers.classed('highlighted', function(d) { return d.id === hoveredImageId; })
            .classed('hovered', function(d) { return d.id === hoveredImageId; })
            .classed('currentView', function(d) { return d.id === selectedImageId; });

        sequences.classed('highlighted', function(d) { return d.properties.sequence_uuid === hoveredSequenceId; })
            .classed('currentView', function(d) { return d.properties.sequence_uuid === selectedSequenceId; });

        return this;
    }

    initViewer() {
        if (!window.pannellum) return;
        if (_pannellumViewer) return;

        _currScene += 1;
        const sceneID = _currScene.toString();
        const options: Pannellum.TourOptions = {
            'default': { firstScene: sceneID },
            scenes: {}
        };
        options.scenes[sceneID] = _sceneOptions;

        _pannellumViewer = window.pannellum.viewer('ideditor-viewer-mapilio-pnlm', options);
    }

    selectImage(context: coreContext, id: number) {

        let that = this;

        let d = this.cachedImage(id);

        this.setActiveImage(d);

        patchHash({ photo: 'mapilio/' + d.id });

        let viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(d);

        this.setStyles(context, null);

        if (!d) return this;

        let wrap = context.container().select<HTMLDivElement>('.photoviewer .mapilio-wrapper');
        let attribution = wrap.selectAll('.photo-attribution').text('\u00A0');

        let _username = '';

        getUserData(d.created_by_id).then((username) => {
          if (username) {
            _username = username;
          }

        }).finally(() => {

            attribution
             .append('input')
             .attr('type','checkbox')
             .property('checked', _useHd)
             .on('click',(e) => {
                e.stopPropagation();
                _useHd = e.target.checked;
                let parts: (string | number)[] = _sceneOptions.panorama!.split('/');

                if (_useHd){
                    parts[parts.length - 1] = hdResolution;
                    _sceneOptions.panorama= parts.join('/');
                    loadTheImage();
                } else {
                    parts[parts.length - 1] = resolution;
                    _sceneOptions.panorama=parts.join('/');
                    loadTheImage();
                }
             });

            attribution
             .append('span')
             .text('High Resolution');

            attribution
             .append('span')
             .text('|');

            attribution
              .append('span')
              .attr('class', 'captured_by')
              .text('@' + _username);

            attribution
              .append('span')
              .text('|');

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
        });

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


        function loadTheImage(){
            if (d.isPano) {
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
        }

        getImageData(d.id,d.sequence_id).then(loadTheImage);

        return this;
    }

    initOnlyPhoto(context: coreContext) {

        if (_pannellumViewer) {
            _pannellumViewer.destroy();
            _pannellumViewer = null;
        }

        let wrap = context.container().select('#ideditor-viewer-mapilio-simple');

        let imgWrap = wrap.select('img');

        if (!imgWrap.empty()) {
            imgWrap.attr('src',_sceneOptions.panorama!);
        } else {
            wrap.append('img')
                .attr('src', _sceneOptions.panorama!);
        }

    }

    ensureViewerLoaded(context: coreContext) {

        let that = this;

        let imgWrap = context.container().select('#ideditor-viewer-mapilio-simple > img');

        if (!imgWrap.empty()) {
            imgWrap.remove();
        }

        if (_loadViewerPromise) return _loadViewerPromise;

        let wrap = context.container().select('.photoviewer').selectAll<HTMLDivElement, 0>('.mapilio-wrapper')
            .data<0>([0]);

        let wrapEnter = wrap.enter()
            .append('div')
            .attr('class', 'photo-wrapper mapilio-wrapper')
            .classed('hide', true)
            .on('dblclick.zoom', null);

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
            .attr('id', 'ideditor-viewer-mapilio-pnlm');

        wrapEnter
            .append('div')
            .attr('id', 'ideditor-viewer-mapilio-simple-wrap')
            .call(imgZoom.on('zoom', zoomPan))
            .append('div')
            .attr('id', 'ideditor-viewer-mapilio-simple');



        // Register viewer resize handler
        context.ui().photoviewer.on('resize.mapilio', () => {
            if (_pannellumViewer) {
                _pannellumViewer.resize();
            }
        });

        _loadViewerPromise = new Promise<void>((resolve, reject) => {
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

        function step(stepBy: number) {
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

        function zoomPan(d3_event: D3ZoomEvent<HTMLDivElement, 0>) {
            var t = d3_event.transform;
            context.container().select('.photoviewer #ideditor-viewer-mapilio-simple')
                .call(utilSetTransform, t.x, t.y, t.k);
        }

        return _loadViewerPromise;
    }

    showViewer(context: coreContext) {
        const wrap = context.container().select('.photoviewer');
        const isHidden = wrap.selectAll('.photo-wrapper.mapilio-wrapper.hide').size();

        if (isHidden) {
            for (const service of Object.values(services)) {
                if (service === this) continue;
                if (service && 'hideViewer' in service && typeof service.hideViewer === 'function') {
                    service.hideViewer(context);
                }
            }
            wrap.classed('hide', false)
                .selectAll('.photo-wrapper.mapilio-wrapper')
                .classed('hide', false);
        }

        return this;
    }

    /**
     * hideViewer()
     */
    hideViewer(context: coreContext) {
        let viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(null);

        patchHash({ photo: null });

        viewer
            .classed('hide', true)
            .selectAll('.photo-wrapper')
            .classed('hide', true);

        context.container().selectAll('.viewfield-group, .sequence, .icon-sign')
            .classed('currentView', false);

        this.setActiveImage();
        return this.setStyles(context, null);
    }

    // Return the current cache
    cache() {
        return _cache;
    }
};
