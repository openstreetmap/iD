describe("iD.presets.Category", function() {
    var category, residential;

    beforeEach(function() {
        category = {
            "match": {
                "type": "line"
            },
            "icon": "highway",
            "name": "roads",
            "members": [
                "residential"
            ]
        };
        residential = iD.presets.Preset({
            name: 'residential',
            match: {
                tags: {
                    highway: 'residential'
                },
                type: ['line']
            }
        });
    });

    it("maps members names to preset instances", function() {
        var c = iD.presets.Category(category, iD.presets.Collection([residential]));
        expect(c.members.collection[0]).to.eql(residential);
    });

    describe("#matchType", function() {
        it("matches the type of an entity", function() {
            var c = iD.presets.Category(category, iD.presets.Collection([residential])),
                w = iD.Way(),
                n = iD.Node(),
                g = iD.Graph().replace(w);
            expect(c.matchType(w, g)).to.eql(true);
            expect(c.matchType(n, g)).to.eql(false);
        });
    });
});
