describe('iD.presets.Preset', function() {

    var fields, p;

    beforeEach(function() {
        if (!p) {
            fields = {};
            var i = 0;
            for (i in iD.data.presets.fields) {
                fields[i] = iD.presets.Field(i, iD.data.presets.fields[i]);
            }
            p = {};
            for (i in iD.data.presets.presets) {
                p[i] = iD.presets.Preset(i, iD.data.presets.presets[i], fields);
            }
        }
    });

     var w1 = iD.Way({ tags: {
            highway: 'motorway'
        }}),
        w2 = iD.Way({ tags: {
            leisure: 'pitch',
            sport: 'tennis'
        }}),
        w3 = iD.Way({ tags: {
            highway: 'residential'
        }}),
        w4 = iD.Way({ tags: {
            building: 'yep'
        }}),
        w5 = iD.Way(),
        g = iD.Graph().replace(w1).replace(w2);


    it("has optional fields", function() {
        expect(p.point.fields).to.eql([]);
    });

    describe('#matchGeometry', function() {
        var n = iD.Node();
        var g = iD.Graph().replace(n);

        it("returns false if it doesn't match", function() {
            expect(p['highway/residential'].matchGeometry('point')).to.equal(false);
        });

        it("returns true if it does match", function() {
            expect(p.point.matchGeometry('point')).to.equal(true);
        });
    });

    describe('#matchScore', function() {
        it("returns -1 if preset does not match tags", function() {
            expect(p['highway/residential'].matchScore(w1)).to.equal(-1);
        });

        it("returns 0 for fallback presets", function() {
            expect(p.point.matchScore(w1)).to.equal(0);
        });

        it("returns the number of matched tags", function() {
            expect(p['highway/residential'].matchScore(w3)).to.equal(1);
            expect(p['leisure/pitch/tennis'].matchScore(w2)).to.equal(2);
        });

        it("counts * as a match for any value", function() {
            expect(p.building.matchScore(w4)).to.equal(0.5);
            expect(p.building.matchScore(w5)).to.equal(-1);
        });
    });

    describe("isFallback", function() {
        it("returns true if preset has no tags", function() {
            expect(iD.presets.Preset("area", {name: "Area", tags: {}}).isFallback()).to.equal(true);
        });

        it("returns false if preset has no tags", function() {
            expect(p.building.isFallback()).to.equal(false);
        });
    });

    describe('#applyTags', function() {
        it("adds match tags", function() {
            expect(p['highway/residential'].applyTags({}, 'area')).to.eql({ highway: 'residential' });
        });

        it("does not add wildcard tags", function() {
            expect(p.amenity.applyTags({}, 'area')).to.eql({});
        });

        it("adds default tags", function() {
            expect(p['amenity/cafe'].applyTags({}, 'area')).to.eql({ amenity: 'cafe', building: 'yes'});
            expect(p['amenity/cafe'].applyTags({}, 'point')).to.eql({ amenity: 'cafe' });
        });
    });

    describe('#removeTags', function() {
        it('removes match tags', function() {
            expect(p['highway/residential'].removeTags({ highway: 'residential' }, 'area')).to.eql({});
        });

        it('removes default tags', function() {
            expect(p['amenity/cafe'].removeTags({ amenity: 'cafe', building: 'yes'}, 'area')).to.eql({});
            expect(p['amenity/cafe'].removeTags({ amenity: 'cafe', building: 'yep'}, 'area')).to.eql({ building: 'yep'});
        });
    });
});
