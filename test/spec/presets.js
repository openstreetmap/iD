describe("iD.presets", function() {
    var p = {
        point: {
            tags: {},
            geometry: ['point']
        },
        line: {
            tags: {},
            geometry: ['line']
        },
        residential: {
            tags: {
                highway: 'residential'
            },
            geometry: ['line']
        },
        park: {
            tags: {
                leisure: 'park'
            },
            geometry: ['point', 'area']
        }
    };

    var c = iD.presets().load({presets: p});

    describe("#match", function() {
        it("returns a collection containing presets matching a geometry and tags", function() {
            var way = iD.Way({tags: { highway: 'residential'}}),
                graph = iD.Graph([way]);
            expect(c.match(way, graph).id).to.eql('residential');
        });

        it("returns the appropriate fallback preset when no tags match", function() {
            var point = iD.Node(),
                line = iD.Way({tags: {foo: 'bar'}}),
                graph = iD.Graph([point, line]);
            expect(c.match(point, graph).id).to.eql('point');
            expect(c.match(line, graph).id).to.eql('line');
        });
    });

    describe("#areaKeys", function() {
        var presets = iD.presets().load({
            presets: {
                'amenity/fuel/shell': {
                    tags: { 'amenity': 'fuel' },
                    geometry: ['point','area'],
                    suggestion: true
                },
                'golf/water_hazard': {
                    tags: { 'golf': 'water_hazard' },
                    geometry: ['line','area']
                },
                'highway/foo': {
                    tags: { 'highway': 'foo' },
                    geometry: ['area']
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
                }
                'natural/wood': {
                    tags: { 'natural': 'wood' },
                    geometry: ['point', 'area']
                }
            }
        });

        it("whitelists keys for presets with area geometry", function() {
            expect(presets.areaKeys()).to.have.key('natural');
        });

        it("blacklists key-values for presets with a line geometry", function() {
            expect(presets.areaKeys().natural).to.have.key('tree_row');
            expect(presets.areaKeys().natural.tree_row).to.eq(true);
        });

        it("does not blacklist key-values for presets with both area and line geometry", function() {
            expect(presets.areaKeys().golf).not.to.have.key('water_hazard');
        });

        it("does not blacklist key-values for presets with neither area nor line geometry", function() {
            expect(presets.areaKeys().natural).not.to.have.key('peak');
        });

        it("does not blacklist generic '*' key-values", function() {
            expect(presets.areaKeys().natural).not.to.have.key('natural');
        });

        it("ignores keys like 'highway' that are assumed to be lines", function() {
            expect(presets.areaKeys()).not.to.have.key('highway');
        });

        it("ignores suggestion presets", function() {
            expect(presets.areaKeys()).not.to.have.key('amenity');
        });

    });

    describe("expected matches", function() {
        var presets;

        before(function() {
            presets = iD.presets().load(iD.data.presets);
        });

        it("prefers building to multipolygon", function() {
            var relation = iD.Relation({tags: {type: 'multipolygon', building: 'yes'}}),
                graph    = iD.Graph([relation]);
            expect(presets.match(relation, graph).id).to.eql('building');
        });

        it("prefers building to address", function() {
            var way   = iD.Way({tags: {area: 'yes', building: 'yes', 'addr:housenumber': '1234'}}),
                graph = iD.Graph([way]);
            expect(presets.match(way, graph).id).to.eql('building');
        });

        it("prefers pedestrian to area", function() {
            var way   = iD.Way({tags: {area: 'yes', highway: 'pedestrian'}}),
                graph = iD.Graph([way]);
            expect(presets.match(way, graph).id).to.eql('highway/pedestrian');
        });
    });
});
