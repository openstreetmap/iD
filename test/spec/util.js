describe('Util', function() {
    var util;

    it('#trueObj', function() {
        expect(iD.util.trueObj(['a', 'b', 'c'])).to.eql({ a: true, b: true, c: true });
        expect(iD.util.trueObj([])).to.eql({});
    });

    it('#tagText', function() {
        expect(iD.util.tagText({})).to.eql('');
        expect(iD.util.tagText({tags:{foo:'bar'}})).to.eql('foo: bar');
        expect(iD.util.tagText({tags:{foo:'bar',two:'three'}})).to.eql('foo: bar\ntwo: three');
    });

    it('#stringQs', function() {
        expect(iD.util.stringQs('foo=bar')).to.eql({foo: 'bar'});
        expect(iD.util.stringQs('foo=bar&one=2')).to.eql({foo: 'bar', one: '2' });
        expect(iD.util.stringQs('')).to.eql({});
    });

    it('#qsString', function() {
        expect(iD.util.qsString({ foo: 'bar' })).to.eql('foo=bar');
        expect(iD.util.qsString({ foo: 'bar', one: 2 })).to.eql('foo=bar&one=2');
        expect(iD.util.qsString({})).to.eql('');
    });

    describe('geo', function() {
        describe('#roundCoords', function() {
            expect(iD.util.geo.roundCoords([0.1, 1])).to.eql([0, 1]);
            expect(iD.util.geo.roundCoords([0, 1])).to.eql([0, 1]);
            expect(iD.util.geo.roundCoords([0, 1.1])).to.eql([0, 1]);
        });

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
