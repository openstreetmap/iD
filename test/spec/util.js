describe('Util', function() {
    var util;

    it('#id', function() {
        var a = iD.util.id(),
        b = iD.util.id(),
        c = iD.util.id(),
        d = iD.util.id();
        expect(a === b).to.equal(false);
        expect(b === c).to.equal(false);
        expect(c === d).to.equal(false);
    });

    it('#trueObj', function() {
        expect(iD.util.trueObj(['a', 'b', 'c'])).to.eql({ a: true, b: true, c: true });
        expect(iD.util.trueObj([])).to.eql({});
    });

    it('#friendlyName', function() {
        expect(iD.util.friendlyName({ tags: { name: 'hi' }})).to.equal('hi');
        expect(iD.util.friendlyName({ tags: { highway: 'Route 5' }})).to.equal('Route 5');
        expect(iD.util.friendlyName({ tags: { name: 'hi', highway: 'Route 5' }})).to.equal('hi');
    });

    describe('#interp', function() {
        it('interpolates halfway', function() {
            var a = { lat: 0, lon: 0 },
            b = { lat: 10, lon: 10 };
            expect(iD.util.geo.interp(a, b, 0.5)).to.eql({ lat: 5, lon: 5});
        });
        it('interpolates to one side', function() {
            var a = { lat: 0, lon: 0 },
            b = { lat: 10, lon: 10 };
            expect(iD.util.geo.interp(a, b, 0)).to.eql({ lat: 0, lon: 0});
        });
    });
});
