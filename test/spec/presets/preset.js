describe('iD.presets.Preset', function() {

    var fields = {
        "building_area": {
            "key": "building",
            "type": "check",
            "default": { "area": "yes" }
        }
    };

    var p = {
        other: iD.presets.Preset({
            name: 'other',
            match: {
                tags: {},
                geometry: ['point', 'vertex', 'line', 'area']
            }
        }),
        residential: iD.presets.Preset({
            name: 'residential',
            match: {
                tags: {
                    highway: 'residential'
                },
                geometry: ['line']
            }
        }),
        tennis: iD.presets.Preset({
            name: 'tennis',
            match: {
                tags: {
                    leisure: 'pitch',
                    sport: 'tennis'
                },
                geometry: ['area']
            }
        }),
        building: iD.presets.Preset({
            name: 'building',
            match: {
                tags: {
                    building: '*'
                },
                geometry: ['area']
            }
        }),
        cafe: iD.presets.Preset({
            name: 'cafe',
            match: {
                tags: {
                    amenity: 'cafe'
                },
                geometry: ['point', 'area']
            },
            fields: ['building_area']
        }, fields)
    };
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
        expect(p.other.fields).to.eql([]);
    });

    describe('#matchGeometry', function() {
        var n = iD.Node();
        var g = iD.Graph().replace(p);
        it("returns false if it doesn't match the entity type", function() {
            expect(p.residential.matchGeometry(n, g)).to.equal(false);
        });

        it("returns true if it does match the entity type", function() {
            expect(p.other.matchGeometry(n, g)).to.equal(true);
        });
    });

    describe('#matchTags', function() {
       it("returns -1 if preset does not match tags", function() {
            expect(p.residential.matchTags(w1)).to.equal(-1);
        });

        it("returns 0 for other preset (no match tags)", function() {
            expect(p.other.matchTags(w1)).to.equal(0);
        });

        it("returns the number of matched tags", function() {
            expect(p.residential.matchTags(w3)).to.equal(1);
            expect(p.tennis.matchTags(w2)).to.equal(2);
        });

        it("counts * as a match for any value", function() {
            expect(p.building.matchTags(w4)).to.equal(0.5);
            expect(p.building.matchTags(w5)).to.equal(-1);
        });

    });

    describe('#applyTags', function() {

        it("adds match tags", function() {
            expect(p.residential.applyTags({}, 'area')).to.eql({ highway: 'residential' });
        });

        it("does not add wildcard tags", function() {
            expect(p.building.applyTags({}, 'area')).to.eql({});
        });

        it("adds default tags", function() {
            expect(p.cafe.applyTags({}, 'area')).to.eql({ amenity: 'cafe', building: 'yes'});
            expect(p.cafe.applyTags({}, 'point')).to.eql({ amenity: 'cafe' });
        });
    });

    describe('#removeTags', function() {

        it('removes match tags', function() {
            expect(p.residential.removeTags({ highway: 'residential' }, 'area')).to.eql({});
        });

        it('removes default tags', function() {
            expect(p.cafe.removeTags({ amenity: 'cafe', building: 'yes'}, 'area')).to.eql({});
            expect(p.cafe.removeTags({ amenity: 'cafe', building: 'yep'}, 'area')).to.eql({ building: 'yep'});
        });
    });

});
