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

    describe('geoVecNormalize', function() {
        it('gets unit vectors', function() {
            expect(iD.geoVecNormalize([0, 0])).to.eql([0, 0]);
            expect(iD.geoVecNormalize([1, 0])).to.eql([1, 0]);
            expect(iD.geoVecNormalize([5, 0])).to.eql([1, 0]);
            expect(iD.geoVecNormalize([-5, 0])).to.eql([-1, 0]);
            expect(iD.geoVecNormalize([1, 1])[0]).to.be.closeTo(Math.sqrt(2)/2, 1e-6);
            expect(iD.geoVecNormalize([1, 1])[1]).to.be.closeTo(Math.sqrt(2)/2, 1e-6);
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

    describe('geoVecNormalizedDot', function() {
        it('normalized dot product of right angle is zero', function() {
            var a = [2, 0];
            var b = [0, 2];
            expect(iD.geoVecNormalizedDot(a, b)).to.eql(0);
        });
        it('normalized dot product of same vector multiplies unit vectors', function() {
            var a = [2, 0];
            var b = [2, 0];
            expect(iD.geoVecNormalizedDot(a, b)).to.eql(1);
        });
        it('normalized dot product of 45 degrees', function() {
            var a = [0, 2];
            var b = [2, 2];
            expect(iD.geoVecNormalizedDot(a, b)).to.be.closeTo(Math.sqrt(2)/2, 1e-6);
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


    describe('geoVecProject', function() {
        it('returns null for a degenerate path (no nodes)', function() {
            expect(iD.geoVecProject([0, 1], [])).to.be.null;
        });

        it('returns null for a degenerate path (single node)', function() {
            expect(iD.geoVecProject([0, 1], [0, 0])).to.be.null;
        });

        it('calculates the orthogonal projection of a point onto a path', function() {
            //     c
            //     |
            // a --*--- b
            //
            // * = [2, 0]
            var a = [0, 0];
            var b = [5, 0];
            var c = [2, 1];
            var choice = iD.geoVecProject(c, [a, b]);
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(1);
            expect(choice.target).to.eql([2, 0]);
        });

        it('returns the starting vertex when the orthogonal projection is < 0', function() {
            var a = [0, 0];
            var b = [5, 0];
            var c = [-3, 4];
            var choice = iD.geoVecProject(c, [a, b]);
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(5);
            expect(choice.target).to.eql([0, 0]);
        });

        it('returns the ending vertex when the orthogonal projection is > 1', function() {
            var a = [0, 0];
            var b = [5, 0];
            var c = [8, 4];
            var choice = iD.geoVecProject(c, [a, b]);
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(5);
            expect(choice.target).to.eql([5, 0]);
        });
    });
});
