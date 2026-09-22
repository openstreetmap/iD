import { dispatch as d3_dispatch } from 'd3-dispatch';
import type { Feature, LineString, Point } from 'geojson';
import { PbfReader } from 'pbf';
import RBush from 'rbush';
import { VectorTile } from '@mapbox/vector-tile';
import { utilRebind, utilTiler, utilUniqueDomId } from '../util';
import { geoExtent } from '../geo';
import { t } from '../core/localizer';
import { pannellumPhotoFrame, type PhotoFrame, type PhotoFramePhoto } from './pannellum_photo';
import { planePhotoFrame } from './plane_photo';
import { services } from './';
import { partitionViewport, type WithBbox } from '../util/partition';
import { localeDateString } from '../util/date';
import { patchHash } from '../behavior';
import type { Projection } from '../geo/raw_mercator';
import type { Tile } from '../util/tiler';
import type { coreContext } from '../core';
import type { Vec2 } from '../geo/vector';


const apiUrl = 'https://api.panoramax.xyz/';
const tileUrl = apiUrl + 'api/map/{z}/{x}/{y}.mvt';
const imageDataUrl = apiUrl + 'api/collections/{collectionId}/items/{itemId}';
const sequenceDataUrl = apiUrl + 'api/collections/{collectionId}/items?limit=1000';
const userIdUrl = apiUrl + 'api/users/search?q={username}';
const usernameURL = apiUrl + 'api/users/{userId}';
const viewerUrl = apiUrl;

const highDefinition = 'hd';
const standardDefinition = 'sd';

const pictureLayer = 'pictures';
const sequenceLayer = 'sequences';

const minZoom = 10;
const imageMinZoom = 15;
const lineMinZoom = 10;
const dispatch = d3_dispatch('loadedImages', 'loadedLines', 'viewerChanged');

interface PanoramaxUser {
    id: string;
    name: string;
}

type RawPanoramaxImage = Feature<Point, {
    id: string;
    ts: string;
    type: 'equirectangular' | 'flat';
    model: string;
    first_sequence: string;
    account_id: string;
    heading: string;
}>
export type RawPanoramaxSequence = Feature<LineString, {
    type: 'equirectangular' | 'flat';
    id: string;
    date: string;
    account_id: string;
}>;

export interface PanoramaxImage extends PhotoFramePhoto {
    service: 'photo';
    loc: Vec2;
    capture_time: string;
    capture_time_parsed: Date;
    id: string;
    account_id: string;
    sequence_id: string;
    heading: number;
    image_path: string;
    isPano: boolean;
    model: string;
}

interface Link {
    id: string;
    rel: 'prev' | 'next';
    href: string;
}

interface PanoramaxImageData {
    id: string;
    links: Link[];
    assets: {
        [id: string]: Link;
    }
}


interface Cache {
    users: {
        [userId: string]: PanoramaxUser;
    };
    images: {
        rtree: RBush<WithBbox<PanoramaxImage>>;
        forImageId: {
            [imageId: string]: PanoramaxImage;
        };
    };
    sequences: {
        rtree: RBush<unknown>;
        lineString: {
            [id: string]: RawPanoramaxSequence[];
        };
        items: {
            [collectionId: string]: PanoramaxImageData[];
        };
    };
    mockSequences: Omit<Cache['sequences'], 'items'>;
    requests: {
        loaded: {
            [tileId: string]: boolean;
        };
        inflight: {
            [tileId: string]: AbortController;
        }
    };
}

let _cache: Cache;
let _loadViewerPromise: Promise<void>;
let _definition = standardDefinition;
let _isHD = false;

let _planeFrame: PhotoFrame;
let _pannellumFrame: PhotoFrame;
let _currentFrame: PhotoFrame;

let _currentScene: {
    currentImage: Link | null;
    nextImage: Link | null;
    prevImage: Link | null;
} = {
    currentImage : null,
    nextImage : null,
    prevImage : null
};

let _activeImage: Pick<PanoramaxImage, 'id' | 'sequence_id' | 'loc'> | undefined | null;
let _isViewerOpen = false;


/**
 * Return no more than `limit` results per partition.
 * @param {number} limit Number of maximum objects to return
 * @param {*} projection Current projection
 * @param {*} rtree The cache
 * @returns Data found
 */
function searchLimited(limit: number, projection: Projection, rtree: RBush<WithBbox<PanoramaxImage>>): PanoramaxImage[] {
    limit = limit || 5;

    return partitionViewport(projection)
        .reduce<PanoramaxImage[]>(function(result, extent) {
            let found = rtree.search(extent.bbox());
            const spacing = Math.max(1, Math.floor(found.length / limit));
            const matching = found
                .filter((d, idx) => idx % spacing === 0 ||
                                    d.data.id === _activeImage?.id)
                .sort((a, b) => {
                    if (a.data.id === _activeImage?.id) return -1;
                    if (b.data.id === _activeImage?.id) return  1;
                    return 0;
                })
                .slice(0, limit)
                .map(d => d.data);

            return (matching.length ? result.concat(matching) : result);
        }, []);
}

/**
 * Load all data for the specified type from Panoramax vector tiles
 * @param {string} which Either 'images' or 'lines'
 * @param {string} url Tile endpoint
 * @param {number} maxZoom Maximum zoom out
 * @param {*} projection Current projection
 * @param {number} zoom current zoom
 */
function loadTiles(which: 'images' | 'line', url: string, maxZoom: number, projection: Projection, zoom?: number) {
    const tiler = utilTiler().zoomExtent([minZoom, maxZoom]).skipNullIsland(true);
    const tiles = tiler.getTiles(projection);

    tiles.forEach(function(tile) {
        loadTile(which, url, tile, zoom);
    });
}

/**
 * Load all data for the specified type from one vector tile
 * @param {*} which Either 'images' or 'lines'
 * @param {*} url Tile endpoint
 * @param {*} tile Current tile
 * @param {*} zoom Current zoom
 */
function loadTile(which: string, url: string, tile: Tile, zoom?: number) {
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

            loadTileDataToCache(data, tile, zoom);

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

/**
 * Fetches all data for the specified tile and adds them to cache
 * @param {*} data Tile data
 * @param {*} tile Current tile
 * @param {*} zoom Current zoom
 */
function loadTileDataToCache(data: ArrayBuffer, tile: Tile, zoom?: number) {
    const vectorTile = new VectorTile(new PbfReader(data));

    if (Object.hasOwnProperty.call(vectorTile.layers, pictureLayer)) {
        const features: WithBbox<PanoramaxImage>[] = [];
        const cache = _cache.images;
        const layer = vectorTile.layers[pictureLayer];

        for (let i = 0; i < layer.length; i++) {
            const feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]) as RawPanoramaxImage;
            const loc = feature.geometry.coordinates as Vec2;

            const d: PanoramaxImage = {
                service: 'photo',
                loc: loc,
                capture_time: feature.properties.ts,
                capture_time_parsed: new Date(feature.properties.ts),
                id: feature.properties.id,
                account_id: feature.properties.account_id,
                sequence_id: feature.properties.first_sequence,
                heading: parseInt(feature.properties.heading, 10),
                image_path: '',
                isPano: feature.properties.type === 'equirectangular',
                model: feature.properties.model,
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

    if (Object.hasOwnProperty.call(vectorTile.layers, sequenceLayer)) {

        let cache: typeof _cache.mockSequences = _cache.sequences;

        if (typeof zoom === 'number' && zoom >= lineMinZoom && zoom < imageMinZoom) cache = _cache.mockSequences;

        const layer = vectorTile.layers[sequenceLayer];

        for (let i = 0; i < layer.length; i++) {
            const feature = layer.feature(i).toGeoJSON(tile.xyz[0], tile.xyz[1], tile.xyz[2]) as RawPanoramaxSequence;
            if (cache.lineString[feature.properties.id]) {
                cache.lineString[feature.properties.id].push(feature);
            } else {
                cache.lineString[feature.properties.id] = [feature];
            }
        }
    }
}

/**
 * Fetches the username from Panoramax
 * @param {string} userId
 * @returns the username
 */
async function getUsername(userId: string) {
    const cache = _cache.users;
    if (cache[userId]) return cache[userId].name;

    const requestUrl = usernameURL.replace('{userId}', userId);

    const response = await fetch(requestUrl, { method: 'GET' });
    if (!response.ok) {
        throw new Error(response.status + ' ' + response.statusText);
    }
    const data = await response.json();
    cache[userId] = data;

    return data.name;
}

export default new class {
    event!: Pick<typeof dispatch, 'on'>;

    init() {
        if (!_cache) {
            this.reset();
        }

        this.event = utilRebind(this, dispatch, 'on');
    }

    reset() {
        if (_cache) {
            Object.values(_cache.requests.inflight).forEach(function(request) { request.abort(); });
        }

        _cache = {
            images: { rtree: new RBush(), forImageId: {} },
            sequences: { rtree: new RBush(), lineString: {}, items: {} },
            users: {},
            mockSequences: { rtree: new RBush(), lineString: {} },
            requests: { loaded: {}, inflight: {} }
        };
    }

    /**
     * Get visible images from cache
     * @param {*} projection Current Projection
     * @returns images data for the current projection
     */
    images(projection: Projection) {
        const limit = 5;
        return searchLimited(limit, projection, _cache.images.rtree);
    }

    /**
     * Get a specific image from cache
     * @param {*} imageKey the image id
     */
    cachedImage(imageKey: string) {
        return _cache.images.forImageId[imageKey];
    }

    /**
     * Fetches images data for the visible area
     * @param {*} projection Current Projection
     */
    loadImages(projection: Projection) {
        loadTiles('images', tileUrl, imageMinZoom, projection);
    }

    /**
     * Fetches sequences data for the visible area
     * @param {*} projection Current Projection
     */
    loadLines(projection: Projection, zoom: number) {
        loadTiles('line', tileUrl, lineMinZoom, projection, zoom);
    }

    /**
     * Fetches all possible userIDs from Panoramax
     * @param {string} usernames one or multiple usernames
     * @returns userIDs
     */
    async getUserIds(usernames: string[]) {
        const requestUrls = usernames.map(username =>
            userIdUrl.replace('{username}', username));

        const responses = await Promise.all(requestUrls.map(requestUrl =>
            fetch(requestUrl, { method: 'GET' })));
        if (responses.some(response => !response.ok)) {
            const response = responses.find(response => !response.ok)!;
            throw new Error(response.status + ' ' + response.statusText);
        }
        const data = await Promise.all(responses.map(response => response.json() as Promise<{ features: PanoramaxUser[] }>));
        // in panoramax, a username can have multiple ids, when the same name is
        // used on different servers
        return data.flatMap((d, i) => d.features.filter(f => f.name === usernames[i]).map(f => f.id));
    }

    /**
     * Get visible sequences from cache
     * @param {*} projection Current Projection
     * @param {number} zoom Current zoom (if zoom < `lineMinZoom` less accurate lines will be drawn)
     * @returns sequences data for the current projection
     */
    sequences(projection: Projection, zoom: number) {
        const viewport = projection.clipExtent();
        const min: Vec2 = [viewport[0][0], viewport[1][1]];
        const max: Vec2 = [viewport[1][0], viewport[0][1]];
        const bbox = geoExtent(projection.invert(min), projection.invert(max)).bbox();
        const sequenceIds: { [sequenceId: string]: true } = {};
        let lineStrings: RawPanoramaxSequence[] = [];

        if (zoom >= imageMinZoom){
            _cache.images.rtree.search(bbox).forEach(function(d) {
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
        if (zoom >= lineMinZoom){
            Object.keys(_cache.mockSequences.lineString).forEach(function(sequenceId) {
                lineStrings = lineStrings.concat(_cache.mockSequences.lineString[sequenceId]);
            });
        }
        return lineStrings;
    }

    /**
     * Updates the data for the currently visible image
     */
    setActiveImage(image: PanoramaxImage | null) {
        if (image && image.id && image.sequence_id) {
            _activeImage = {
                id: image.id,
                sequence_id: image.sequence_id,
                loc: image.loc
            };
        } else {
            _activeImage = null;
        }
    }

    getActiveImage() {
        return _activeImage;
    }

    /**
     * Update the currently highlighted sequence and selected bubble
     * @param {*} context Current HTML context
     * @param {*} [hovered] The hovered bubble image
     */
    setStyles(context: coreContext, hovered: PanoramaxImage | null) {
        const hoveredImageId =  hovered && hovered.id;
        const hoveredSequenceId = hovered && hovered.sequence_id;
        const selectedSequenceId = _activeImage && _activeImage.sequence_id;
        const selectedImageId = _activeImage && _activeImage.id;

        const markers = context.container().selectAll<HTMLElement, PanoramaxImage>('.layer-panoramax .viewfield-group');
        const sequences = context.container().selectAll<HTMLElement, RawPanoramaxSequence>('.layer-panoramax .sequence');

        markers
            .classed('highlighted', function(d) { return d.sequence_id === selectedSequenceId || d.id === hoveredImageId; })
            .classed('hovered', function(d) { return d.id === hoveredImageId; })
            .classed('currentView', function(d) { return d.id === selectedImageId; });

        sequences
            .classed('highlighted', function(d) { return d.properties.id === hoveredSequenceId; })
            .classed('currentView', function(d) { return d.properties.id === selectedSequenceId; });

        // update viewfields if needed
        context.container().selectAll<SVGPathElement, unknown>('.layer-panoramax .viewfield-group .viewfield')
            .attr('d', viewfieldPath);

        function viewfieldPath(this: SVGPathElement) {
            let d = this.parentNode!.__data__;
            if (d.isPano && d.id !== selectedImageId) {
                return 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
            } else {
                return 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';
            }
        }
        return this;
    }

    // Get viewer status
    isViewerOpen() {
        return _isViewerOpen;
    }

    /**
     * Loads the selected image in the frame
     * @param {*} context Current HTML context
     * @param {*} id of the selected image
     * @returns
     */
    selectImage(context: coreContext, id: string) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let that = this;

        let d = that.cachedImage(id);
        that.setActiveImage(d);
        patchHash({ photo: 'panoramax/' + d.id });

        const viewerLink = `${viewerUrl}#pic=${d.id}&focus=pic`;

        let viewer = context.container()
            .select('.photoviewer');

        if (!viewer.empty()) viewer.datum(d);

        this.setStyles(context, null);

        if (!d) return this;

        let wrap = context.container()
            .select<HTMLElement>('.photoviewer .panoramax-wrapper');

        let attribution = wrap.selectAll('.photo-attribution').text('');

        let line1 = attribution
            .append('div')
            .attr('class', 'attribution-row');

        const hdDomId = utilUniqueDomId('panoramax-hd');

        let label = line1
            .append('label')
            .attr('for', hdDomId)
            .attr('class', 'panoramax-hd');

        label
            .append('input')
            .attr('type', 'checkbox')
            .attr('id', hdDomId)
            .property('checked', _isHD)
            .on('click', (d3_event) => {
                d3_event.stopPropagation();
                _isHD = !_isHD;
                _definition = _isHD ? highDefinition : standardDefinition;
                that.selectImage(context, d.id)
                    .showViewer(context);
            });

        label
            .append('span')
            .call(t.append('panoramax.hd'));

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
            .attr('class', 'report-photo')
            .attr('href', 'mailto:signalement.ign@panoramax.fr')
            .call(t.append('panoramax.report'));

        attribution
            .append('span')
            .text('|');

        attribution
            .append('a')
            .attr('class', 'image-link')
            .attr('target', '_blank')
            .attr('href', viewerLink)
            .text('panoramax.xyz');

        this.getImageData(d.sequence_id, d.id).then(function(data) {
            _currentScene = {
                currentImage: null,
                nextImage: null,
                prevImage: null
            };
            _currentScene.currentImage = data.assets[_definition];
            const nextIndex = data.links.findIndex(x => x.rel === 'next');
            const prevIndex = data.links.findIndex(x => x.rel === 'prev');

            if (nextIndex !== -1){
                _currentScene.nextImage = data.links[nextIndex];
            }
            if (prevIndex !== -1){
                _currentScene.prevImage = data.links[prevIndex];
            }

            d.image_path = _currentScene.currentImage!.href;

            wrap
                .selectAll('button.back')
                .classed('hide', _currentScene.prevImage === null);
            wrap
                .selectAll('button.forward')
                .classed('hide', _currentScene.nextImage === null);

            _currentFrame = d.isPano ? _pannellumFrame : _planeFrame;

            _currentFrame
                .showPhotoFrame(wrap)
                .selectPhoto(d, true);
        });

        if (d.account_id) {
            attribution
                .append('span')
                .text('|');

            let line2 = attribution
                .append('span')
                .attr('class', 'attribution-row');

            getUsername(d.account_id).then(function(username){
                line2
                    .append('span')
                    .attr('class', 'captured_by')
                    .text('@' + username);
            });
        }

        return this;
    }

    photoFrame() {
        return _currentFrame;
    }

    /**
     * Fetches the data for a specific image
     * @param {*} collectionId
     * @param {*} imageId
     * @returns The fetched image data
     */
    async getImageData(collectionId: string, imageId: string) {
        const cache = _cache.sequences.items;
        if (cache[collectionId]) {
            const cached = cache[collectionId]
                .find(d => d.id === imageId);
            if (cached) return cached;
        } else {
            // prime the cache with data from sequence
            const response = await fetch(sequenceDataUrl
                .replace('{collectionId}', collectionId),
                { method: 'GET' });

            if (!response.ok) {
                throw new Error(response.status + ' ' + response.statusText);
            }
            const data = (await response.json()).features;
            cache[collectionId] = data;
        }

        const result = cache[collectionId]
            .find(d => d.id === imageId);
        if (result) return result;

        // not found in sequence: retry to load single item data
        // ideally, we'd use the `withPicture` parameter, but it is buggy:
        // https://gitlab.com/panoramax/server/api/-/issues/268
        const itemResponse = await fetch(imageDataUrl
            .replace('{collectionId}', collectionId)
            .replace('{itemId}', imageId),
            { method: 'GET' });

        if (!itemResponse.ok) {
            throw new Error(itemResponse.status + ' ' + itemResponse.statusText);
        }
        const itemData: PanoramaxImageData = await itemResponse.json();
        cache[collectionId].push(itemData);
        return itemData;
    }

    ensureViewerLoaded(context: coreContext) {

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let that = this;

        let imgWrap = context.container()
            .select('#ideditor-viewer-panoramax-simple > img');

        if (!imgWrap.empty()) {
            imgWrap.remove();
        }

        if (_loadViewerPromise) return _loadViewerPromise;

        let wrap = context.container()
            .select('.photoviewer')
            .selectAll('.panoramax-wrapper')
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

        // Register viewer resize handler
        _loadViewerPromise = Promise.all([
            pannellumPhotoFrame(context, wrapEnter),
            planePhotoFrame(context, wrapEnter)
          ]).then(([pannellumPhotoFrame, planePhotoFrame]) => {
            _pannellumFrame = pannellumPhotoFrame;
            _pannellumFrame.event.on('viewerChanged', () => dispatch.call('viewerChanged'));
            _planeFrame = planePhotoFrame;
            _planeFrame.event.on('viewerChanged', () => dispatch.call('viewerChanged'));
          });

        /**
         * Loads the next image in the sequence
         * @param {number} stepBy '-1' if backwards or '1' if forward
         * @returns
         */
        function step(stepBy: number) {
            return function () {
                if (!_currentScene.currentImage) return;

                let nextId: string | undefined;
                if (stepBy === 1) nextId = _currentScene.nextImage?.id;
                else nextId = _currentScene.prevImage?.id;

                if (!nextId) return;

                const nextImage = _cache.images.forImageId[nextId];

                if (nextImage){
                    context.map().centerEase(nextImage.loc);
                    that.selectImage(context, nextImage.id);
                }
            };
        }

        return _loadViewerPromise;
    }

    /**
     * Shows the current viewer if hidden
     */
    showViewer(context: coreContext) {
        const wrap = context.container().select('.photoviewer');
        const isHidden = wrap.selectAll('.photo-wrapper.panoramax-wrapper.hide').size();
        if (isHidden) {
            for (const service of Object.values(services)) {
                if (service === this) continue;
                if (service && 'hideViewer' in service && typeof service.hideViewer === 'function') {
                    service.hideViewer(context);
                }
            }
            wrap.classed('hide', false)
                .selectAll('.photo-wrapper.panoramax-wrapper')
                .classed('hide', false);
        }

        _isViewerOpen = true;
        return this;
    }

    /**
     * Hides the current viewer if shown, resets the active image and sequence
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

        this.setActiveImage(null);
        _isViewerOpen = false;

        return this.setStyles(context, null);
    }

    cache() {
        return _cache;
    }
};
