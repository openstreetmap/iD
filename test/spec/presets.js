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
});
