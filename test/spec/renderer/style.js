describe('iD.Style', function() {
    describe('#waystack', function() {
        it('stacks bridges over non-bridges', function() {
            var a = { tags: { bridge: 'yes' } },
            b = { tags: {} };
            expect(iD.Style.waystack(a, b)).to.equal(1);
            expect(iD.Style.waystack(b, a)).to.equal(-1);
        });

        it('stacks layers', function() {
            var a = { tags: { layer: 1 } },
            b = { tags: { layer: 0 } };
            expect(iD.Style.waystack(a, b)).to.equal(1);
            expect(iD.Style.waystack(b, a)).to.equal(-1);
        });
    });

    describe('#styleClasses', function() {
        it('returns an empty string when no classes are present', function() {
            var classes = iD.Style.styleClasses(''),
                entity = iD.Entity();
            expect(classes(entity)).to.equal('');
        });

        it('returns a string containing predefined classes', function() {
            var classes = iD.Style.styleClasses('selected'),
                entity = iD.Entity();
            expect(classes(entity)).to.equal('selected');
        });

        it('returns a string containing classes for highway tags', function() {
            var classes = iD.Style.styleClasses(''),
                entity = iD.Entity({tags: {highway: 'primary'}});
            expect(classes(entity)).to.equal('tag-highway tag-highway-primary');
        });
    });
});
