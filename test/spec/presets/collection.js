describe("iD.prests.Collection", function() {

    var p = {
        other: iD.presets.Preset({
            name: 'other',
            match: {
                tags: {},
                type: ['point', 'vertex', 'line', 'area']
            }
        }),
        residential: iD.presets.Preset({
            name: 'residential',
            match: {
                tags: {
                    highway: 'residential'
                },
                type: ['line']
            }
        }),
        park: iD.presets.Preset({
            name: 'park',
            match: {
                tags: {
                    leisure: 'park'
                },
                type: ['point', 'area']
            }
        })
    };

    var c = iD.presets.Collection([p.other, p.residential]),
        n = iD.Node( { id: 'n1' }),
        w = iD.Way({ tags: { highway: 'residential' }}),
        g = iD.Graph().replace(w);

    describe("#item", function() {
        it("fetches a preset by name", function() {
            expect(c.item('residential')).to.equal(p.residential);
        });
    });

    describe("#matchType", function() {
        it("returns a new collection only containing presets matching an entity's type", function() {
            expect(c.matchType(w, g).collection).to.eql([p.other, p.residential]);
        });
    });

    describe("#matchTags", function() {
        it("returns a new collection only containing presets matching an entity's tags", function() {
            expect(c.matchTags(w, g)).to.eql(p.residential);
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
    });

});
