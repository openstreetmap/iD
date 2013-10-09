describe('iD.presets.Preset', function() {
    it("has optional fields", function() {
        var preset = iD.presets.Preset('test', {});
        expect(preset.fields).to.eql([]);
    });

    describe('#matchGeometry', function() {
        it("returns false if it doesn't match", function() {
            var preset = iD.presets.Preset('test', {geometry: ['line']});
            expect(preset.matchGeometry('point')).to.equal(false);
        });

        it("returns true if it does match", function() {
            var preset = iD.presets.Preset('test', {geometry: ['point', 'line']});
            expect(preset.matchGeometry('point')).to.equal(true);
        });
    });

    describe('#matchScore', function() {
        it("returns -1 if preset does not match tags", function() {
            var preset = iD.presets.Preset('test', {tags: {foo: 'bar'}}),
                entity = iD.Way({tags: {highway: 'motorway'}});
            expect(preset.matchScore(entity)).to.equal(-1);
        });

        it("returns the value of the matchScore property when matched", function() {
            var preset = iD.presets.Preset('test', {tags: {highway: 'motorway'}, matchScore: 0.2}),
                entity = iD.Way({tags: {highway: 'motorway'}});
            expect(preset.matchScore(entity)).to.equal(0.2);
        });

        it("defaults to the number of matched tags", function() {
            var preset = iD.presets.Preset('test', {tags: {highway: 'residential'}}),
                entity = iD.Way({tags: {highway: 'residential'}});
            expect(preset.matchScore(entity)).to.equal(1);

            var preset = iD.presets.Preset('test', {tags: {highway: 'service', service: 'alley'}}),
                entity = iD.Way({tags: {highway: 'service', service: 'alley'}});
            expect(preset.matchScore(entity)).to.equal(2);
        });

        it("counts * as a match for any value with score 0.5", function() {
            var preset = iD.presets.Preset('test', {tags: {building: '*'}}),
                entity = iD.Way({tags: {building: 'yep'}});
            expect(preset.matchScore(entity)).to.equal(0.5);
        });
    });

    describe("isFallback", function() {
        it("returns true if preset has no tags", function() {
            var preset = iD.presets.Preset("area", {tags: {}});
            expect(preset.isFallback()).to.equal(true);
        });

        it("returns false if preset has tags", function() {
            var preset = iD.presets.Preset("area", {tags: {building: 'yes'}});
            expect(preset.isFallback()).to.equal(false);
        });
    });

    describe('#applyTags', function() {
        it("adds match tags", function() {
            var preset = iD.presets.Preset('test', {tags: {highway: 'residential'}});
            expect(preset.applyTags({}, 'area')).to.eql({highway: 'residential'});
        });

        it("adds wildcard tags with value 'yes'", function() {
            var preset = iD.presets.Preset('test', {tags: {building: '*'}});
            expect(preset.applyTags({}, 'area')).to.eql({building: 'yes'});
        });

        it("prefers to add tags of addTags property", function() {
            var preset = iD.presets.Preset('test', {tags: {building: '*'}, addTags: {building: 'ok'}});
            expect(preset.applyTags({}, 'area')).to.eql({building: 'ok'});
        });

        it("adds default tags of fields with matching geometry", function() {
            var field = iD.presets.Field('field', {key: 'building', geometry: 'area', default: 'yes'}),
                preset = iD.presets.Preset('test', {fields: ['field']}, {field: field});
            expect(preset.applyTags({}, 'area')).to.eql({building: 'yes'});
        });

        it("adds no default tags of fields with non-matching geometry", function() {
            var field = iD.presets.Field('field', {key: 'building', geometry: 'area', default: 'yes'}),
                preset = iD.presets.Preset('test', {fields: ['field']}, {field: field});
            expect(preset.applyTags({}, 'point')).to.eql({});
        });
    });

    describe('#removeTags', function() {
        it('removes tags that match preset tags', function() {
            var preset = iD.presets.Preset('test', {tags: {highway: 'residential'}});
            expect(preset.removeTags({highway: 'residential'}, 'area')).to.eql({});
        });

        it('removes tags that match field default tags', function() {
            var field = iD.presets.Field('field', {key: 'building', geometry: 'area', default: 'yes'}),
                preset = iD.presets.Preset('test', {fields: ['field']}, {field: field});
            expect(preset.removeTags({building: 'yes'}, 'area')).to.eql({});
        });

        it('preserves tags that do not match field default tags', function() {
            var field = iD.presets.Field('field', {key: 'building', geometry: 'area', default: 'yes'}),
                preset = iD.presets.Preset('test', {fields: ['field']}, {field: field});
            expect(preset.removeTags({building: 'yep'}, 'area')).to.eql({ building: 'yep'});
        });

        it('preserves tags that are not listed in removeTags', function() {
            var preset = iD.presets.Preset('test', {tags: {a: 'b'}, removeTags: {}});
            expect(preset.removeTags({a: 'b'}, 'area')).to.eql({a: 'b'});
        });
    });
});
