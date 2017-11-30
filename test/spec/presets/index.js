describe('iD.presetIndex', function() {
    var savedPresets;

    before(function () {
        savedPresets = iD.data.presets;
    });

    after(function () {
        iD.data.presets = savedPresets;
    });

    describe('#match', function() {
        var testPresets = {
            presets: {
                point: {
                    tags: {},
                    geometry: ['point']
                },
                line: {
                    tags: {},
                    geometry: ['line']
                },
                vertex: {
                    tags: {},
                    geometry: ['vertex']
                },
                residential: {
                    tags: { highway: 'residential' },
                    geometry: ['line']
                },
                park: {
                    tags: { leisure: 'park' },
                    geometry: ['point', 'area']
                }
            }
        };

        it('returns a collection containing presets matching a geometry and tags', function() {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets(),
                way = iD.Way({ tags: { highway: 'residential' } }),
                graph = iD.Graph([way]);

            expect(presets.match(way, graph).id).to.eql('residential');
        });

        it('returns the appropriate fallback preset when no tags match', function() {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets(),
                point = iD.Node(),
                line = iD.Way({ tags: { foo: 'bar' } }),
                graph = iD.Graph([point, line]);

            expect(presets.match(point, graph).id).to.eql('point');
            expect(presets.match(line, graph).id).to.eql('line');
        });

        it('matches vertices on a line as vertices', function() {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets(),
                point = iD.Node({ tags: { leisure: 'park' } }),
                line = iD.Way({ nodes: [point.id], tags: { 'highway': 'residential' } }),
                graph = iD.Graph([point, line]);

            expect(presets.match(point, graph).id).to.eql('vertex');
        });

        it('matches vertices on an addr:interpolation line as points', function() {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets(),
                point = iD.Node({ tags: { leisure: 'park' } }),
                line = iD.Way({ nodes: [point.id], tags: { 'addr:interpolation': 'even' } }),
                graph = iD.Graph([point, line]);

            expect(presets.match(point, graph).id).to.eql('park');
        });
    });


    describe('#areaKeys', function() {
        var testPresets = {
            presets: {
                'amenity/fuel/shell': {
                    tags: { 'amenity': 'fuel' },
                    geometry: ['point','area'],
                    suggestion: true
                },
                'highway/foo': {
                    tags: { 'highway': 'foo' },
                    geometry: ['area']
                },
                'leisure/track': {
                    tags: { 'leisure': 'track' },
                    geometry: ['line', 'area']
                },
                'natural': {
                    tags: { 'natural': '*' },
                    geometry: ['point', 'vertex', 'area']
                },
                'natural/peak': {
                    tags: { 'natural': 'peak' },
                    geometry: ['point', 'vertex']
                },
                'natural/tree_row': {
                    tags: { 'natural': 'tree_row' },
                    geometry: ['line']
                },
                'natural/wood': {
                    tags: { 'natural': 'wood' },
                    geometry: ['point', 'area']
                }
            }
        };

        it('whitelists keys for presets with area geometry', function() {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys()).to.include.keys('natural');
        });

        it('blacklists key-values for presets with a line geometry', function() {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys().natural).to.include.keys('tree_row');
            expect(presets.areaKeys().natural.tree_row).to.be.true;
        });

        it('blacklists key-values for presets with both area and line geometry', function() {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys().leisure).to.include.keys('track');
        });

        it('does not blacklist key-values for presets with neither area nor line geometry', function() {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys().natural).not.to.include.keys('peak');
        });

        it('does not blacklist generic \'*\' key-values', function() {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys().natural).not.to.include.keys('natural');
        });

        it('ignores keys like \'highway\' that are assumed to be lines', function() {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys()).not.to.include.keys('highway');
        });

        it('ignores suggestion presets', function() {
            iD.data.presets = testPresets;
            var presets = iD.Context().presets();
            expect(presets.areaKeys()).not.to.include.keys('amenity');
        });
    });


    describe('expected matches', function() {

        it('prefers building to multipolygon', function() {
            iD.data.presets = savedPresets;
            var presets = iD.Context().presets(),
                relation = iD.Relation({ tags: { type: 'multipolygon', building: 'yes' }}),
                graph = iD.Graph([relation]);
            expect(presets.match(relation, graph).id).to.eql('building');
        });

        it('prefers building to address', function() {
            iD.data.presets = savedPresets;
            var presets = iD.Context().presets(),
                way = iD.Way({ tags: { area: 'yes', building: 'yes', 'addr:housenumber': '1234' }}),
                graph = iD.Graph([way]);
            expect(presets.match(way, graph).id).to.eql('building');
        });

        it('prefers pedestrian to area', function() {
            iD.data.presets = savedPresets;
            var presets = iD.Context().presets(),
                way = iD.Way({ tags: { area: 'yes', highway: 'pedestrian' }}),
                graph = iD.Graph([way]);
            expect(presets.match(way, graph).id).to.eql('highway/pedestrian_area');
        });
    });

});
