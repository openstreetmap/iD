import { utilDisplayLabel } from '../../../modules/util/utilDisplayLabel';

describe('iD.utilDisplayLabel', function () {

    afterEach(function () {
        // remove the test presets and custom region from the shared singletons,
        // so they don't leak into later tests (the preset and location managers
        // are module-level state that survives across tests and spec files)
        iD.presetManager.merge({
            presets: {
                'test/label_cache': null,
                'test/label_cache_2': null,
                'test/label_cache_loc': null,
                'test/label_cache_locale': null
            }
        });
        iD.locationManager.removeFeatures('label_cache_test.geojson');
    });

    it('returns the name for an entity with a name tag', function () {
        var node = new iD.osmNode({ id: 'n1', loc: [1, 2], tags: { name: 'Main Street' } });
        var graph = new iD.coreGraph([node]);

        expect(utilDisplayLabel(node, graph)).toEqual('Main Street');
    });

    it('falls back to the preset name when there is no name', function () {
        var node = new iD.osmNode({ id: 'n1', loc: [1, 2] });
        var graph = new iD.coreGraph([node]);

        // a bare node with no tags matches no preset, so it falls back to the "Point" preset
        expect(utilDisplayLabel(node, graph)).toEqual('Point');
    });

    it('includes both preset name and feature name when verbose', function () {
        var node = new iD.osmNode({ id: 'n1', loc: [1, 2], tags: { name: 'Main Street' } });
        var graph = new iD.coreGraph([node]);

        expect(utilDisplayLabel(node, graph, true)).toEqual('Point Main Street');
    });

    it('accepts a geometry string instead of a graph', function () {
        var node = new iD.osmNode({ id: 'n1', loc: [1, 2], tags: { name: 'Main Street' } });

        expect(utilDisplayLabel(node, 'point')).toEqual('Main Street');
    });

    it('returns the same result on repeated calls with the same entity and graph', function () {
        var node = new iD.osmNode({ id: 'n1', loc: [1, 2], tags: { name: 'Main Street' } });
        var graph = new iD.coreGraph([node]);

        expect(utilDisplayLabel(node, graph)).toEqual('Main Street');
        expect(utilDisplayLabel(node, graph)).toEqual('Main Street');
    });

    it('computes a fresh label when the entity is replaced (edited)', function () {
        var node = new iD.osmNode({ id: 'n1', loc: [1, 2], tags: { name: 'Old Name' } });
        var graph = new iD.coreGraph([node]);
        expect(utilDisplayLabel(node, graph)).toEqual('Old Name');

        // an edit produces a NEW entity object - the cache must not hit it
        var updated = node.update({ tags: { name: 'New Name' } });
        var graph2 = graph.replace(updated);

        expect(utilDisplayLabel(updated, graph2)).toEqual('New Name');
    });

    it('computes a fresh label when the graph changes the label input', function () {
        // a node with no parent ways is a POI ("point"), a node on a way is a "vertex"
        var node = new iD.osmNode({ id: 'n1', loc: [1, 2] });
        var graphPoi = new iD.coreGraph([node]);
        expect(utilDisplayLabel(node, graphPoi)).toEqual('Point');

        // register a preset that only matches point geometry
        iD.presetManager.merge({
            presets: { 'test/label_cache': { name: 'Label Cache Test', tags: { testlabelcache: 'yes' }, geometry: ['point'] } }
        });

        var node2 = new iD.osmNode({ id: 'n2', loc: [1, 2], tags: { testlabelcache: 'yes' } });
        var graphPoi2 = new iD.coreGraph([node2]);
        var way = new iD.osmWay({ id: 'w1', nodes: ['n2', 'n3'] });
        var graphVertex = graphPoi2.replace(way);

        expect(utilDisplayLabel(node2, graphPoi2)).toEqual('Label Cache Test');
        expect(utilDisplayLabel(node2, graphVertex)).toEqual('Point');
    });

    it('computes a fresh label after the preset data is rebuilt', function () {
        var node = new iD.osmNode({ id: 'n1', loc: [1, 2], tags: { testlabelcache2: 'yes' } });

        // (using the geometry string path, which calls `matchTags` directly)
        // no preset matches yet - falls back to the "Point" preset
        expect(utilDisplayLabel(node, 'point')).toEqual('Point');

        // rebuilding the preset index adds a matching preset,
        // so the same entity must now produce the new label
        iD.presetManager.merge({
            presets: { 'test/label_cache_2': { name: 'Label Cache Two', tags: { testlabelcache2: 'yes' }, geometry: ['point'] } }
        });

        expect(utilDisplayLabel(node, 'point')).toEqual('Label Cache Two');
    });

    it('computes a fresh label after the location data changes', function () {
        // register a preset limited to a custom .geojson region; the locationSet
        // can only resolve once the region has been added via `addFeatures`,
        // so first add a region that does NOT cover the entity location
        iD.locationManager.addFeatures({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                id: 'label_cache_test.geojson',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[-80, 35], [-70, 35], [-70, 45], [-80, 45], [-80, 35]]]
                }
            }]
        });

        iD.presetManager.merge({
            presets: {
                'test/label_cache_loc': {
                    name: 'Label Cache Loc',
                    tags: { testlabelcacheloc: 'yes' },
                    geometry: ['point'],
                    locationSet: { include: ['label_cache_test.geojson'] }
                }
            }
        });

        var node = new iD.osmNode({ id: 'n1', loc: [1, 2], tags: { testlabelcacheloc: 'yes' } });
        var graph = new iD.coreGraph([node]);

        // the preset matches the tags, but not the location, so the label
        // falls back to the "Point" preset
        expect(utilDisplayLabel(node, graph)).toEqual('Point');

        // the preset match is transient-cached on the graph, so clear it to
        // let the location data change which preset matches
        graph.transients = {};

        // replace the region with one that covers the entity location
        iD.locationManager.removeFeatures('label_cache_test.geojson');
        iD.locationManager.addFeatures({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                id: 'label_cache_test.geojson',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[0, 1], [2, 1], [2, 3], [0, 3], [0, 1]]]
                }
            }]
        });

        // same entity, same graph, same locale and preset data - only the
        // location data version changed, so the label must recompute
        expect(utilDisplayLabel(node, graph)).toEqual('Label Cache Loc');
    });

    it('computes a fresh label after the locale changes', async function () {
        // register a preset whose name we will translate below
        iD.presetManager.merge({
            presets: {
                'test/label_cache_locale': {
                    name: 'Label Cache Locale',
                    tags: { testlabelcachelocale: 'yes' },
                    geometry: ['point']
                }
            }
        });

        // provide a spanish translation of the preset name
        var cached = iD.fileFetcher.cache();
        cached.locale_tagging_es = {
            es: { presets: { presets: { 'test/label_cache_locale': { name: 'Etiqueta Cache Locale' } } } }
        };
        await iD.localizer.loadLocale('es', 'tagging', undefined);

        var node = new iD.osmNode({ id: 'n1', loc: [1, 2], tags: { testlabelcachelocale: 'yes' } });
        var graph = new iD.coreGraph([node]);
        var previousLocaleCode = iD.localizer.localeCode();

        expect(utilDisplayLabel(node, graph)).toEqual('Label Cache Locale');

        // switch the current locale - same entity, graph and preset data,
        // so the label must recompute because the locale changed
        iD.localizer._localeCode = 'es';
        expect(utilDisplayLabel(node, graph)).toEqual('Etiqueta Cache Locale');

        // restore the locale for later tests
        iD.localizer._localeCode = previousLocaleCode;
    });

    it('serves the cached label for both verbose and non-verbose calls', function () {
        var node = new iD.osmNode({ id: 'n1', loc: [1, 2], tags: { name: 'Main Street' } });
        var graph = new iD.coreGraph([node]);

        expect(utilDisplayLabel(node, graph)).toEqual('Main Street');
        expect(utilDisplayLabel(node, graph, true)).toEqual('Point Main Street');
    });
});
