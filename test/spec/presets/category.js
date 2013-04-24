describe("iD.presets.Category", function() {
    var category, residential;

    beforeEach(function() {
        category = {
            "geometry": "line",
            "icon": "highway",
            "name": "roads",
            "members": [
                "highway/residential"
            ]
        };
        residential = iD.presets.Preset('highway/residential', {
            tags: {
                highway: 'residential'
            },
            geometry: ['line']
        });
    });

    it("maps members names to preset instances", function() {
        var c = iD.presets.Category('road', category, iD.presets.Collection([residential]));
        expect(c.members.collection[0]).to.eql(residential);
    });

    describe("#matchGeometry", function() {
        it("matches the type of an entity", function() {
            var c = iD.presets.Category('road', category, iD.presets.Collection([residential])),
                w = iD.Way(),
                n = iD.Node(),
                g = iD.Graph().replace(w);
            expect(c.matchGeometry('line')).to.eql(true);
            expect(c.matchGeometry('point')).to.eql(false);
        });
    });
});
