/* eslint-disable @typescript-eslint/no-this-alias */
/* global mapillary:false */
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import type { SequenceComponent, TagComponent, ViewerBearingEvent, ViewerImageEvent, FilterExpression, Image, Viewer, ViewerOptions } from 'mapillary-js';
import { PbfReader } from 'pbf';
import RBush from 'rbush';
import { VectorTile } from '@mapbox/vector-tile';
import { geoExtent } from '../geo';
import { utilRebind, utilTiler } from '../util';
import { services } from '.';
import { searchLimited, type WithBbox } from '../util/partition';
import { patchHash } from '../behavior';
import type { Projection } from '../geo/raw_mercator';
import type { Tile } from '../util/tiler';
import type { Vec2 } from '../geo/vector';
import type { Feature, LineString, Point } from 'geojson';
import type { coreContext } from '../core';

const accessToken = 'MLY|4100327730013843|5bb78b81720791946a9a7b956c57b7cf';
const apiUrl = 'https://graph.mapillary.com/';
const baseTileUrl = 'https://tiles.mapillary.com/maps/vtp';
const mapFeatureTileUrl = `${baseTileUrl}/mly_map_feature_point/2/{z}/{x}/{y}?access_token=${accessToken}`;
const tileUrl = `${baseTileUrl}/mly1_public/2/{z}/{x}/{y}?access_token=${accessToken}`;
const trafficSignTileUrl = `${baseTileUrl}/mly_map_feature_traffic_sign/2/{z}/{x}/{y}?access_token=${accessToken}`;

const viewercss = 'mapillary-js/mapillary.css';
const viewerjs = 'mapillary-js/mapillary.js';
const minZoom = 14;
const dispatch = d3_dispatch<object, {
    change: [];
    loadedImages: [];
    loadedSigns: [];
    loadedMapFeatures: [];
    bearingChanged: [ViewerBearingEvent];
    imageChanged: [];
}>('change', 'loadedImages', 'loadedSigns', 'loadedMapFeatures', 'bearingChanged', 'imageChanged');

export interface MlyImage {
    service?: 'photo';
    loc: Vec2;
    id: string;

    first_seen_at?: string;
    last_seen_at?: string;
    value?: string;
    captured_at?: string;

    ca?: number;
    unsafeId?: boolean;
    is_pano?: boolean;
    sequence_id?: string;
}

export type MlySequence = Feature<LineString, {
    id: string;
    captured_at: string;
    is_pano?: boolean;
}>;


type RawPoint = Feature<Point, {
    id: string;
    first_seen_at: string;
    last_seen_at: string;
    value: string;
}>;

type RawImage = Feature<Point, {
    captured_at: string;
    compass_angle: number;
    id: string;
    is_pano: boolean;
    sequence_id: string;
}>;

interface Detection {
    id: string;
    value: string;
    /** base64 encoded */
    geometry: string;
    image_id: string;
}
export interface DetectionWithImage extends Detection {
    image: MlyImage
}

let _loadViewerPromise: Promise<void> | undefined | null;
let _mlyActiveImage: MlyImage | null;
let _mlyCache: {
    images: {
        rtree: RBush<WithBbox<MlyImage>>;
        forImageId: {
            [imageId: string]: unknown;
        };
    },
    image_detections: {
        forImageId: {
            [imageId: string]: Detection[];
        };
    },
    signs: {
        rtree: RBush<WithBbox<MlyImage>>;
    };
    points: {
        rtree: RBush<WithBbox<MlyImage>>;
    };
    sequences: {
        rtree: RBush<WithBbox<MlyImage>>;
        lineString: {
            [sequenceId: string]: MlySequence[];
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
let _mlyFallback = false;
let _mlyHighlightedDetection: unknown | null;
let _mlyShowFeatureDetections = false;
let _mlyShowSignDetections = false;
let _mlyViewer: Viewer;
let _mlyViewerFilter: FilterExpression = ['all'];
let _isViewerOpen = false;


type Which = 'images' | 'signs' | 'points';

// Load all data for the specified type from Mapillary vector tiles
function loadTiles(which: Which, url: string, maxZoom: number, projection: Projection) {
    const tiler = utilTiler().zoomExtent([minZoom, maxZoom]).skipNullIsland(true);
    const tiles = tiler.getTiles(projection);

    tiles.forEach(function(tile) {
        loadTile(which, url, tile);
    });
}


// Load all data for the specified type from one vector tile
function loadTile(which: Which, url: string, tile: Tile) {
    const cache = _mlyCache.requests;
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
function loadTileDataToCache(data: ArrayBuffer, tile: Tile, which: Which) {
    const vectorTile = new VectorTile(new PbfReader(data));
    let features,
        cache,
        layer,
        i,
        feature,
        loc,
        d: MlyImage;

    if (Object.hasOwnProperty.call(vectorTile.layers, 'image')) {
        features = [];
        cache = _mlyCache.images;
        layer = vectorTile.layers.image;

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]) as RawImage;
            const unsafeId = typeof feature.properties.id === 'number' && feature.properties.id > Number.MAX_SAFE_INTEGER; // #12575
            loc = feature.geometry.coordinates as Vec2;
            d = {
                service: 'photo',
                loc: loc,
                captured_at: feature.properties.captured_at,
                ca: feature.properties.compass_angle,
                id: feature.properties.id,
                unsafeId,
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

    if (Object.hasOwnProperty.call(vectorTile.layers, 'sequence')) {
        cache = _mlyCache.sequences;
        layer = vectorTile.layers.sequence;

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]) as MlySequence;
            if (cache.lineString[feature.properties.id]) {
                cache.lineString[feature.properties.id].push(feature);
            } else {
                cache.lineString[feature.properties.id] = [feature];
            }
        }
    }

    if (Object.hasOwnProperty.call(vectorTile.layers, 'point')) {
        features = [];
        cache = _mlyCache[which];
        layer = vectorTile.layers.point;

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]) as RawPoint;
            if (typeof feature.properties.id === 'number' && feature.properties.id > Number.MAX_SAFE_INTEGER) continue; // skip unsafe ids #12575
            loc = feature.geometry.coordinates as Vec2;

            d = {
                service: 'photo',
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

    if (Object.hasOwnProperty.call(vectorTile.layers, 'traffic_sign')) {
        features = [];
        cache = _mlyCache[which];
        layer = vectorTile.layers.traffic_sign;

        for (i = 0; i < layer.length; i++) {
            feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]) as RawPoint;
            if (typeof feature.properties.id === 'number' && feature.properties.id > Number.MAX_SAFE_INTEGER) continue; // skip unsafe ids #12575
            loc = feature.geometry.coordinates as Vec2;

            d = {
                service: 'photo',
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
function loadData<T>(url: string): Promise<T[]> {
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

export default new class {
    event!: Pick<typeof dispatch, 'on'>;

    // Initialize Mapillary
    init() {
        if (!_mlyCache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    }

    // Reset cache and state
    reset() {
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
    }

    // Get visible images
    images(projection: Projection) {
        const limit = 5;
        return searchLimited(limit, projection, _mlyCache.images.rtree);
    }

    // Get visible traffic signs
    signs(projection: Projection) {
        const limit = 5;
        return searchLimited(limit, projection, _mlyCache.signs.rtree);
    }

    // Get visible map (point) features
    mapFeatures(projection: Projection) {
        const limit = 5;
        return searchLimited(limit, projection, _mlyCache.points.rtree);
    }

    // Get cached image by id
    cachedImage(imageId: string) {
        return _mlyCache.images.forImageId[imageId];
    }

    // Get visible sequences
    sequences(projection: Projection) {
        const viewport = projection.clipExtent();
        const min: Vec2 = [viewport[0][0], viewport[1][1]];
        const max: Vec2 = [viewport[1][0], viewport[0][1]];
        const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
        const sequenceIds: Record<string, true> = {};
        let lineStrings: MlySequence[] = [];

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
    }


    // Load images in the visible area
    loadImages(projection: Projection) {
        loadTiles('images', tileUrl, 14, projection);
    }


    // Load traffic signs in the visible area
    loadSigns(projection: Projection) {
        loadTiles('signs', trafficSignTileUrl, 14, projection);
    }


    // Load map (point) features in the visible area
    loadMapFeatures(projection: Projection) {
        loadTiles('points', mapFeatureTileUrl, 14, projection);
    }


    // Return a promise that resolves when the image viewer (Mapillary JS) library has finished loading
    ensureViewerLoaded(context: coreContext) {
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

        _loadViewerPromise = new Promise<void>((resolve, reject) => {
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
    }


    // Load traffic sign image sprites
    loadSignResources(context: coreContext) {
        context.ui().svgDefs.addSprites(['mapillary-sprite'], false /* don't override colors */ );
        return this;
    }


    // Load map (point) feature image sprites
    loadObjectResources(context: coreContext) {
        context.ui().svgDefs.addSprites(['mapillary-object-sprite'], false /* don't override colors */ );
        return this;
    }


    // Remove previous detections in image viewer
    resetTags() {
        if (_mlyViewer && !_mlyFallback) {
            _mlyViewer.getComponent<TagComponent>('tag').removeAll();
        }
    }


    // Show map feature detections in image viewer
    showFeatureDetections(value: boolean) {
        _mlyShowFeatureDetections = value;
        if (!_mlyShowFeatureDetections && !_mlyShowSignDetections) {
            this.resetTags();
        }
    }


    // Show traffic sign detections in image viewer
    showSignDetections(value: boolean) {
        _mlyShowSignDetections = value;
        if (!_mlyShowFeatureDetections && !_mlyShowSignDetections) {
            this.resetTags();
        }
    }


    // Apply filter to image viewer
    filterViewer(context: coreContext) {
        const showsPano = context.photos().showsPanoramic();
        const showsFlat = context.photos().showsFlat();
        const fromDate = context.photos().fromDate();
        const toDate = context.photos().toDate();
        const filter: FilterExpression = ['all'];

        if (!showsPano) filter.push([ '!=', 'cameraType', 'spherical' ]);
        if (!showsFlat && showsPano) filter.push(['==', 'cameraType', 'spherical']);
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
    }


    // Make the image viewer visible
    showViewer(context: coreContext) {
        const wrap = context.container().select('.photoviewer');
        const isHidden = wrap.selectAll('.photo-wrapper.mly-wrapper.hide').size();

        if (isHidden && _mlyViewer) {
            for (const service of Object.values(services)) {
                if (service === this) continue;
                if (service && 'hideViewer' in service && typeof service.hideViewer === 'function') {
                    service.hideViewer(context);
                }
            }

            wrap.classed('hide', false)
                .selectAll('.photo-wrapper.mly-wrapper')
                .classed('hide', false);

            _mlyViewer.resize();
        }

        _isViewerOpen = true;
        return this;
    }


    // Hide the image viewer and resets map markers
    hideViewer(context: coreContext) {
        _mlyActiveImage = null;

        if (!_mlyFallback && _mlyViewer) {
            _mlyViewer.getComponent<SequenceComponent>('sequence').stop();
        }

        const viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(null);

        viewer
            .classed('hide', true)
            .selectAll('.photo-wrapper')
            .classed('hide', true);

        patchHash({ photo: null });

        dispatch.call('imageChanged');
        dispatch.call('loadedMapFeatures');
        dispatch.call('loadedSigns');

        _isViewerOpen = false;

        return this.setStyles(context, null);
    }


    // Get viewer status
    isViewerOpen() {
            return _isViewerOpen;
    }


    // Highlight the detection in the viewer that is related to the clicked map feature
    highlightDetection(detection: Detection) {
        if (detection) {
            _mlyHighlightedDetection = detection.id;
        }

        return this;
    }


    // Initialize image viewer (Mapillar JS)
    initViewer(context: coreContext) {
        if (!window.mapillary) return;

        const opts: ViewerOptions = {
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
                keyboard: false,
                pointer: false,
                sequence: false,
                tag: false,
                fallback: {
                    image: true,        // fallback
                    navigation: true    // fallback
                },
            };
        }

        _mlyViewer = new mapillary.Viewer(opts);
        _mlyViewer.on('image', imageChanged.bind(this));
        _mlyViewer.on('bearing', bearingChanged);

        if (_mlyViewerFilter) {
            _mlyViewer.setFilter(_mlyViewerFilter);
        }

        // Register viewer resize handler
        context.ui().photoviewer.on('resize.mapillary', function() {
            if (_mlyViewer) _mlyViewer.resize();
        });

        // imageChanged: called after the viewer has changed images and is ready.
        function imageChanged(this: any, photo: ViewerImageEvent) {
            this.resetTags();
            const image = photo.image;
            this.setActiveImage(image);
            this.setStyles(context, null);
            const loc = [image.originalLngLat.lng, image.originalLngLat.lat];
            context.map().centerEase(loc);
            patchHash({ photo: 'mapillary/' + image.id });

            if (_mlyShowFeatureDetections || _mlyShowSignDetections) {
                this.updateDetections(image.id, `${apiUrl}/${image.id}/detections?access_token=${accessToken}&fields=id,image,geometry,value`);
            }
            dispatch.call('imageChanged');
        }


        // bearingChanged: called when the bearing changes in the image viewer.
        function bearingChanged(e: ViewerBearingEvent) {
            dispatch.call('bearingChanged', undefined, e);
        }
    }


    // Move to an image
    selectImage(image: MlyImage) {
        if (!_mlyViewer || !image.id) return this;

        if (!image.unsafeId) {
            _mlyViewer.moveTo(image.id)
                .then(image => this.setActiveImage(image))
                .catch(function(e) {
                    console.error('mly3', e); // eslint-disable-line no-console
                });
        } else {
            fetch(`https://graph.mapillary.com/image_ids?sequence_id=${image.sequence_id}`, { headers: { 'Authorization': `OAuth ${accessToken}` } })
                .then(response => response.json() as Promise<{ data: MlyImage[] }>)
                .then(result => {
                    const correctedId = result.data.map(d => d.id).find(id =>
                        id.startsWith(`${image.id}`.substring(0, 10)));
                    if (!correctedId) {
                        console.error('unable to determine corrected photo id for'); // eslint-disable-line no-console
                    } else {
                        image.id = correctedId;
                        image.unsafeId = false;
                        this.selectImage(image);
                    };
                });
        }

        return this;
    }


    // Return the currently displayed image
    getActiveImage() {
        return _mlyActiveImage;
    }


    // Return a list of detection objects for the given id
    getDetections(id: string) {
        return loadData<DetectionWithImage>(`${apiUrl}/${id}/detections?access_token=${accessToken}&fields=id,value,image`);
    }


    // Set the currently visible image
    setActiveImage(image: Image) {
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
    }


    // Update the currently highlighted sequence and selected bubble.
    setStyles(context: coreContext, hovered?: MlyImage | null) {
        const hoveredImageId = hovered && hovered.id;
        const hoveredSequenceId = hovered && hovered.sequence_id;
        const selectedSequenceId = _mlyActiveImage && _mlyActiveImage.sequence_id;

        context.container().selectAll<SVGElement, MlyImage>('.layer-mapillary .viewfield-group')
            .classed('highlighted', function(d) { return (d.sequence_id === selectedSequenceId) || (d.id === hoveredImageId); })
            .classed('hovered', function(d) { return d.id === hoveredImageId; });

        context.container().selectAll<SVGElement, MlySequence>('.layer-mapillary .sequence')
            .classed('highlighted', function(d) { return d.properties.id === hoveredSequenceId; })
            .classed('currentView', function(d) { return d.properties.id === selectedSequenceId; });

        return this;
    }


    // Get detections for the current image and shows them in the image viewer
    updateDetections(imageId: string, url: string) {
        if (!_mlyViewer || _mlyFallback) return;
        if (!imageId) return;
        const cache = _mlyCache.image_detections;
        if (cache.forImageId[imageId]) {
            showDetections(_mlyCache.image_detections.forImageId[imageId]);
        } else {
            loadData<Detection>(url)
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
        function showDetections(detections: Detection[]) {
            const tagComponent = _mlyViewer.getComponent<TagComponent>('tag');
            detections.forEach(function(data) {
                const tag = makeTag(data);
                if (tag) {
                    tagComponent.add([tag]);
                }
            });
        }


        // Create a Mapillary JS tag object
        function makeTag(data: Detection) {
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
            const tile = new VectorTile(new PbfReader(uintArray.buffer));
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
    }


    // Return the current cache
    cache() {
        return _mlyCache;
    }
};
