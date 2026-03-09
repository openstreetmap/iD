import { dispatch as d3_dispatch } from 'd3-dispatch';
import RBush, { type BBox } from 'rbush';
import type { Tile } from '../util/tiler';
import { utilTiler, utilQsString, utilStringQs } from '../util';
import { planePhotoFrame } from './plane_photo';
import { services } from '.';
import type { Projection } from '../geo/raw_mercator';
import { searchLimited, type WithBbox } from '../util/partition';
import type { Vec2 } from '../geo/vector';
import { getRelativeDate } from '../util/date';
import { uiTooltip } from '../ui';
import { localeDateString } from '../renderer/background_source';

export interface CommonsPhoto {
    pageid: number;
    ns: number;
    title: string;
    index: number;
    coordinates: {
        lat: number;
        lon: number;
        primary: '';
        globe: 'earth';
    }[];
    imagerepository: 'local';
    imageinfo: {
        /** ISO Date */
        timestamp: string;
        user: string;
        size: number;
        width: number;
        height: number;
        thumburl: string;
        thumbwidth: number;
        thumbheight: number;
        responsiveUrls: { [size: number]: string; };
        url: string;
        descriptionurl: string;
        descriptionshorturl: string;
        metadata: { name: string; value: unknown }[];
        extmetadata: {
            LicenseShortName: {
                value: 'Public domain';
                source: 'commons-desc-page';
                hidden: '';
            };
        };
    }[];
}

interface ApiResponse {
    error?: {
        code: string;
        info: string;
        docref: string;
    };
    batchcomplete?: boolean;
    continue?: {
        iicontinue: string;
        cocontinue: string;
        continue: string;
    };
    query?: {
        pages: {
            [pageId: string]: CommonsPhoto;
        };
    };
}

export function getCommonsPhotoLoc(photo: CommonsPhoto): Vec2 {
    return [photo.coordinates[0].lon, photo.coordinates[0].lat];
}
export function getCommonsPhotoDate(photo: CommonsPhoto) {
    return new Date(photo.imageinfo[0].timestamp);
}


const minZoom = 10; // TODO: reconsider
const maxZoom = 20;

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



export default new class CommonsService {
    dispatch = d3_dispatch('loadedImages', 'viewerChanged');
    // @ts-expect-error -- hack
    on = (...args) => this.dispatch.on(...args);

    #photoViewer: ReturnType<typeof planePhotoFrame> | undefined;

    activeImage: CommonsPhoto | undefined;

    #createRequetUrl(bbox: BBox) {
        // docs: https://www.mediawiki.org/wiki/Extension:GeoData#API
        const qs = new URLSearchParams({
            format: 'json',
            formatversion: '2',
            origin: '*', // for CORS
            action: 'query',
            generator: 'geosearch',
            ggsnamespace: '6', // the `File:` namespace
            ggslimit: '500',
            ggsbbox: `${bbox.maxY}|${bbox.minX}|${bbox.minY}|${bbox.maxX}`,
            prop: 'coordinates|imageinfo',
            iiprop: 'extmetadata|metadata|size|timestamp|url|user',
            iiextmetadatafilter: 'LicenseShortName',
            iiurlwidth: '300',
        });
        return `https://commons.wikimedia.org/w/api.php?${qs}`;
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
        const tileId = tile.id;

        if (cache.loaded[tileId] || cache.inflight[tileId]) return;
        const controller = new AbortController();
        cache.inflight[tileId] = controller;

        // @ts-expect-error -- blocked by other PR
        const url = this.#createRequetUrl(tile.extent.bbox());

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                throw new Error(response.status + ' ' + response.statusText);
            }
            const data: ApiResponse = await response.json();

            if (data.error) {
                throw new Error(`${data.error.code}: ${data.error.info}`);
            }

            const newPhotos = Object
                .values(data.query?.pages || {})
                .filter(photo => photo.coordinates && photo.imageinfo); // TODO: temp hack, why are some missing coords?

            // load the API response into the cache
            for (const photo of newPhotos) {
                _cache.images.byPageId[photo.pageid] = photo;
            }
            _cache.images.rtree.load(Object.values(newPhotos).map(photo => {
                const [x, y] = getCommonsPhotoLoc(photo);
                return { minX: x, maxX: x, minY: y, maxY: y, data: photo };
            }));

            this.dispatch.call('loadedImages');
        } catch (ex) {
            console.error(ex); // eslint-disable-line no-console
        }
        cache.loaded[tileId] = true;
        delete cache.inflight[tileId];
    }

    reset() {
        Object.values(_cache.requests.inflight).forEach(request => request.abort());
        _cache = createCache();
    };

    /** get visible images from the cache */
    getImages(projection: Projection): CommonsPhoto[] {
        return searchLimited(5, projection, _cache.images.rtree).map(item => item.data);
    }

    getCachedImage(pageId: string) {
        return _cache.images.byPageId[pageId];
    }

    /** update the currently highlighted bubble */
    setStyles(context: iD.Context, hovered: CommonsPhoto | undefined) {
        context.container()
            .selectAll<HTMLElement, CommonsPhoto>('.layer-commons .viewfield-group')
            .classed('highlighted', (d) => d.pageid === hovered?.pageid)
            .classed('hovered', (d) => d.pageid === hovered?.pageid)
            .classed('currentView', (d) => d.pageid === this.activeImage?.pageid);

        context.container().selectAll('.layer-commons .viewfield-group .viewfield')
            .attr('d', 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0');
    }

    /** Updates the URL to save the current shown image */
    #updateUrlImage(pageid: number | undefined) {
        const hash = utilStringQs(window.location.hash);
        if (pageid) {
            hash.photo = `commons/${pageid}`;
        } else {
            delete hash.photo;
        }
        window.history.replaceState(null, '', `#${utilQsString(hash, true)}`);
    }

    /** Loads the selected image in the frame */
    selectImage(context: iD.Context, id: number | string) {
        const d = _cache.images.byPageId[id];

        this.activeImage = d;
        this.#updateUrlImage(d.pageid);

        const viewerLink = d.imageinfo[0].url;

        let viewer = context.container().select('.photoviewer');
        if (!viewer.empty()) viewer.datum(d);

        this.setStyles(context, undefined); // TODO: why?

        let wrap = context.container()
            .select('.photoviewer .commons-wrapper');


        this.#photoViewer!
            .showPhotoFrame(wrap)
            .selectPhoto({ image_path: viewerLink });

        let attribution = wrap.selectAll('.photo-attribution').text('');

        attribution
            .append('div')
            .attr('class', 'attribution-row');

        attribution
            .append('a')
            .attr('class', 'report-photo')
            .attr('href', d.imageinfo[0].descriptionurl)
            .attr('target', '_blank')
            .attr('rel', 'noopener')
            .text(d.imageinfo[0].extmetadata.LicenseShortName.value);

        attribution
            .append('span')
            .text('|');

        attribution
            .append('span')
            .text(getRelativeDate(new Date(d.imageinfo[0].timestamp)))
            .call(uiTooltip()
                .title(() => localeDateString(d.imageinfo[0].timestamp))
                .placement('top'));

        attribution
            .append('span')
            .text('|');

        attribution
            .append('a')
            .attr('class', 'image-link')
            .attr('target', '_blank')
            .attr('rel', 'noopener')
            .attr('href', `https://commons.wikimedia.org/wiki/User:${d.imageinfo[0].user}`)
            .text(`User:${d.imageinfo[0].user}`);

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

        let imgWrap = context.container()
            .select('#ideditor-viewer-commons-simple > img');

        if (!imgWrap.empty()) imgWrap.remove();

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
        this.#updateUrlImage(undefined);
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
