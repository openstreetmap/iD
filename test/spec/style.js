describe('Style', function() {
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
        it('no valid classes', function() {
            var a = { tags: { } };
            expect(iD.Style.styleClasses('')(a)).to.equal('');
        });
        it('a valid class', function() {
            var a = { tags: { highway: 'primary' } };
            expect(iD.Style.styleClasses('')(a)).to.equal(' highway-primary highway');
        });
    });
});
