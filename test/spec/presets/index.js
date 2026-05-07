import { locationManager, presetIndex } from '../../../modules';

describe('iD.presetIndex', function () {
    var _savedPresets, _savedAreaKeys;

    before(function() {
        _savedPresets = iD.fileFetcher.cache().preset_presets;
        _savedAreaKeys = iD.osmAreaKeys;
    });

    after(function() {
        iD.fileFetcher.cache().preset_presets = _savedPresets;
        iD.osmSetAreaKeys(_savedAreaKeys);
    });


    describe('#init', function () {
        it('has a fallback point preset', function () {
            var node = new iD.osmNode({ id: 'n' });
            var graph = new iD.coreGraph([node]);
            var presets = iD.presetIndex();
            expect(presets.match(node, graph).id).toEqual('point');
        });
        it('has a fallback line preset', function () {
            var node = new iD.osmNode({ id: 'n' });
            var way = new iD.osmWay({ id: 'w', nodes: ['n'] });
            var graph = new iD.coreGraph([node, way]);
            var presets = iD.presetIndex();
            expect(presets.match(way, graph).id).toEqual('line');
        });
        it('has a fallback area preset', function () {
            var node = new iD.osmNode({ id: 'n' });
            var way = new iD.osmWay({ id: 'w', nodes: ['n'], tags: { area: 'yes' }});
            var graph = new iD.coreGraph([node, way]);
            var presets = iD.presetIndex();
            expect(presets.match(way, graph).id).toEqual('area');
        });
        it('has a fallback relation preset', function () {
            var relation = new iD.osmRelation({ id: 'r' });
            var graph = new iD.coreGraph([relation]);
            var presets = iD.presetIndex();
            expect(presets.match(relation, graph).id).toEqual('relation');
        });
    });


    describe('#match', function () {
        var testPresets = {
            residential: { tags: { highway: 'residential' }, geometry: ['line'] },
            park: { tags: { leisure: 'park' }, geometry: ['point', 'area'] }
        };

        it('returns a collection containing presets matching a geometry and tags', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();
            var way = new iD.osmWay({ tags: { highway: 'residential' } });
            var graph = new iD.coreGraph([way]);
            expect(presets.match(way, graph).id).toEqual('residential');
        });

        it('returns the appropriate fallback preset when no tags match', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var point = new iD.osmNode();
            var line = new iD.osmWay({ tags: { foo: 'bar' } });
            var graph = new iD.coreGraph([point, line]);

            await presets.ensureLoaded();
            expect(presets.match(point, graph).id).toEqual('point');
            expect(presets.match(line, graph).id).toEqual('line');
        });

        it('matches vertices on a line as points', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var point = new iD.osmNode({ tags: { leisure: 'park' } });
            var line = new iD.osmWay({ nodes: [point.id], tags: { 'highway': 'residential' } });
            var graph = new iD.coreGraph([point, line]);

            await presets.ensureLoaded();
            expect(presets.match(point, graph).id).toEqual('point');
        });

        it('matches vertices on an addr:interpolation line as points', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var point = new iD.osmNode({ tags: { leisure: 'park' } });
            var line = new iD.osmWay({ nodes: [point.id], tags: { 'addr:interpolation': 'even' } });
            var graph = new iD.coreGraph([point, line]);

            await presets.ensureLoaded();
            expect(presets.match(point, graph).id).toEqual('park');
        });
    });


    describe('#areaKeys', function () {
        var testPresets = {
            'amenity/fuel/shell': { tags: { 'amenity': 'fuel' }, geometry: ['point', 'area'], suggestion: true },
            'highway/foo': { tags: { 'highway': 'foo' }, geometry: ['area'] },
            'leisure/track': { tags: { 'leisure': 'track' }, geometry: ['line', 'area'] },
            'natural': { tags: { 'natural': '*' }, geometry: ['point', 'vertex', 'area'] },
            'natural/peak': { tags: { 'natural': 'peak' }, geometry: ['point', 'vertex'] },
            'natural/tree_row': { tags: { 'natural': 'tree_row' }, geometry: ['line'] },
            'natural/wood': { tags: { 'natural': 'wood' }, geometry: ['point', 'area'] }
        };

        it('includes keys for presets with area geometry', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();
            expect(presets.areaKeys()).to.include.keys('natural');
        });

        it('discards key-values for presets with a line geometry', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();
            expect(presets.areaKeys().natural).to.include.keys('tree_row');
            expect(presets.areaKeys().natural.tree_row).toBe(true);

        });

        it('discards key-values for presets with both area and line geometry', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();
            expect(presets.areaKeys().leisure).to.include.keys('track');
        });

        it('does not discard key-values for presets with neither area nor line geometry', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();
            expect(presets.areaKeys().natural).not.to.include.keys('peak');
        });

        it('does not discard generic \'*\' key-values', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();
            expect(presets.areaKeys().natural).not.to.include.keys('natural');
        });

        it('ignores keys like \'highway\' that are assumed to be lines', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();
            expect(presets.areaKeys()).not.to.include.keys('highway');
        });

        it('ignores suggestion presets', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();
            expect(presets.areaKeys()).not.to.include.keys('amenity');
        });
    });


    describe('#addablePresetIDs', function () {
        var testPresets = {
            residential: { tags: { highway: 'residential' }, geometry: ['line'] },
            park: { tags: { leisure: 'park' }, geometry: ['point', 'area'] },
            bench: { tags: { amenity: 'bench' }, geometry: ['point', 'line'] }
        };

        it('addablePresetIDs is initially null', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();
            expect(presets.addablePresetIDs()).toBeNull();
        });

        it('can set and get addablePresetIDs', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();

            expect(presets.item('residential').addable()).toBe(true);
            expect(presets.item('park').addable()).toBe(true);

            var ids = new Set(['residential']);   // can only add preset with this ID
            presets.addablePresetIDs(ids);

            expect(presets.item('residential').addable()).toBe(true);
            expect(presets.item('park').addable()).toBe(false);
            expect(presets.addablePresetIDs()).toEqual(ids);

            presets.addablePresetIDs(null);
            expect(presets.item('residential').addable()).toBe(true);
            expect(presets.item('park').addable()).toBe(true);
        });

        it('ignores invalid IDs in addablePresetIDs', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();

            expect(presets.item(null)).toEqual(undefined);
            expect(presets.item(undefined)).toEqual(undefined);
            expect(presets.item('')).toEqual(undefined);
            expect(presets.item('garbage')).toEqual(undefined);
            expect(presets.item('residential').addable()).toBe(true);
            expect(presets.item('park').addable()).toBe(true);

            var ids = new Set([null, undefined, '', 'garbage', 'residential']);   // can only add preset with these IDs
            presets.addablePresetIDs(ids);

            expect(presets.item(null)).toEqual(undefined);
            expect(presets.item(undefined)).toEqual(undefined);
            expect(presets.item('')).toEqual(undefined);
            expect(presets.item('garbage')).toEqual(undefined);
            expect(presets.item('residential').addable()).toBe(true);
            expect(presets.item('park').addable()).toBe(false);
            expect(presets.addablePresetIDs()).toEqual(ids);

            presets.addablePresetIDs(null);
            expect(presets.item(null)).toEqual(undefined);
            expect(presets.item(undefined)).toEqual(undefined);
            expect(presets.item('')).toEqual(undefined);
            expect(presets.item('garbage')).toEqual(undefined);
            expect(presets.item('residential').addable()).toBe(true);
            expect(presets.item('park').addable()).toBe(true);
        });

        it('addablePresetIDs are default presets', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            await presets.ensureLoaded();
            var ids = new Set(['bench', 'residential']);   // can only add presets with these IDs
            presets.addablePresetIDs(ids);

            var areaDefaults = presets.defaults('area', 10).collection;
            expect(areaDefaults.length).toEqual(0);

            var pointDefaults = presets.defaults('point', 10).collection;
            expect(pointDefaults.length).toEqual(1);
            expect(pointDefaults[0].id).toEqual('bench');

            var lineDefaults = presets.defaults('line', 10).collection;
            expect(lineDefaults.length).toEqual(2);
            expect(lineDefaults[0].id).toEqual('bench');
            expect(lineDefaults[1].id).toEqual('residential');
        });
    });


    describe.skip('#build', function () {
        it('builds presets from provided', function () {
            var surfShop = new iD.osmNode({ tags: { amenity: 'shop', 'shop:type': 'surf' } });
            var graph = new iD.coreGraph([surfShop]);
            var presets = iD.presetIndex();
            var presetData = {
                presets: {
                    'amenity/shop/surf': {
                        tags: { amenity: 'shop', 'shop:type': 'surf' },
                        geometry: ['point', 'area']
                    }
                }
            };

            expect(presets.match(surfShop, graph)).toEqual(undefined); // no surfshop preset yet...
            presets.build(presetData, true);
            expect(presets.match(surfShop, graph).addTags).toEqual({ amenity: 'shop', 'shop:type': 'surf' });
        });

        it('configures presets\' initial visibility', function () {
            var surfShop = new iD.osmNode({ tags: { amenity: 'shop', 'shop:type': 'surf' } });
            var firstStreetJetty = new iD.osmNode({ tags: { man_made: 'jetty' } });
            var entities = [surfShop, firstStreetJetty];
            var graph = new iD.coreGraph(entities);
            var presets = iD.presetIndex();
            var presetData = {
                presets: {
                    'amenity/shop/surf': {
                        tags: { amenity: 'shop', 'shop:type': 'surf' },
                        geometry: ['point', 'area']
                    },
                    'man_made/jetty': {
                        tags: { man_made: 'jetty' },
                        geometry: ['point']
                    }
                }
            };

            presets.build(presetData, false);
            entities.forEach(function (entity) {
                var preset = presets.match(entity, graph);
                expect(preset.addable()).toBe(false);
            });
        });
    });


    describe('expected matches', function () {
        var testPresets = {
            building: { name: 'Building', tags: { building: 'yes' }, geometry: ['area'] },
            'type/multipolygon': {
                name: 'Multipolygon',
                geometry: ['area', 'relation'],
                tags: { 'type': 'multipolygon' },
                searchable: false,
                matchScore: 0.1
            },
            address: {
                name: 'Address',
                geometry: ['point', 'vertex', 'area'],
                tags: { 'addr:*': '*' },
                matchScore: 0.15
            },
            'highway/pedestrian_area': {
                name: 'Pedestrian Area',
                geometry: ['area'],
                tags: { highway: 'pedestrian', area: 'yes' }
            }
        };

        it('prefers building to multipolygon', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var relation = new iD.osmRelation({ tags: { type: 'multipolygon', building: 'yes' } });
            var graph = new iD.coreGraph([relation]);
            await presets.ensureLoaded();
            var match = presets.match(relation, graph);
            expect(match.id).toEqual('building');
        });

        it('prefers building to address', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var way = new iD.osmWay({ tags: { area: 'yes', building: 'yes', 'addr:housenumber': '1234' } });
            var graph = new iD.coreGraph([way]);
            await presets.ensureLoaded();
            var match = presets.match(way, graph);
            expect(match.id).toEqual('building');
        });

        it('prefers pedestrian to area', async () => {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var way = new iD.osmWay({ tags: { area: 'yes', highway: 'pedestrian' } });
            var graph = new iD.coreGraph([way]);
            await presets.ensureLoaded();
            var match = presets.match(way, graph);
            expect(match.id).toEqual('highway/pedestrian_area');
        });
    });


    describe.skip('#fromExternal', function () {
        var _server;
        var presetData = {
            presets: {
                '8bc64d6d': {
                    'name': 'Surf Shop',
                    'geometry': ['area', 'point'],
                    'fields': ['2161a712'],
                    'tags': { 'amenity': 'shop', 'shop:type': 'surf' },
                    'matchScore': 0.99
                }
            },
            'fields': {
                '2161a712': {
                    'key': 'building',
                    'label': 'Building',
                    'overrideLabel': 'Building',
                    'type': 'text'
                }
            }
        };

        beforeEach(function () {
            _server = window.fakeFetch().create();
        });

        afterEach(function () {
            _server.restore();
        });

        it('builds presets w/external sources set to addable', function () {
            var surfShop = new iD.osmNode({ tags: { amenity: 'shop', 'shop:type': 'surf' } });
            var graph = new iD.coreGraph([surfShop]);
            var url = 'https://fakemaprules.io/fake.json';

            // no external presets yet
            expect(iD.presetIndex().match(surfShop, graph).id).toEqual('point');

            // reset graph...
            graph = new iD.coreGraph([surfShop]);

            // add the validations query param...
            iD.presetIndex().fromExternal(url, function (externalPresets) {
                expect(externalPresets.match(surfShop, graph).id).toEqual('8bc64d6d');
            });

            _server.respondWith('GET', /fake\.json/,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(presetData)]
            );
            _server.respond();
        });

        it('makes only the external presets initially addable', function () {
            var url = 'https://fakemaprules.io/fake.json';

            iD.presetIndex().fromExternal(url, function(externalPresets) {
                var external = externalPresets.collection.reduce(function(presets, preset) {
                    if (!preset.hasOwnProperty('members') && preset.addable()) {
                        presets.push(preset.id);
                    }
                    return presets;
                }, []);

                var morePresetKeys = Object.keys(presetData.presets);
                expect(morePresetKeys.length).toEqual(external.length);

                morePresetKeys.forEach(function(presetID) {
                    expect(external.indexOf(presetID)).to.be.at.least(0);
                });
            });

            _server.respondWith('GET', /fake\.json/,
                [200, { 'Content-Type': 'application/json' }, JSON.stringify(presetData)]
            );
            _server.respond();
        });
    });

    describe('PresetIndex.recents', () => {
        it('fills all recent slots even when some remembered presets are not available in the current region (#11405)', () => {
            const testIndex = presetIndex();

            locationManager.locationSetsAt = () => new Map(Object.entries({ 'world': 1 }));

            const p1 = { id: 'p1', matchGeometry: () => true, locationSetID: 'world' };
            const p2 = { id: 'p2', matchGeometry: () => true, locationSetID: 'us_only' }; // Invalid
            const p3 = { id: 'p3', matchGeometry: () => true, locationSetID: 'world' };
            const p4 = { id: 'p4', matchGeometry: () => true, locationSetID: 'us_only' }; // Invalid
            const p5 = { id: 'p5', matchGeometry: () => true, locationSetID: 'world' };

            testIndex.recent = () => ({
                matchGeometry: () => ({
                    collection: [p1, p2, p3, p4, p5]
                })
            });

            const locCoords = [0, 51];
            const result = testIndex.defaults('point', 10, true, locCoords);

            const ids = result.collection.map(p => p.id);

            expect(ids).to.include('p5');
            expect(ids).to.not.include('p2');
            expect(ids).to.not.include('p4');
            expect(ids.slice(0, 3)).toEqual(['p1', 'p3', 'p5']);
        });
    });

});
