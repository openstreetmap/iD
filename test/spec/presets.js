describe("iD.presets", function() {
    var p = {
        other: {
            tags: {},
            geometry: ['point', 'vertex', 'line', 'area']
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

    var c = iD.presets().load({presets: p}),
        w = iD.Way({tags: { highway: 'residential'}}),
        g = iD.Graph().replace(w);

    describe("#match", function() {
        it("returns a collection containing presets matching a geometry and tags", function() {
            var way = iD.Way({tags: { highway: 'residential'}}),
                graph = iD.Graph([way]);
            expect(c.match(way, graph).id).to.eql('residential');
        });

        it("returns an other preset when no tags match", function() {
            var way = iD.Way({tags: {foo: 'bar'}}),
                graph = iD.Graph([way]);
            expect(c.match(way, graph).id).to.eql('other');
        });
    });
});
