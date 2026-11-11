import { setImmediate } from 'node:timers/promises';
import { PbfWriter } from 'pbf';

// Tiny real MVT fixtures: one point at the tile center and duplicate sequence
// lines from that point to x + 64. Both layers use the same sequence UUID.
function tileData(layerName, id = 42, featureCount = null, malformedFeature = null) {
    const pbf = new PbfWriter();
    pbf.writeMessage(3, (_, layer) => {
        layer.writeVarintField(15, 2);
        layer.writeStringField(1, layerName);
        layer.writeVarintField(5, 4096);
        const properties = {
            id, sequence_uuid: 'sequence-1', resolution: '1920x1080',
            capture_time: '2026-11-01', created_by_id: 7, heading: 90
        };
        const entries = Object.entries(properties);
        for (const [key, value] of entries) {
            layer.writeStringField(3, key);
            layer.writeMessage(4, (_, field) => {
                if (typeof value === 'number') {
                    field.writeVarintField(5, value);
                } else {
                    field.writeStringField(1, value);
                }
            });
        }
        const isPoint = layerName === 'map_points';
        for (let i = 0; i < (featureCount ?? (isPoint ? 1 : 2)); i++) {
            layer.writeMessage(2, (_, feature) => {
                feature.writePackedVarint(2, entries.flatMap((_, index) => [index, index]));
                feature.writeVarintField(3, isPoint ? 1 : 2);
                const geometry = isPoint ? [9, 4096, 4096] : [9, 4096, 4096, 10, 128, 0];
                feature.writePackedVarint(4, i === malformedFeature ? [8] : geometry);
            });
        }
    });
    return pbf.finish();
}

function deferred() {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

function response(data) {
    return new Response(data);
}

const failures = [
    ['network rejection', () => Promise.reject(new TypeError('Network unavailable'))],
    ['HTTP error', () => Promise.resolve(new Response(null, { status: 503 }))],
    ['body failure', () => {
        const result = response(tileData('map_points'));
        vi.spyOn(result, 'arrayBuffer').mockRejectedValue(new Error('Body interrupted'));
        return Promise.resolve(result);
    }],
    ['decode failure', () => Promise.resolve(response(new Uint8Array([0x1a, 0xff])))],
    ['abort rejection', () => Promise.reject(new DOMException('Aborted', 'AbortError'))]
];

// These catch stuck inflight/early loaded state via observable coverage recovery,
// and stale ownership through events, data, request counts, and reset aborts.
describe('iD.serviceMapilio tile lifecycle', function() {
    let mapilio, projection, fetch, logError;

    beforeEach(function() {
        mapilio = iD.serviceMapilio;
        mapilio.init();
        mapilio.reset();
        // A 128px viewport wholly inside z14 tile 9000,8000, centered on its
        // MVT coordinate 2048,2048. No tiler or cache implementation is mocked.
        projection = iD.geoRawMercator()
            .scale(iD.geoZoomToScale(14))
            .translate([-206912, 49088])
            .clipExtent([[0, 0], [128, 128]]);
        fetch = vi.fn();
        vi.stubGlobal('fetch', fetch);
        logError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(function() {
        mapilio.reset();
        mapilio.on('loadedImages.tiles', null);
        mapilio.on('loadedLines.tiles', null);
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    [
        ['a later point feature', tileData('map_points', 42, 2, 1)],
        ['the line layer after valid points', new Uint8Array([
            ...tileData('map_points'), ...tileData('map_roads_line', 42, 1, 0)
        ])],
        ['a later line feature after valid points and lines', new Uint8Array([
            ...tileData('map_points'), ...tileData('map_roads_line', 99, 2, 1)
        ])]
    ].forEach(function([name, malformed]) {
        it('keeps public caches unchanged when decoding fails in ' + name, async function() {
            const valid = new Uint8Array([...tileData('map_points'), ...tileData('map_roads_line')]);
            fetch.mockResolvedValueOnce(response(malformed)).mockResolvedValueOnce(response(valid));
            const loaded = vi.fn();
            mapilio.on('loadedImages.tiles', loaded);
            mapilio.loadImages(projection);
            await setImmediate();
            expect(logError).toHaveBeenCalledTimes(1);
            expect(logError.mock.calls[0][0].message).toContain('unknown command');
            expect(loaded).not.toHaveBeenCalled();
            expect(mapilio.cachedImage(42)).toBeUndefined();
            expect(mapilio.images(projection)).toEqual([]);
            expect(mapilio.sequences(projection)).toEqual([]);
            expect(fetch).toHaveBeenCalledTimes(1);

            mapilio.loadImages(projection);
            await setImmediate();
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(loaded).toHaveBeenCalledTimes(1);
            expect(mapilio.images(projection).map(image => image.id)).toEqual([42]);
            expect(mapilio.cachedImage(42)).toEqual(mapilio.images(projection)[0]);
            const sequences = mapilio.sequences(projection);
            expect(sequences).toHaveLength(1);
            expect(sequences[0].properties.id).toBe(42);
            expect(sequences[0].geometry.coordinates).toHaveLength(2);
            expect(projection(sequences[0].geometry.coordinates[0])[0]).toBeCloseTo(64);
            expect(projection(sequences[0].geometry.coordinates[1])[0]).toBeCloseTo(68);
        });
    });

    [
        ['loadImages', 'map_points', 'loadedImages'],
        ['loadLines', 'map_roads_line', 'loadedLines']
    ].forEach(function([method, layer, event]) {
        describe('tile loader: ' + method, function() {
            let loaded;

            async function seedImages() {
                if (method !== 'loadLines') return;
                fetch.mockResolvedValue(response(tileData('map_points')));
                mapilio.loadImages(projection);
                await setImmediate();
                fetch.mockClear();
            }

            function visible() {
                return method === 'loadImages' ? mapilio.images(projection) : mapilio.sequences(projection);
            }

            function expectCoverage(id = 42) {
                const data = visible();
                expect(data).toHaveLength(1);
                if (method === 'loadImages') {
                    expect(data[0]).toMatchObject({
                        id, sequence_id: 'sequence-1', heading: 90,
                        resolution: '1920x1080', isPano: false, created_by_id: 7
                    });
                    expect(mapilio.cachedImage(id)).toEqual(data[0]);
                    const screen = projection(data[0].loc);
                    expect(screen[0]).toBeCloseTo(64);
                    expect(screen[1]).toBeCloseTo(64);
                } else {
                    expect(data[0]).toMatchObject({
                        type: 'Feature', properties: { id, sequence_uuid: 'sequence-1' },
                        geometry: { type: 'LineString' }
                    });
                    expect(data[0].geometry.coordinates).toHaveLength(2);
                    expect(projection(data[0].geometry.coordinates[0])[0]).toBeCloseTo(64);
                    expect(projection(data[0].geometry.coordinates[1])[0]).toBeCloseTo(68);
                }
            }

            beforeEach(async function() {
                await seedImages();
                loaded = vi.fn();
                mapilio.on(event + '.tiles', loaded);
            });

            failures.forEach(function([name, fail]) {
                it('recovers on a later draw after ' + name, async function() {
                    fetch.mockImplementationOnce(fail).mockResolvedValue(response(tileData(layer)));
                    mapilio[method](projection);
                    await setImmediate();
                    await setImmediate();
                    expect(visible()).toEqual([]);
                    expect(loaded).not.toHaveBeenCalled();
                    expect(fetch).toHaveBeenCalledTimes(1);  // no automatic retry loop

                    mapilio[method](projection);
                    await setImmediate();
                    expect(fetch).toHaveBeenCalledTimes(2);
                    expectCoverage();
                    expect(loaded).toHaveBeenCalledTimes(1);
                    mapilio[method](projection);
                    await setImmediate();
                    expect(fetch).toHaveBeenCalledTimes(2);
                    expectCoverage();
                });
            });

            it('deduplicates draws while fetching and reading the body', async function() {
                const request = deferred();
                const body = deferred();
                const result = response(null);
                vi.spyOn(result, 'arrayBuffer').mockReturnValue(body.promise);
                fetch.mockReturnValue(request.promise);
                mapilio[method](projection);
                mapilio[method](projection);
                expect(fetch).toHaveBeenCalledTimes(1);
                expect(fetch.mock.calls[0][0]).toContain('LAYER=mapilio:' + layer);
                expect(fetch.mock.calls[0][0]).toContain('TILECOL=9000&TILEROW=8000');
                request.resolve(result);
                await setImmediate();
                mapilio[method](projection);
                expect(fetch).toHaveBeenCalledTimes(1);
                expect(visible()).toEqual([]);
                expect(loaded).not.toHaveBeenCalled();
                body.resolve(tileData(layer));
                await setImmediate();
                expectCoverage();
                expect(loaded).toHaveBeenCalledTimes(1);
            });

            [
                ['zero-byte response', new Uint8Array(), 0],
                ['valid MVT with an empty layer', tileData(layer, 42, 0), 1]
            ].forEach(function([name, data, events]) {
                it('keeps a successful empty tile loaded: ' + name, async function() {
                    fetch.mockResolvedValue(response(data));
                    mapilio[method](projection);
                    await setImmediate();
                    mapilio[method](projection);
                    await setImmediate();
                    expect(fetch).toHaveBeenCalledTimes(1);
                    expect(visible()).toEqual([]);
                    expect(loaded).toHaveBeenCalledTimes(events);
                });
            });

            ['fetch', 'body'].forEach(function(phase) {
                it('ignores old ' + phase + ' completion after reset and keeps the new request owned', async function() {
                    const old = deferred();
                    const result = response(null);
                    if (phase === 'body') {
                        vi.spyOn(result, 'arrayBuffer').mockReturnValue(old.promise);
                        fetch.mockResolvedValue(result);
                    } else {
                        fetch.mockReturnValue(old.promise);
                    }
                    mapilio[method](projection);
                    const oldSignal = fetch.mock.calls[0][1].signal;
                    await setImmediate();
                    mapilio.reset();
                    expect(oldSignal.aborted).toBe(true);
                    await seedImages();
                    const current = deferred();
                    fetch.mockReturnValue(current.promise);
                    mapilio[method](projection);
                    const requestCount = fetch.mock.calls.length;
                    old.resolve(phase === 'body' ? tileData(layer, 99) : response(tileData(layer, 99)));
                    await setImmediate();
                    expect(visible()).toEqual([]);
                    expect(mapilio.cachedImage(99)).toBeUndefined();
                    expect(loaded).not.toHaveBeenCalled();
                    mapilio[method](projection);
                    expect(fetch).toHaveBeenCalledTimes(requestCount);
                    current.resolve(response(tileData(layer)));
                    await setImmediate();
                    expectCoverage();
                    expect(loaded).toHaveBeenCalledTimes(1);
                });
            });

            it('ignores an old rejection after reset without releasing a newer request', async function() {
                const old = deferred();
                fetch.mockReturnValue(old.promise);
                mapilio[method](projection);
                mapilio.reset();
                await seedImages();
                const current = deferred();
                fetch.mockReturnValue(current.promise);
                mapilio[method](projection);
                const requestCount = fetch.mock.calls.length;
                old.reject(new DOMException('Aborted', 'AbortError'));
                await setImmediate();
                mapilio[method](projection);
                expect(fetch).toHaveBeenCalledTimes(requestCount);
                expect(visible()).toEqual([]);
                expect(loaded).not.toHaveBeenCalled();
                current.resolve(response(tileData(layer)));
                await setImmediate();
                expectCoverage();
                expect(loaded).toHaveBeenCalledTimes(1);
            });
        });
    });
});
