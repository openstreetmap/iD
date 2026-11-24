import { select } from 'd3-selection';
import { dispatch } from 'd3-dispatch';

describe('iD.serviceMapilio panorama viewfield', function() {
    let mapilio, container, context, surface, draw, frames, viewer, originalHash, mapTransformed;
    const photos = [
        { id: 41, sequence_id: 'sequence', created_by_id: 447, loc: [0, 0], heading: 350, isPano: true },
        { id: 42, sequence_id: 'sequence', created_by_id: 447, loc: [0, 0.001], heading: 0, isPano: true },
        { id: 43, sequence_id: 'sequence', created_by_id: 447, loc: [0, 0.002], heading: 90, isPano: false },
        { id: 44, sequence_id: 'sequence', created_by_id: 447, loc: [0, 0.003], heading: null, isPano: true }
    ];
    const circle = 'M 8,13 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0';
    const flat = 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z';

    // Pannellum needs WebGL; keep its documented scene/event boundary as a double.
    function panoramaViewer(options) {
        const scenes = options.scenes;
        const listeners = {};
        let scene = options.default.firstScene;
        let config = { ...scenes[scene] };
        const result = {
            loaded: false,
            yaw: 0,
            hfov: 60,
            on(type, handler) {
                (listeners[type] ||= []).push(handler);
                return this;
            },
            emit(type) {
                if (type === 'load') this.loaded = true;
                (listeners[type] || []).forEach(handler => handler());
            },
            getYaw() { return this.yaw; },
            getHfov() { return this.hfov; },
            getScene() { return scene; },
            getConfig() { return config; },
            getContainer() { return container.select('#ideditor-viewer-mapilio-pnlm').node(); },
            isLoaded() { return this.loaded; },
            addScene(id, config) { scenes[id] = { ...config }; return this; },
            loadScene(id) {
                // Pannellum 2.5.7 silently ignores this call while loading.
                if (!this.loaded) return this;
                this.loaded = false;
                scene = id;
                config = { ...scenes[id] };
                this.yaw = config.yaw;
                this.hfov = config.hfov;
                this.emit('scenechange');
                return this;
            },
            removeScene(id) { delete scenes[id]; return this; },
            destroy() {},
            resize() {}
        };
        return result;
    }

    beforeAll(async () => {
        originalHash = window.location.hash;
        mapilio = iD.serviceMapilio;
        mapilio.init();
        container = select(document.body).append('div');
        container.append('div').attr('class', 'photoviewer');
        surface = container.append('svg');
        const photoEvents = dispatch('change');
        context = {
            container: () => container,
            asset: path => path,
            ui: () => ({ photoviewer: { on() {} } }),
            map: () => ({ zoom: () => 19, isTransformed: () => mapTransformed, centerEase() {} }),
            photos: () => ({ fromDate: () => null, toDate: () => null, on: photoEvents.on.bind(photoEvents) })
        };
        const loaded = mapilio.ensureViewerLoaded(context);
        document.querySelector('#ideditor-mapilio-viewercss').dispatchEvent(new Event('load'));
        document.querySelector('#ideditor-mapilio-viewerjs').dispatchEvent(new Event('load'));
        await loaded;
    });

    beforeEach(async () => {
        mapilio.reset();
        mapilio.setActiveImage();
        mapTransformed = false;
        iD.services.mapilio = mapilio;
        photos.forEach(photo => { mapilio.cache().images.forImageId[photo.id] = { ...photo }; });
        frames = new Map();
        let frameID = 0;
        vi.stubGlobal('requestAnimationFrame', callback => { frames.set(++frameID, callback); return frameID; });
        vi.stubGlobal('cancelAnimationFrame', id => { frames.delete(id); });
        vi.stubGlobal('pannellum', { viewer: (_, options) => { viewer = panoramaViewer(options); return viewer; } });
        vi.spyOn(globalThis, 'fetch').mockImplementation(url => Promise.resolve(new Response(JSON.stringify({
            data: String(url).includes('/search-user') ? [{ username: 'mapper' }] : photos.map(photo => ({
                id: photo.id, filename: photo.id + '.jpg', uploaded_hash: 'images'
            }))
        }))));
        vi.spyOn(mapilio, 'images').mockReturnValue(photos);
        vi.spyOn(mapilio, 'sequences').mockReturnValue([]);
        vi.spyOn(mapilio, 'loadImages').mockImplementation(() => {});
        vi.spyOn(mapilio, 'loadLines').mockImplementation(() => {});
        const projection = iD.geoRawMercator().clipExtent([[0, 0], [1000, 1000]]);
        draw = iD.svgMapilioImages(projection, context, dispatch('change', 'photoDatesChanged'));
        draw.enabled(true);
        surface.call(draw);
        await settle();
    });

    afterEach(() => {
        draw.enabled(false);
        mapilio.initOnlyPhoto(context);
        mapilio.setActiveImage();
        surface.selectAll('*').interrupt();
        surface.selectAll('*').remove();
        container.selectAll('*').interrupt();
        delete iD.services.mapilio;
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        photos[3].heading = null;
    });

    afterAll(() => {
        mapilio.reset();
        window.history.replaceState(null, '', originalHash);
        container.remove();
        document.querySelector('#ideditor-mapilio-viewercss').remove();
        document.querySelector('#ideditor-mapilio-viewerjs').remove();
    });

    async function settle() {
        for (let i = 0; i < 12; i++) await Promise.resolve();
    }

    async function selectPhoto(id) {
        mapilio.selectImage(context, id);
        await settle();
        if (photos.find(photo => photo.id === id).isPano) viewer.emit('load');
        await settle();
    }

    function marker(id) {
        return surface.selectAll('.viewfield-group').filter(d => d.id === id);
    }

    function frame() {
        const pending = [...frames.values()];
        frames.clear();
        pending.forEach(callback => callback());
    }

    it('turns only the selected panorama into a cone calibrated to its heading', async () => {
        expect(marker(41).select('.viewfield').attr('d')).toBe(circle);
        await selectPhoto(41);
        expect(viewer.getConfig().northOffset).toBe(350);
        expect(marker(41).classed('currentView')).toBe(true);
        expect(marker(41).select('.viewfield').attr('d')).not.toBe(circle);
        const edges = marker(41).select('.viewfield').attr('d').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g).map(Number);
        // A 60 degree cone of radius 16 has endpoints (0, -0.8564), (16, -0.8564).
        expect(edges[2]).toBeCloseTo(0);
        expect(edges[3]).toBeCloseTo(-0.85640646);
        expect(edges[9]).toBeCloseTo(16);
        expect(edges[10]).toBeCloseTo(-0.85640646);
        expect(marker(41).attr('transform')).toContain('rotate(350,0,0)');
        expect(marker(42).select('.viewfield').attr('d')).toBe(circle);
        expect(marker(43).select('.viewfield').attr('d')).toBe(flat);
    });

    it('rotates clockwise through north while dragging and follows inertia until it finishes', async () => {
        await selectPhoto(41);
        viewer.emit('animatefinished');
        viewer.emit('mousedown');
        viewer.yaw = 30;
        frame();
        expect(marker(41).attr('transform')).toContain('rotate(20,0,0)');
        viewer.emit('mouseup');
        viewer.yaw = 45;
        frame();
        expect(marker(41).attr('transform')).toContain('rotate(35,0,0)');
        viewer.yaw = 50;
        viewer.emit('animatefinished');
        expect(marker(41).attr('transform')).toContain('rotate(40,0,0)');
        expect(frames.size).toBe(0);
    });

    it('narrows the cone on zoom and follows touch and keyboard panning', async () => {
        await selectPhoto(41);
        const wideCone = marker(41).select('.viewfield').attr('d');
        viewer.hfov = 30;
        viewer.emit('zoomchange');
        frame();
        expect(marker(41).select('.viewfield').attr('d')).not.toBe(wideCone);
        viewer.emit('animatefinished');
        viewer.emit('touchstart');
        viewer.yaw = -80;
        frame();
        expect(marker(41).attr('transform')).toContain('rotate(270,0,0)');
        viewer.emit('animatefinished');
        container.select('#ideditor-viewer-mapilio-pnlm').node().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', which: 39, bubbles: true }));
        viewer.yaw = -70;
        frame();
        expect(marker(41).attr('transform')).toContain('rotate(280,0,0)');
    });

    it.each([['Tab', 9], ['Escape', 27], ['e', 69]])('stays idle after the non-movement key %s', async (key, which) => {
        await selectPhoto(41);
        viewer.emit('animatefinished');
        expect(frames.size).toBe(0);
        container.select('#ideditor-viewer-mapilio-pnlm').node().dispatchEvent(new KeyboardEvent('keydown', { key, which, bubbles: true }));
        frame();
        expect(frames.size).toBe(0);
    });

    it.each([['+', 187, 30], ['-', 189, 90]])('tracks panorama zoom from the keyboard key %s', async (key, which, hfov) => {
        await selectPhoto(41);
        viewer.emit('animatefinished');
        const previousCone = marker(41).select('.viewfield').attr('d');
        container.select('#ideditor-viewer-mapilio-pnlm').node().dispatchEvent(new KeyboardEvent('keydown', { key, which, bubbles: true }));
        viewer.hfov = hfov;
        frame();
        expect(marker(41).select('.viewfield').attr('d')).not.toBe(previousCone);
        viewer.emit('animatefinished');
        expect(frames.size).toBe(0);
    });

    it('does not start tracking keyboard input before the panorama has loaded', async () => {
        mapilio.selectImage(context, 41);
        await settle();
        expect(viewer.isLoaded()).toBe(false);
        container.select('#ideditor-viewer-mapilio-pnlm').node().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', which: 39, bubbles: true }));
        frame();
        expect(frames.size).toBe(0);
        expect(mapilio.getViewerState()).toBeNull();
        viewer.emit('load');
        expect(mapilio.getViewerState()).toEqual({ imageId: 41, yaw: 0, hfov: 60 });
    });

    it('loads the latest selection after a busy panorama finishes without mislabeling its view', async () => {
        mapilio.selectImage(context, 41);
        await settle();
        const oldScene = viewer.getScene();
        mapilio.selectImage(context, 44);
        await settle();
        mapilio.selectImage(context, 42);
        await settle();
        expect(viewer.getScene()).toBe(oldScene);
        expect(viewer.getConfig().panorama).toContain('/41.jpg/');
        viewer.yaw = 70;
        viewer.emit('load');
        // The old scene must trigger loading the latest photo, not publish its
        // yaw as though the selected photo were already displayed.
        expect(viewer.getConfig().panorama).toContain('/42.jpg/');
        expect(viewer.isLoaded()).toBe(false);
        expect(mapilio.getViewerState()).toBeNull();
        viewer.emit('load');
        expect(mapilio.getViewerState()).toEqual({ imageId: 42, yaw: 0, hfov: 60 });
        expect(marker(41).select('.viewfield').attr('d')).toBe(circle);
        expect(marker(42).attr('transform')).not.toContain('rotate(');
    });

    it.each(['close', 'reset', 'flat'])('cancels a queued panorama on %s', async action => {
        mapilio.selectImage(context, 41);
        await settle();
        const oldViewer = viewer;
        const oldScene = viewer.getScene();
        mapilio.selectImage(context, 42);
        await settle();
        if (action === 'close') mapilio.hideViewer(context);
        if (action === 'reset') mapilio.reset();
        if (action === 'flat') await selectPhoto(43);
        oldViewer.emit('load');
        expect(oldViewer.getScene()).toBe(oldScene);
        expect(mapilio.getViewerState()).toBeNull();
        expect(frames.size).toBe(0);
    });

    it('uses the selected photo URL when HD is toggled before its metadata arrives', async () => {
        mapilio.selectImage(context, 41);
        await settle();
        let finishRequest;
        const fetch = globalThis.fetch.getMockImplementation();
        vi.spyOn(globalThis, 'fetch').mockImplementation(url => {
            if (String(url).includes('/sequence-detail')) {
                return new Promise(resolve => { finishRequest = resolve; });
            }
            return fetch(url);
        });
        mapilio.selectImage(context, 42);
        await settle();
        const checkbox = container.select('.photo-attribution input');
        try {
            checkbox.property('checked', true).dispatch('click');
            viewer.emit('load');
            expect(viewer.getConfig().panorama).toContain('/41.jpg/1080');
            expect(mapilio.getViewerState()).toBeNull();
            expect(frames.size).toBe(0);
            finishRequest(new Response(JSON.stringify({ data: [{ id: 42, filename: '42.jpg', uploaded_hash: 'images' }] })));
            await settle();
            expect(viewer.getConfig().panorama).toContain('/42.jpg/2080');
            expect(viewer.isLoaded()).toBe(false);
            viewer.emit('load');
            expect(mapilio.getViewerState()).toEqual({ imageId: 42, yaw: 0, hfov: 60 });
            // HD reloads of a busy scene must keep only the latest resolution.
            checkbox.property('checked', false).dispatch('click');
            checkbox.property('checked', true).dispatch('click');
            viewer.emit('load');
            expect(viewer.getConfig().panorama).toContain('/42.jpg/2080');
            viewer.emit('load');
            expect(mapilio.getViewerState()).toEqual({ imageId: 42, yaw: 0, hfov: 60 });
        } finally {
            checkbox.property('checked', false).dispatch('click');
        }
    });

    it('ignores earlier metadata after selecting the same photo again', async () => {
        let finishOldRequest;
        const fetch = globalThis.fetch.getMockImplementation();
        vi.spyOn(globalThis, 'fetch').mockImplementation(url => {
            if (String(url).includes('/sequence-detail') && !finishOldRequest) {
                return new Promise(resolve => { finishOldRequest = resolve; });
            }
            return fetch(url);
        });
        mapilio.selectImage(context, 41);
        await selectPhoto(42);
        await selectPhoto(41);
        const scene = viewer.getScene();
        finishOldRequest(new Response(JSON.stringify({ data: [{ id: 41, filename: 'stale.jpg', uploaded_hash: 'old' }] })));
        await settle();
        expect(viewer.getScene()).toBe(scene);
        expect(viewer.getConfig().panorama).toContain('/41.jpg/');
    });

    it('resets yaw and hfov on photo switches and accepts a zero heading', async () => {
        await selectPhoto(41);
        viewer.yaw = 30;
        viewer.hfov = 20;
        frame();
        await selectPhoto(42);
        expect(marker(41).select('.viewfield').attr('d')).toBe(circle);
        expect(marker(42).select('.viewfield').attr('d')).not.toBe(circle);
        expect(marker(42).attr('transform')).not.toContain('rotate(');
        expect(viewer.getConfig().northOffset).toBe(0);
        expect(viewer.yaw).toBe(0);
        expect(viewer.hfov).toBe(60);
    });

    it.each([null, undefined, NaN, Infinity, ''])('retains a circle for unavailable panorama heading %s', async heading => {
        photos[3].heading = heading;
        mapilio.cache().images.forImageId[44].heading = heading;
        await selectPhoto(44);
        viewer.yaw = 90;
        frame();
        expect(marker(44).select('.viewfield').attr('d')).toBe(circle);
        expect(marker(44).attr('transform')).not.toContain('rotate(');
    });

    it('stops updating when closed or switched to a flat photo', async () => {
        await selectPhoto(41);
        const oldViewer = viewer;
        mapilio.hideViewer(context);
        expect(frames.size).toBe(0);
        expect(marker(41).select('.viewfield').attr('d')).toBe(circle);
        oldViewer.emit('mousedown');
        expect(frames.size).toBe(0);
        await selectPhoto(42);
        await selectPhoto(43);
        expect(frames.size).toBe(0);
        expect(marker(43).select('.viewfield').attr('d')).toBe(flat);
        expect(marker(43).attr('transform')).toContain('rotate(90,0,0)');
    });

    it('keeps a single update loop across repeated scene loads', async () => {
        await selectPhoto(41);
        await selectPhoto(42);
        viewer.emit('mousedown');
        viewer.emit('touchstart');
        viewer.emit('zoomchange');
        expect(frames.size).toBe(1);
        mapilio.reset();
        expect(frames.size).toBe(0);
    });

    it('does not load an older response over the newly selected panorama', async () => {
        let finishOldRequest;
        const fetch = globalThis.fetch.getMockImplementation();
        vi.spyOn(globalThis, 'fetch').mockImplementation(url => {
            if (String(url).includes('/sequence-detail')) {
                if (!finishOldRequest) {
                    return new Promise(resolve => { finishOldRequest = resolve; });
                }
            }
            return fetch(url);
        });
        mapilio.selectImage(context, 41);
        await selectPhoto(42);
        finishOldRequest(new Response(JSON.stringify({ data: [{ id: 41, filename: 'old.jpg', uploaded_hash: 'old' }] })));
        await settle();
        expect(viewer.getConfig().panorama).toContain('/42.jpg/');
        expect(viewer.getConfig().northOffset).toBe(0);
        expect(marker(42).select('.viewfield').attr('d')).not.toBe(circle);
    });

    it('redraws the latest direction after a map transform ends', async () => {
        await selectPhoto(41);
        mapTransformed = true;
        viewer.yaw = 30;
        frame();
        expect(marker(41).attr('transform')).toContain('rotate(350,0,0)');
        mapTransformed = false;
        surface.call(draw);
        await settle();
        expect(marker(41).attr('transform')).toContain('rotate(20,0,0)');
    });
});
