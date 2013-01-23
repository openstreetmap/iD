describe('iD.Util', function() {
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
            expect(iD.geo.roundCoords([0.1, 1])).to.eql([0, 1]);
            expect(iD.geo.roundCoords([0, 1])).to.eql([0, 1]);
            expect(iD.geo.roundCoords([0, 1.1])).to.eql([0, 1]);
        });

        describe('#interp', function() {
            it('interpolates halfway', function() {
                var a = [0, 0],
                    b = [10, 10];
                expect(iD.geo.interp(a, b, 0.5)).to.eql([5, 5]);
            });
            it('interpolates to one side', function() {
                var a = [0, 0],
                    b = [10, 10];
                expect(iD.geo.interp(a, b, 0)).to.eql([0, 0]);
            });
        });

        describe('#dist', function() {
            it('distance between two same points is zero', function() {
                var a = [0, 0],
                    b = [0, 0];
                expect(iD.geo.dist(a, b)).to.eql(0);
            });
            it('a straight 10 unit line is 10', function() {
                var a = [0, 0],
                    b = [10, 0];
                expect(iD.geo.dist(a, b)).to.eql(10);
            });
            it('a pythagorean triangle is right', function() {
                var a = [0, 0],
                    b = [4, 3];
                expect(iD.geo.dist(a, b)).to.eql(5);
            });
        });

        describe('#pointInPolygon', function() {
            it('says a point in a polygon is on a polygon', function() {
                var poly = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]];
                var point = [0.5, 0.5];
                expect(iD.geo.pointInPolygon(point, poly)).to.be.true;
            });
            it('says a point outside of a polygon is outside', function() {
                var poly = [
                    [0, 0],
                    [0, 1],
                    [1, 1],
                    [1, 0],
                    [0, 0]];
                var point = [0.5, 1.5];
                expect(iD.geo.pointInPolygon(point, poly)).to.be.false;
            });
        });

        describe('#polygonContainsPolygon', function() {
            it('says a polygon in a polygon is in', function() {
                var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
                var inner = [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]];
                expect(iD.geo.polygonContainsPolygon(outer, inner)).to.be.true;
            });
            it('says a polygon outside of a polygon is out', function() {
                var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
                var inner = [[1, 1], [1, 9], [2, 2], [2, 1], [1, 1]];
                expect(iD.geo.polygonContainsPolygon(outer, inner)).to.be.false;
            });
        });

        describe('#polygonIntersectsPolygon', function() {
            it('says a polygon in a polygon intersects it', function() {
                var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
                var inner = [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]];
                expect(iD.geo.polygonIntersectsPolygon(outer, inner)).to.be.true;
            });

            it('says a polygon that partially intersects does', function() {
                var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
                var inner = [[-1, -1], [1, 2], [2, 2], [2, 1], [1, 1]];
                expect(iD.geo.polygonIntersectsPolygon(outer, inner)).to.be.true;
            });

            it('says totally disjoint polygons do not intersect', function() {
                var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
                var inner = [[-1, -1], [-1, -2], [-2, -2], [-2, -1], [-1, -1]];
                expect(iD.geo.polygonIntersectsPolygon(outer, inner)).to.be.false;
            });
        });
    });
});
