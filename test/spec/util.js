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

    describe('geo', function() {
        describe('#interp', function() {
            it('interpolates halfway', function() {
                var a = [0, 0],
                    b = [10, 10];
                expect(iD.util.geo.interp(a, b, 0.5)).to.eql([5, 5]);
            });
            it('interpolates to one side', function() {
                var a = [0, 0],
                    b = [10, 10];
                expect(iD.util.geo.interp(a, b, 0)).to.eql([0, 0]);
            });
        });

        describe('#dist', function() {
            it('distance between two same points is zero', function() {
                var a = [0, 0],
                    b = [0, 0];
                expect(iD.util.geo.dist(a, b)).to.eql(0);
            });
            it('a straight 10 unit line is 10', function() {
                var a = [0, 0],
                    b = [10, 0];
                expect(iD.util.geo.dist(a, b)).to.eql(10);
            });
            it('a pythagorean triangle is right', function() {
                var a = [0, 0],
                    b = [4, 3];
                expect(iD.util.geo.dist(a, b)).to.eql(5);
            });
        });
    });
});
