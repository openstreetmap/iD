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
