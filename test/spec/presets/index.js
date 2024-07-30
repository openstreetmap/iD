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
            var node = iD.osmNode({ id: 'n' });
            var graph = iD.coreGraph([node]);
            var presets = iD.presetIndex();
            expect(presets.match(node, graph).id).to.eql('point');
        });
        it('has a fallback line preset', function () {
            var node = iD.osmNode({ id: 'n' });
            var way = iD.osmWay({ id: 'w', nodes: ['n'] });
            var graph = iD.coreGraph([node, way]);
            var presets = iD.presetIndex();
            expect(presets.match(way, graph).id).to.eql('line');
        });
        it('has a fallback area preset', function () {
            var node = iD.osmNode({ id: 'n' });
            var way = iD.osmWay({ id: 'w', nodes: ['n'], tags: { area: 'yes' }});
            var graph = iD.coreGraph([node, way]);
            var presets = iD.presetIndex();
            expect(presets.match(way, graph).id).to.eql('area');
        });
        it('has a fallback relation preset', function () {
            var relation = iD.osmRelation({ id: 'r' });
            var graph = iD.coreGraph([relation]);
            var presets = iD.presetIndex();
            expect(presets.match(relation, graph).id).to.eql('relation');
        });
    });


    describe('#match', function () {
        var testPresets = {
            residential: { tags: { highway: 'residential' }, geometry: ['line'] },
            park: { tags: { leisure: 'park' }, geometry: ['point', 'area'] }
        };

        it('returns a collection containing presets matching a geometry and tags', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {
                var way = iD.osmWay({ tags: { highway: 'residential' } });
                var graph = iD.coreGraph([way]);
                expect(presets.match(way, graph).id).to.eql('residential');
                done();
            });
        });

        it('returns the appropriate fallback preset when no tags match', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var point = iD.osmNode();
            var line = iD.osmWay({ tags: { foo: 'bar' } });
            var graph = iD.coreGraph([point, line]);

            presets.ensureLoaded().then(function() {
                expect(presets.match(point, graph).id).to.eql('point');
                expect(presets.match(line, graph).id).to.eql('line');
                done();
            });
        });

        it('matches vertices on a line as points', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var point = iD.osmNode({ tags: { leisure: 'park' } });
            var line = iD.osmWay({ nodes: [point.id], tags: { 'highway': 'residential' } });
            var graph = iD.coreGraph([point, line]);

            presets.ensureLoaded().then(function() {
                expect(presets.match(point, graph).id).to.eql('point');
                done();
            });
        });

        it('matches vertices on an addr:interpolation line as points', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var point = iD.osmNode({ tags: { leisure: 'park' } });
            var line = iD.osmWay({ nodes: [point.id], tags: { 'addr:interpolation': 'even' } });
            var graph = iD.coreGraph([point, line]);

            presets.ensureLoaded().then(function() {
                expect(presets.match(point, graph).id).to.eql('park');
                done();
            });
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

        it('includes keys for presets with area geometry', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {
                expect(presets.areaKeys()).to.include.keys('natural');
                done();
            });
        });

        it('discards key-values for presets with a line geometry', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {
                expect(presets.areaKeys().natural).to.include.keys('tree_row');
                expect(presets.areaKeys().natural.tree_row).to.be.true;
                done();
            });
        });

        it('discards key-values for presets with both area and line geometry', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {
                expect(presets.areaKeys().leisure).to.include.keys('track');
                done();
            });
        });

        it('does not discard key-values for presets with neither area nor line geometry', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {
                expect(presets.areaKeys().natural).not.to.include.keys('peak');
                done();
            });
        });

        it('does not discard generic \'*\' key-values', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {
                expect(presets.areaKeys().natural).not.to.include.keys('natural');
                done();
            });
        });

        it('ignores keys like \'highway\' that are assumed to be lines', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {
                expect(presets.areaKeys()).not.to.include.keys('highway');
                done();
            });
        });

        it('ignores suggestion presets', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {
                expect(presets.areaKeys()).not.to.include.keys('amenity');
                done();
            });
        });
    });


    describe('#addablePresetIDs', function () {
        var testPresets = {
            residential: { tags: { highway: 'residential' }, geometry: ['line'] },
            park: { tags: { leisure: 'park' }, geometry: ['point', 'area'] },
            bench: { tags: { amenity: 'bench' }, geometry: ['point', 'line'] }
        };

        it('addablePresetIDs is initially null', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {
                expect(presets.addablePresetIDs()).to.be.null;
                done();
            });
        });

        it('can set and get addablePresetIDs', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {

                expect(presets.item('residential').addable()).to.be.true;
                expect(presets.item('park').addable()).to.be.true;

                var ids = new Set(['residential']);   // can only add preset with this ID
                presets.addablePresetIDs(ids);

                expect(presets.item('residential').addable()).to.be.true;
                expect(presets.item('park').addable()).to.be.false;
                expect(presets.addablePresetIDs()).to.eql(ids);

                presets.addablePresetIDs(null);
                expect(presets.item('residential').addable()).to.be.true;
                expect(presets.item('park').addable()).to.be.true;

                done();
            });
        });

        it('ignores invalid IDs in addablePresetIDs', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {

                expect(presets.item(null)).to.eql(undefined);
                expect(presets.item(undefined)).to.eql(undefined);
                expect(presets.item('')).to.eql(undefined);
                expect(presets.item('garbage')).to.eql(undefined);
                expect(presets.item('residential').addable()).to.be.true;
                expect(presets.item('park').addable()).to.be.true;

                var ids = new Set([null, undefined, '', 'garbage', 'residential']);   // can only add preset with these IDs
                presets.addablePresetIDs(ids);

                expect(presets.item(null)).to.eql(undefined);
                expect(presets.item(undefined)).to.eql(undefined);
                expect(presets.item('')).to.eql(undefined);
                expect(presets.item('garbage')).to.eql(undefined);
                expect(presets.item('residential').addable()).to.be.true;
                expect(presets.item('park').addable()).to.be.false;
                expect(presets.addablePresetIDs()).to.eql(ids);

                presets.addablePresetIDs(null);
                expect(presets.item(null)).to.eql(undefined);
                expect(presets.item(undefined)).to.eql(undefined);
                expect(presets.item('')).to.eql(undefined);
                expect(presets.item('garbage')).to.eql(undefined);
                expect(presets.item('residential').addable()).to.be.true;
                expect(presets.item('park').addable()).to.be.true;

                done();
            });
        });

        it('addablePresetIDs are default presets', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            presets.ensureLoaded().then(function() {
                var ids = new Set(['bench', 'residential']);   // can only add presets with these IDs
                presets.addablePresetIDs(ids);

                var areaDefaults = presets.defaults('area', 10).collection;
                expect(areaDefaults.length).to.eql(0);

                var pointDefaults = presets.defaults('point', 10).collection;
                expect(pointDefaults.length).to.eql(1);
                expect(pointDefaults[0].id).to.eql('bench');

                var lineDefaults = presets.defaults('line', 10).collection;
                expect(lineDefaults.length).to.eql(2);
                expect(lineDefaults[0].id).to.eql('bench');
                expect(lineDefaults[1].id).to.eql('residential');

                done();
            });
        });
    });


    describe.skip('#build', function () {
        it('builds presets from provided', function () {
            var surfShop = iD.osmNode({ tags: { amenity: 'shop', 'shop:type': 'surf' } });
            var graph = iD.coreGraph([surfShop]);
            var presets = iD.presetIndex();
            var presetData = {
                presets: {
                    'amenity/shop/surf': {
                        tags: { amenity: 'shop', 'shop:type': 'surf' },
                        geometry: ['point', 'area']
                    }
                }
            };

            expect(presets.match(surfShop, graph)).to.eql(undefined); // no surfshop preset yet...
            presets.build(presetData, true);
            expect(presets.match(surfShop, graph).addTags).to.eql({ amenity: 'shop', 'shop:type': 'surf' });
        });

        it('configures presets\' initial visibility', function () {
            var surfShop = iD.osmNode({ tags: { amenity: 'shop', 'shop:type': 'surf' } });
            var firstStreetJetty = iD.osmNode({ tags: { man_made: 'jetty' } });
            var entities = [surfShop, firstStreetJetty];
            var graph = iD.coreGraph(entities);
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
                expect(preset.addable()).to.be.false;
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

        it('prefers building to multipolygon', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var relation = iD.osmRelation({ tags: { type: 'multipolygon', building: 'yes' } });
            var graph = iD.coreGraph([relation]);
            presets.ensureLoaded().then(function() {
                var match = presets.match(relation, graph);
                expect(match.id).to.eql('building');
                done();
            });
        });

        it('prefers building to address', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var way = iD.osmWay({ tags: { area: 'yes', building: 'yes', 'addr:housenumber': '1234' } });
            var graph = iD.coreGraph([way]);
            presets.ensureLoaded().then(function() {
                var match = presets.match(way, graph);
                expect(match.id).to.eql('building');
                done();
            });
        });

        it('prefers pedestrian to area', function (done) {
            iD.fileFetcher.cache().preset_presets = testPresets;
            var presets = iD.presetIndex();
            var way = iD.osmWay({ tags: { area: 'yes', highway: 'pedestrian' } });
            var graph = iD.coreGraph([way]);
            presets.ensureLoaded().then(function() {
                var match = presets.match(way, graph);
                expect(match.id).to.eql('highway/pedestrian_area');
                done();
            });
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
            var surfShop = iD.osmNode({ tags: { amenity: 'shop', 'shop:type': 'surf' } });
            var graph = iD.coreGraph([surfShop]);
            var url = 'https://fakemaprules.io/fake.json';

            // no external presets yet
            expect(iD.presetIndex().match(surfShop, graph).id).to.eql('point');

            // reset graph...
            graph = iD.coreGraph([surfShop]);

            // add the validations query param...
            iD.presetIndex().fromExternal(url, function (externalPresets) {
                expect(externalPresets.match(surfShop, graph).id).to.eql('8bc64d6d');
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
                expect(morePresetKeys.length).to.eql(external.length);

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

});
