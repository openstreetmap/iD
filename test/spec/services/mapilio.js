import { select } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';

describe('iD.serviceMapilio', function() {
    let mapilio, context, container, centerEase, originalHash, resizeViewer;

    beforeAll(async () => {
        originalHash = window.location.hash;
        mapilio = iD.serviceMapilio;
        mapilio.init();
        container = select(document.body).append('div');
        container.append('div').attr('class', 'photoviewer');
        centerEase = vi.fn();
        context = {
            container: () => container,
            asset: path => path,
            ui: () => ({ photoviewer: { on: (_, callback) => { resizeViewer = callback; } } }),
            map: () => ({ centerEase })
        };
        const loaded = mapilio.ensureViewerLoaded(context);
        document.querySelector('#ideditor-mapilio-viewercss').dispatchEvent(new Event('load'));
        document.querySelector('#ideditor-mapilio-viewerjs').dispatchEvent(new Event('load'));
        await loaded;
    });

    beforeEach(() => {
        mapilio.reset();
        mapilio.setActiveImage();
        centerEase.mockClear();
    });

    afterEach(() => {
        mapilio.on('loadedImages.test', null);
        container.selectAll('*').interrupt();
        vi.restoreAllMocks();
    });

    afterAll(() => {
        mapilio.reset();
        mapilio.setActiveImage();
        window.history.replaceState(null, '', originalHash);
        container.remove();
        document.querySelector('#ideditor-mapilio-viewercss').remove();
        document.querySelector('#ideditor-mapilio-viewerjs').remove();
    });

    function photoViewport(width, height) {
        const node = container.select('#ideditor-viewer-mapilio-simple-wrap').node();
        Object.defineProperties(node, {
            clientWidth: { configurable: true, value: width },
            clientHeight: { configurable: true, value: height }
        });
        vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width, height });
        return node;
    }

    function wheel(node, x, y) {
        node.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -500, clientX: x, clientY: y }));
    }

    function drag(node, dx, dy) {
        const view = node.ownerDocument.defaultView;
        for (const [type, target, x, y] of [
            ['mousedown', node, 100, 100],
            ['mousemove', view, 100 + dx, 100 + dy],
            ['mouseup', view, 100 + dx, 100 + dy]
        ]) {
            const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, buttons: 1 });
            // Vitest proxies Window; JSDOM's event constructor rejects that proxy.
            Object.defineProperty(event, 'view', { value: view });
            target.dispatchEvent(event);
        }
    }

    it.each([[320, 240], [640, 400], [800, 450]])('keeps the zoom focus and reaches all edges at %i x %i', async (width, height) => {
        const node = photoViewport(width, height);
        select(node).call(zoom().transform, zoomIdentity);
        wheel(node, width - 20, height - 20);
        expect(zoomTransform(node).k).toBe(2);
        expect(zoomTransform(node).x).toBe(-(width - 20));
        expect(zoomTransform(node).y).toBe(-(height - 20));
        drag(node, -10000, -10000);
        expect(zoomTransform(node).x).toBe(-width);
        expect(zoomTransform(node).y).toBe(-height);
        drag(node, 10000, 10000);
        expect(zoomTransform(node).x).toBe(0);
        expect(zoomTransform(node).y).toBe(0);
        await new Promise(resolve => { setTimeout(resolve, 160); });
    });

    it('resets the actual zoom target synchronously when switching photos', async () => {
        const node = photoViewport(640, 400);
        select(node).call(zoom().transform, zoomIdentity);
        wheel(node, 300, 200);
        expect(zoomTransform(node).k).toBe(2);
        mapilio.cache().images.forImageId[43] = {
            id: 43, sequence_id: 'sequence-a', created_by_id: 449, loc: [10, 0], isPano: false
        };
        vi.spyOn(globalThis, 'fetch').mockImplementation(url => Promise.resolve(new Response(JSON.stringify({
            data: String(url).includes('/search-user') ? [{ username: 'mapper' }] : [{ id: 43, filename: 'next.jpeg', uploaded_hash: 'next' }]
        }))));
        mapilio.selectImage(context, 43);
        expect(zoomTransform(node).k).toBe(1);
        expect(zoomTransform(node).x).toBe(0);
        expect(zoomTransform(node).y).toBe(0);
        await vi.waitFor(() => expect(container.select('#ideditor-viewer-mapilio-simple img').attr('src')).toContain('next.jpeg'));
        await new Promise(resolve => { setTimeout(resolve, 160); });
        wheel(node, 300, 200);
        expect(zoomTransform(node).k).toBe(2);
        expect(zoomTransform(node).x).toBe(-300);
        expect(zoomTransform(node).y).toBe(-200);
        await new Promise(resolve => { setTimeout(resolve, 160); });
    });

    it('constrains the current transform to the resized photo viewport', () => {
        const node = photoViewport(640, 400);
        select(node).call(zoom().transform, zoomIdentity.translate(-640, -400).scale(2));
        photoViewport(320, 240);
        resizeViewer();
        expect(zoomTransform(node).x).toBe(-320);
        expect(zoomTransform(node).y).toBe(-240);
    });
});
