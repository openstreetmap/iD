describe("iD.presets.Collection", function() {

    var p = {
        point: iD.presets.Preset('point', {
            tags: {},
            geometry: ['point']
        }),
        area: iD.presets.Preset('area', {
            tags: {},
            geometry: ['area']
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

    var c = iD.presets.Collection([p.point, p.area, p.residential, p.park]),
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
            expect(c.matchGeometry('area').collection).to.eql([p.area, p.park]);
        });
    });

    describe("#search", function() {
        it("filters presets by name", function() {
            expect(c.search("resid", "line").collection.indexOf(p.residential) >= 0).to.eql(true);
        });

        it("is fuzzy", function() {
            expect(c.search("rusid", "line").collection.indexOf(p.residential) >= 0).to.eql(true);
        });

        it("includes the appropriate fallback preset", function() {
            expect(c.search("blade of grass", "point").collection.indexOf(p.point) >= 0).to.eql(true);
            expect(c.search("blade of grass", "area").collection.indexOf(p.area) >= 0).to.eql(true);
        });

        it("excludes presets with searchable: false", function() {
            var excluded = iD.presets.Preset('excluded', {
                    tags: {},
                    geometry: [],
                    searchable: false
                }),
                collection = iD.presets.Collection([excluded, p.point]);
            expect(collection.search("excluded", "point").collection).not.to.include(excluded);
        });
    });
});
