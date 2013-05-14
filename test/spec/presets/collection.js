describe("iD.presets.Collection", function() {

    var p = {
        other: iD.presets.Preset('other', {
            tags: {},
            geometry: ['point', 'vertex', 'line', 'area']
        }),
        residential: iD.presets.Preset('highway/residential', {
            tags: {
                highway: 'residential'
            },
            geometry: ['line']
        }),
        park: iD.presets.Preset('leisure/park', {
            tags: {
                leisure: 'park'
            },
            geometry: ['point', 'area']
        })
    };

    var c = iD.presets.Collection([p.other, p.residential]),
        n = iD.Node( { id: 'n1' }),
        w = iD.Way({ tags: { highway: 'residential' }}),
        g = iD.Graph().replace(w);

    describe("#item", function() {
        it("fetches a preset by id", function() {
            expect(c.item('highway/residential')).to.equal(p.residential);
        });
    });

    describe("#matchGeometry", function() {
        it("returns a new collection only containing presets matching a geometry", function() {
            expect(c.matchGeometry('line').collection).to.eql([p.other, p.residential]);
        });
    });

    describe("#search", function() {
        it("filters presets by name", function() {
            expect(c.search("resid").collection.indexOf(p.residential) >= 0).to.eql(true);
        });

        it("is fuzzy", function() {
            expect(c.search("rusid").collection.indexOf(p.residential) >= 0).to.eql(true);
        });

        it("always includes other", function() {
            expect(c.search("blade of grass").collection.indexOf(p.other) >= 0).to.eql(true);
        });

        it("excludes presets with searchable: false", function() {
            var excluded = iD.presets.Preset('excluded', {
                    tags: {},
                    geometry: [],
                    searchable: false
                }),
                collection = iD.presets.Collection([excluded, p.other]);
            expect(collection.search("excluded").collection).not.to.include(excluded);
        });
    });
});
