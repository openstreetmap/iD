import RBush, { type BBox } from 'rbush';
import type { Tile } from '../util/tiler';
import { utilTiler, utilUniqueDomId } from '../util';
import { planePhotoFrame } from './plane_photo';
import { services } from '.';
import type { Projection } from '../geo/raw_mercator';
import { searchLimited, type WithBbox } from '../util/partition';
import type { Vec2 } from '../geo/vector';
import { getRelativeDate, localeDateString } from '../util/date';
import { uiTooltip } from '../ui';
import { t } from '../core';
import { EventDispatcher } from '../util/class';
import { patchHash } from '../behavior';
import type { PhotoFrame } from './pannellum_photo';
import { encodeWikimediaPageTitle } from './wikipedia';
import type { IStreetSide } from './streetside.def';

/** this is what the API returns */
export interface RawCommonsPhoto {
    pageid: number;
    ns: number;
    title: string;
    index: number;
    /** if coordinates don't exist here, they might still exist in the EXIF data */
    coordinates?: {
        lat: number;
        lon: number;
        primary: boolean;
        globe: 'earth';
    }[];
    imagerepository: 'local';
    imageinfo?: {
        /** ISO Date */
        timestamp: string;
        user: string;
        mediatype: 'BITMAP' | 'DRAWING' | 'AUDIO' | 'VIDEO' | 'MULTIMEDIA' | 'UNKNOWN' | 'OFFICE' | 'TEXT' | 'EXECUTABLE' | 'ARCHIVE' | '3D';
        metadata: { name: string; value: unknown }[] | null;
    }[];
}

/** this is our modified version of the original data structure */
export interface CommonsPhoto {
    photo: RawCommonsPhoto;
    loc: Vec2;
    date: Date;
    heading: number | undefined;
}

interface ApiResponse {
    error?: {
        code: string;
        info: string;
        docref: string;
    };
    batchcomplete?: boolean;
    continue?: Record<string, string>;
    query?: {
        pages: RawCommonsPhoto[];
    };
}
interface Cache {
    images: {
        rtree: RBush<WithBbox<CommonsPhoto>>;
        byPageId: { [pageId: string]: CommonsPhoto };
    };
    requests: {
        loaded: { [tileId: string]: true };
        inflight: { [tileId: string]: AbortController };
    };
};

function createCache(): Cache {
    return {
        images: { rtree: new RBush(), byPageId: {} },
        requests: { loaded: {}, inflight: {} }
    };
}
let _cache = createCache();

const BASE_URL = 'https://commons.wikimedia.org';
const THUMBNAIL_SIZE = 330; // https://mediawiki.org/wiki/Common_thumbnail_sizes


/**
 * Some devices store floats as a fraction like `45/360`.
 * this parser is a bit verbose, but safer than `eval()`
 */
export function parseExifNumber(raw: unknown) {
    if (typeof raw === 'number') return raw;
    if (typeof raw !== 'string' || raw === '') return undefined;

    // simple numeric value
    if (!Number.isNaN(+raw)) return +raw;

    // fraction
    if (/^[\d.]+\/[\d.]+$/.test(raw)) {
        const [numerator, denominator] = raw.split('/').map(Number);
        if (denominator === 0) return 0; // prevent ÷0 error
        return numerator / denominator;
    }

    return undefined;
}

/** EXIF uses `YYYY:MM:DD HH:mm:ss` */
export function parseExifDate(raw: unknown) {
    if (typeof raw !== 'string') return undefined;

    const re = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
    if (!re.test(raw)) return undefined;

    // there's no timezone info, so we (wrongly) assume all date
    // are UTC, since we don't need the exact date.
    const date = new Date(raw.replace(re, '$1-$2-$3T$4:$5:$6Z'));
    if (Number.isNaN(+date)) return undefined;

    return date;
}


// tilesize doesn't really matter for the commons API, because it
// supports pagination if the tile has too much data.
// So we specify a single zoom level, larger is better to avoid
// pointless API requests.
const [minZoom, maxZoom] = [16, 16];


export default new class CommonsService extends EventDispatcher<{ loadedImages: []; viewerChanged: []; }> implements IStreetSide {
    constructor() {
        super('loadedImages', 'viewerChanged');
    }

    #hires = false;

    #photoViewer: PhotoFrame | undefined;

    activeImage: CommonsPhoto | undefined;

    init() {}

    #createRequetUrl(bbox: BBox, pagination?: ApiResponse['continue']) {
        // docs: https://www.mediawiki.org/wiki/Extension:GeoData#API
        const qs = new URLSearchParams({
            format: 'json',
            formatversion: '2',
            origin: '*', // for CORS
            action: 'query',
            generator: 'geosearch',
            ggsnamespace: '6', // the `File:` namespace
            ggsbbox: `${bbox.maxY}|${bbox.minX}|${bbox.minY}|${bbox.maxX}`,

            // we're called two 'props', quasi two separate APIs,
            // so the limit must be the same for pagination to work.
            ggslimit: '500',
            colimit: '500',
            prop: 'coordinates|imageinfo',
            iiprop: 'mediatype|metadata|timestamp|user', // extmetadata is not included, since we don't need license filtering
            // iiextmetadatafilter: 'LicenseShortName|AttributionRequired',
            // iiurlwidth: `${THUMBNAIL_SIZE}`,
            ...pagination,
        });
        return `${BASE_URL}/w/api.php?${qs}`;
    }

    static parsePhoto(photo: RawCommonsPhoto): CommonsPhoto | undefined {
        const imageinfo = photo.imageinfo?.[0];
        const coordinates = photo.coordinates?.[0];

        if (!imageinfo || !coordinates) return undefined;
        if (imageinfo.mediatype !== 'BITMAP') return undefined;

        const exif = Object.fromEntries(imageinfo.metadata?.map(i => [i.name, i.value]) || []);

        return {
            photo: photo,
            loc: [coordinates.lon, coordinates.lat],
            heading: parseExifNumber(exif.GPSImgDirection),
            // fallback to the upload date if the EXIF metadata has no capture date
            date: parseExifDate(exif.DateTimeOriginal) || new Date(imageinfo.timestamp),
        };
    }

    loadTiles(projection: Projection) {
        const tiler = utilTiler()
            .zoomExtent([minZoom, maxZoom])
            .skipNullIsland(true);

        const tiles = tiler.getTiles(projection);
        if (!tiles) return;
        for (const tile of tiles) {
            this.#loadTile(tile);
        }
    }

    cachedImage(pageId: string) {
        return _cache.images.byPageId[pageId];
    }

    async #loadTile(tile: Tile) {
        const cache = _cache.requests;

        if (cache.loaded[tile.id] || cache.inflight[tile.id]) return;
        const controller = new AbortController();
        cache.inflight[tile.id] = controller;

        try {
            const pages: Record<number, RawCommonsPhoto> = {};
            let pagination: ApiResponse['continue'];
            do {
                const url = this.#createRequetUrl(tile.extent.bbox(), pagination);
                const response = await fetch(url, { signal: controller.signal });
                if (!response.ok) {
                    throw new Error(response.status + ' ' + response.statusText);
                }
                const data: ApiResponse = await response.json();

                if (data.error) {
                    throw new Error(`${data.error.code}: ${data.error.info}`);
                }

                for (const page of data.query?.pages || []) {
                    const existing = pages[page.pageid];
                    if (existing) {
                        // merge
                        pages[page.pageid] = {
                            ...existing,
                            ...page,
                            coordinates: [...existing.coordinates || [], ...page.coordinates || []],
                            imageinfo: existing.imageinfo || page.imageinfo,
                        };
                    } else {
                        // new
                        pages[page.pageid] = page;
                    }
                }

                pagination = data.continue;
            } while (pagination);

            const newPhotos = Object.values(pages)
                .map(CommonsService.parsePhoto)
                .filter(item => !!item) // remove invalid photos
                .filter(item => !_cache.images.byPageId[item.photo.pageid]); // deduplicate

            // load the API response into the cache
            for (const photo of newPhotos) {
                _cache.images.byPageId[photo.photo.pageid] = photo;
            }
            _cache.images.rtree.load(newPhotos.map(photo => {
                const [x, y] = photo.loc;
                return { minX: x, maxX: x, minY: y, maxY: y, data: photo };
            }));
            cache.loaded[tile.id] = true;

            this.dispatch.call('loadedImages');
        } catch (ex) {
            console.error(ex); // eslint-disable-line no-console
        } finally {
            delete cache.inflight[tile.id];
        }
    }

    reset() {
        Object.values(_cache.requests.inflight).forEach(request => request.abort());
        _cache = createCache();
    };

    /** get visible images from the cache */
    getImages(projection: Projection): CommonsPhoto[] {
        return searchLimited(5, projection, _cache.images.rtree);
    }

    /** update the currently highlighted bubble */
    setStyles(context: iD.Context, hovered: CommonsPhoto | undefined) {
        context.container()
            .selectAll<HTMLElement, CommonsPhoto>('.layer-commons .viewfield-group')
            .classed('highlighted', (d) => d === hovered)
            .classed('hovered', (d) => d === hovered)
            .classed('currentView', (d) => d.photo.pageid === this.activeImage?.photo.pageid);
    }

    /** Loads the selected image in the frame */
    selectImage(context: iD.Context, id: number | string) {
        const d = _cache.images.byPageId[id];

        this.activeImage = d;
        patchHash({ photo: `commons/${d.photo.pageid}` });

        const qs = this.#hires ? '' : `width=${THUMBNAIL_SIZE}`;
        const viewerLink = `${BASE_URL}/wiki/Special:FilePath/${encodeWikimediaPageTitle(d.photo.title)}?${qs}`;

        let viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(d);

        this.setStyles(context, undefined);

        let wrap = context.container()
            .select<HTMLElement>('.photoviewer .commons-wrapper');


        this.#photoViewer!
            .showPhotoFrame(wrap)
            .selectPhoto({ image_path: viewerLink });

        let attribution = wrap.selectAll('.photo-attribution').text('');

        let line1 = attribution
            .append('div')
            .attr('class', 'attribution-row');

        if (d.photo.imageinfo) {
            const hiresDomId = utilUniqueDomId('commons-hires');

            // Add hires checkbox
            let label = line1
                .append('label')
                .attr('for', hiresDomId)
                .attr('class', 'streetside-hires');

            label
                .append('input')
                .attr('type', 'checkbox')
                .attr('id', hiresDomId)
                .property('checked', this.#hires)
                .on('click', (d3_event) => {
                    d3_event.stopPropagation();

                    this.#hires = !this.#hires;
                    // const _resolution = this.hires ? 1024 : 512;
                    // wrap.call(setupCanvas, true);

                    this
                        .selectImage(context, d.photo.pageid)
                        .showViewer(context);
                });

            label
                .append('span')
                .call(t.append('streetside.hires'));

        } else {
            line1.append('div'); // flexbox spacer
        }


        const line1Right = line1.append('div');

        line1Right
            .append('span')
            .text(getRelativeDate(d.date))
            .call(uiTooltip()
                .title(() => localeDateString(d.date))
                .placement('top'));

        line1Right
            .append('span')
            .text('|');

        if (d.photo.imageinfo) {
            line1Right
                .append('a')
                .attr('class', 'image-link')
                .attr('target', '_blank')
                .attr('rel', 'noopener')
                .attr('href', `${BASE_URL}/wiki/User:${encodeWikimediaPageTitle(d.photo.imageinfo[0].user)}`)
                .text(`User:${d.photo.imageinfo[0].user}`);
        }

        let line2 = attribution
            .append('div')
            .attr('class', 'attribution-row');

        line2.append('div');

        line2
            .append('a')
            .attr('href', `${BASE_URL}/wiki/${encodeWikimediaPageTitle(d.photo.title)}`)
            .attr('target', '_blank')
            .attr('rel', 'noopener')
            .text(d.photo.title);

        return this;
    }

    showViewer(context: iD.Context) {
        const wrap = context.container().select('.photoviewer');
        const isHidden = wrap.selectAll('.photo-wrapper.commons-wrapper.hide').size();

        if (isHidden) {
            // hide the photo viewers from any other service
            for (const service of Object.values(services)) {
                if (service === this) continue;
                if ('hideViewer' in service) {
                    service.hideViewer(context);
                }
            }
            wrap
                .classed('hide', false)
                .selectAll('.photo-wrapper.commons-wrapper')
                .classed('hide', false);
        }

        return this;
    }


    #isLoaded = false;
    // eslint-disable-next-line require-await
    async ensureViewerLoaded(context: iD.Context) {
        if (this.#isLoaded) return;
        this.#isLoaded = true;

        let wrap = context.container()
            .select('.photoviewer')
            .selectAll('.commons-wrapper')
            .data([0]);

        let wrapEnter = wrap.enter()
            .append('div')
            .attr('class', 'photo-wrapper commons-wrapper')
            .classed('hide', true)
            .on('dblclick.zoom', null);

        wrapEnter
            .append('div')
            .attr('class', 'photo-attribution fillD');

        this.#photoViewer = planePhotoFrame(context, wrapEnter);
        this.#photoViewer.event.on('viewerChanged', () => this.dispatch.call('viewerChanged'));
    }

    /** Hides the current viewer if shown, resets the active image and sequence */
    hideViewer(context: iD.Context) {
        let viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(null);
        patchHash({ photo: null });
        viewer
            .classed('hide', true)
            .selectAll('.photo-wrapper')
            .classed('hide', true);
        context.container().selectAll('.viewfield-group, .sequence, .icon-sign')
            .classed('currentView', false);

        this.activeImage = undefined;

        this.setStyles(context, undefined);
    }
};
