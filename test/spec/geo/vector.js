describe('iD.geo - vector', function() {

    describe('geoVecEqual', function() {
        it('tests vectors for exact equality', function() {
            expect(iD.geoVecEqual([1, 2], [1, 2])).to.be.true;
            expect(iD.geoVecEqual([1, 2], [1, 0])).to.be.false;
            expect(iD.geoVecEqual([1, 2], [2, 1])).to.be.false;
        });
        it('tests vectors for equality within epsilon', function() {
            expect(iD.geoVecEqual([1, 2], [1.0000001, 2.0000001], 1e-5)).to.be.true;
            expect(iD.geoVecEqual([1, 2], [1.0000001, 2.0000001], 1e-8)).to.be.false;
        });
    });

    describe('geoVecAdd', function() {
        it('adds vectors', function() {
            expect(iD.geoVecAdd([1, 2], [3, 4])).to.eql([4, 6]);
            expect(iD.geoVecAdd([1, 2], [0, 0])).to.eql([1, 2]);
            expect(iD.geoVecAdd([1, 2], [-3, -4])).to.eql([-2, -2]);
        });
    });

    describe('geoVecSubtract', function() {
        it('subtracts vectors', function() {
            expect(iD.geoVecSubtract([1, 2], [3, 4])).to.eql([-2, -2]);
            expect(iD.geoVecSubtract([1, 2], [0, 0])).to.eql([1, 2]);
            expect(iD.geoVecSubtract([1, 2], [-3, -4])).to.eql([4, 6]);
        });
    });

    describe('geoVecScale', function() {
        it('multiplies vectors', function() {
            expect(iD.geoVecScale([1, 2], 0)).to.eql([0, 0]);
            expect(iD.geoVecScale([1, 2], 1)).to.eql([1, 2]);
            expect(iD.geoVecScale([1, 2], 2)).to.eql([2, 4]);
            expect(iD.geoVecScale([1, 2], 0.5)).to.eql([0.5, 1]);
        });
    });

    describe('geoVecFloor (was: geoRoundCoordinates)', function() {
        it('rounds vectors', function() {
            expect(iD.geoVecFloor([0.1, 1])).to.eql([0, 1]);
            expect(iD.geoVecFloor([0, 1])).to.eql([0, 1]);
            expect(iD.geoVecFloor([0, 1.1])).to.eql([0, 1]);
        });
    });

    describe('geoVecInterp', function() {
        it('interpolates halfway', function() {
            var a = [0, 0];
            var b = [10, 10];
            expect(iD.geoVecInterp(a, b, 0.5)).to.eql([5, 5]);
        });
        it('interpolates to one side', function() {
            var a = [0, 0];
            var b = [10, 10];
            expect(iD.geoVecInterp(a, b, 0)).to.eql([0, 0]);
        });
    });

    describe('geoVecLength (was: geoEuclideanDistance)', function() {
        it('distance between two same points is zero', function() {
            var a = [0, 0];
            var b = [0, 0];
            expect(iD.geoVecLength(a, b)).to.eql(0);
        });
        it('a straight 10 unit line is 10', function() {
            var a = [0, 0];
            var b = [10, 0];
            expect(iD.geoVecLength(a, b)).to.eql(10);
        });
        it('a pythagorean triangle is right', function() {
            var a = [0, 0];
            var b = [4, 3];
            expect(iD.geoVecLength(a, b)).to.eql(5);
        });
    });

    describe('geoVecAngle', function() {
        it('returns angle between a and b', function() {
            expect(iD.geoVecAngle([0, 0], [1, 0])).to.be.closeTo(0, 1e-6);
            expect(iD.geoVecAngle([0, 0], [0, 1])).to.be.closeTo(Math.PI / 2, 1e-6);
            expect(iD.geoVecAngle([0, 0], [-1, 0])).to.be.closeTo(Math.PI, 1e-6);
            expect(iD.geoVecAngle([0, 0], [0, -1])).to.be.closeTo(-Math.PI / 2, 1e-6);
        });
    });

    describe('geoVecDot', function() {
        it('dot product of right angle is zero', function() {
            var a = [1, 0];
            var b = [0, 1];
            expect(iD.geoVecDot(a, b)).to.eql(0);
        });
        it('dot product of same vector multiplies', function() {
            var a = [2, 0];
            var b = [2, 0];
            expect(iD.geoVecDot(a, b)).to.eql(4);
        });
    });

    describe('geoVecCross', function() {
        it('2D cross product of right hand turn is positive', function() {
            var a = [2, 0];
            var b = [0, 2];
            expect(iD.geoVecCross(a, b)).to.eql(4);
        });
        it('2D cross product of left hand turn is negative', function() {
            var a = [2, 0];
            var b = [0, -2];
            expect(iD.geoVecCross(a, b)).to.eql(-4);
        });
        it('2D cross product of colinear points is zero', function() {
            var a = [-2, 0];
            var b = [2, 0];
            expect(iD.geoVecCross(a, b)).to.equal(0);
        });
    });

});
