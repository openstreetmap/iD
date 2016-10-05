describe('iD.geo', function() {
    describe('geoRoundCoords', function() {
        it('rounds coordinates', function() {
            expect(iD.geoRoundCoords([0.1, 1])).to.eql([0, 1]);
            expect(iD.geoRoundCoords([0, 1])).to.eql([0, 1]);
            expect(iD.geoRoundCoords([0, 1.1])).to.eql([0, 1]);
        });
    });

    describe('geoInterp', function() {
        it('interpolates halfway', function() {
            var a = [0, 0],
                b = [10, 10];
            expect(iD.geoInterp(a, b, 0.5)).to.eql([5, 5]);
        });
        it('interpolates to one side', function() {
            var a = [0, 0],
                b = [10, 10];
            expect(iD.geoInterp(a, b, 0)).to.eql([0, 0]);
        });
    });

    describe('geoCross', function() {
        it('cross product of right hand turn is positive', function() {
            var o = [0, 0],
                a = [2, 0],
                b = [0, 2];
            expect(iD.geoCross(o, a, b)).to.eql(4);
        });
        it('cross product of left hand turn is negative', function() {
            var o = [0, 0],
                a = [2, 0],
                b = [0, -2];
            expect(iD.geoCross(o, a, b)).to.eql(-4);
        });
        it('cross product of colinear points is zero', function() {
            var o = [0, 0],
                a = [-2, 0],
                b = [2, 0];
            expect(iD.geoCross(o, a, b)).to.equal(0);
        });
    });

    describe('geoEuclideanDistance', function() {
        it('distance between two same points is zero', function() {
            var a = [0, 0],
                b = [0, 0];
            expect(iD.geoEuclideanDistance(a, b)).to.eql(0);
        });
        it('a straight 10 unit line is 10', function() {
            var a = [0, 0],
                b = [10, 0];
            expect(iD.geoEuclideanDistance(a, b)).to.eql(10);
        });
        it('a pythagorean triangle is right', function() {
            var a = [0, 0],
                b = [4, 3];
            expect(iD.geoEuclideanDistance(a, b)).to.eql(5);
        });
    });

    describe('geoLatToMeters', function() {
        it('0 degrees latitude is 0 meters', function() {
            expect(iD.geoLatToMeters(0)).to.eql(0);
        });
        it('1 degree latitude is approx 111 km', function() {
            expect(iD.geoLatToMeters(1)).to.be.within(110E3, 112E3);
        });
        it('-1 degree latitude is approx -111 km', function() {
            expect(iD.geoLatToMeters(-1)).to.be.within(-112E3, -110E3);
        });
    });

    describe('geoLonToMeters', function() {
        it('0 degrees longitude is 0 km', function() {
            expect(iD.geoLonToMeters(0, 0)).to.eql(0);
        });
        it('distance of 1 degree longitude varies with latitude', function() {
            expect(iD.geoLonToMeters(1,  0)).to.be.within(110E3, 112E3);
            expect(iD.geoLonToMeters(1, 15)).to.be.within(107E3, 108E3);
            expect(iD.geoLonToMeters(1, 30)).to.be.within(96E3, 97E3);
            expect(iD.geoLonToMeters(1, 45)).to.be.within(78E3, 79E3);
            expect(iD.geoLonToMeters(1, 60)).to.be.within(55E3, 56E3);
            expect(iD.geoLonToMeters(1, 75)).to.be.within(28E3, 29E3);
            expect(iD.geoLonToMeters(1, 90)).to.eql(0);
        });
        it('distance of -1 degree longitude varies with latitude', function() {
            expect(iD.geoLonToMeters(-1,   0)).to.be.within(-112E3, -110E3);
            expect(iD.geoLonToMeters(-1, -15)).to.be.within(-108E3, -107E3);
            expect(iD.geoLonToMeters(-1, -30)).to.be.within(-97E3, -96E3);
            expect(iD.geoLonToMeters(-1, -45)).to.be.within(-79E3, -78E3);
            expect(iD.geoLonToMeters(-1, -60)).to.be.within(-56E3, -55E3);
            expect(iD.geoLonToMeters(-1, -75)).to.be.within(-29E3, -28E3);
            expect(iD.geoLonToMeters(-1, -90)).to.eql(0);
        });
    });

    describe('geoMetersToLat', function() {
        it('0 meters is 0 degrees latitude', function() {
            expect(iD.geoMetersToLat(0)).to.eql(0);
        });
        it('111 km is approx 1 degree latitude', function() {
            expect(iD.geoMetersToLat(111E3)).to.be.within(0.995, 1.005);
        });
        it('-111 km is approx -1 degree latitude', function() {
            expect(iD.geoMetersToLat(-111E3)).to.be.within(-1.005, -0.995);
        });
    });

    describe('geoMetersToLon', function() {
        it('0 meters is 0 degrees longitude', function() {
            expect(iD.geoMetersToLon(0, 0)).to.eql(0);
        });
        it('distance of 1 degree longitude varies with latitude', function() {
            expect(iD.geoMetersToLon(111320,  0)).to.be.within(0.995, 1.005);
            expect(iD.geoMetersToLon(107551, 15)).to.be.within(0.995, 1.005);
            expect(iD.geoMetersToLon(96486,  30)).to.be.within(0.995, 1.005);
            expect(iD.geoMetersToLon(78847,  45)).to.be.within(0.995, 1.005);
            expect(iD.geoMetersToLon(55800,  60)).to.be.within(0.995, 1.005);
            expect(iD.geoMetersToLon(28902,  75)).to.be.within(0.995, 1.005);
            expect(iD.geoMetersToLon(1, 90)).to.eql(0);
        });
        it('distance of -1 degree longitude varies with latitude', function() {
            expect(iD.geoMetersToLon(-111320,  0)).to.be.within(-1.005, -0.995);
            expect(iD.geoMetersToLon(-107551, 15)).to.be.within(-1.005, -0.995);
            expect(iD.geoMetersToLon(-96486,  30)).to.be.within(-1.005, -0.995);
            expect(iD.geoMetersToLon(-78847,  45)).to.be.within(-1.005, -0.995);
            expect(iD.geoMetersToLon(-55800,  60)).to.be.within(-1.005, -0.995);
            expect(iD.geoMetersToLon(-28902,  75)).to.be.within(-1.005, -0.995);
            expect(iD.geoMetersToLon(-1, 90)).to.eql(0);
        });
    });

    describe('geoOffsetToMeters', function() {
        it('[0, 0] pixel offset is [0, -0] meter offset', function() {
            var meters = iD.geoOffsetToMeters([0, 0]);
            expect(meters[0]).to.eql(0);
            expect(meters[1]).to.eql(-0);
        });
        it('[0.00064, -0.00064] pixel offset is roughly [100, 100] meter offset', function() {
            var meters = iD.geoOffsetToMeters([0.00064, -0.00064]);
            expect(meters[0]).to.be.within(99.5, 100.5);
            expect(meters[1]).to.be.within(99.5, 100.5);
        });
    });

    describe('geoMetersToOffset', function() {
        it('[0, 0] meter offset is [0, -0] pixel offset', function() {
            var offset = iD.geoMetersToOffset([0, 0]);
            expect(offset[0]).to.eql(0);
            expect(offset[1]).to.eql(-0);
        });
        it('[100, 100] meter offset is roughly [0.00064, -0.00064] pixel offset', function() {
            var offset = iD.geoMetersToOffset([100, 100]);
            expect(offset[0]).to.be.within(0.000635, 0.000645);
            expect(offset[1]).to.be.within(-0.000645, -0.000635);
        });
    });

    describe('geoSphericalDistance', function() {
        it('distance between two same points is zero', function() {
            var a = [0, 0],
                b = [0, 0];
            expect(iD.geoSphericalDistance(a, b)).to.eql(0);
        });
        it('a straight 1 degree line at the equator is aproximately 111 km', function() {
            var a = [0, 0],
                b = [1, 0];
            expect(iD.geoSphericalDistance(a, b)).to.be.within(110E3, 112E3);
        });
        it('a pythagorean triangle is (nearly) right', function() {
            var a = [0, 0],
                b = [4, 3];
            expect(iD.geoSphericalDistance(a, b)).to.be.within(555E3, 556E3);
        });
        it('east-west distances at high latitude are shorter', function() {
            var a = [0, 60],
                b = [1, 60];
            expect(iD.geoSphericalDistance(a, b)).to.be.within(55E3, 56E3);
        });
        it('north-south distances at high latitude are not shorter', function() {
            var a = [0, 60],
                b = [0, 61];
            expect(iD.geoSphericalDistance(a, b)).to.be.within(110E3, 112E3);
        });
    });

    describe('geoChooseEdge', function() {
        var projection = function (l) { return l; };
        projection.invert = projection;

        it('returns undefined properties for a degenerate way (no nodes)', function() {
            expect(iD.geoChooseEdge([], [0, 0], projection)).to.eql({
                index: undefined,
                distance: Infinity,
                loc: undefined
            });
        });

        it('returns undefined properties for a degenerate way (single node)', function() {
            expect(iD.geoChooseEdge([iD.Node({loc: [0, 0]})], [0, 0], projection)).to.eql({
                index: undefined,
                distance: Infinity,
                loc: undefined
            });
        });

        it('calculates the orthogonal projection of a point onto a segment', function() {
            // a --*--- b
            //     |
            //     c
            //
            // * = [2, 0]
            var a = [0, 0],
                b = [5, 0],
                c = [2, 1],
                nodes = [
                    iD.Node({loc: a}),
                    iD.Node({loc: b})
                ];

            var choice = iD.geoChooseEdge(nodes, c, projection);
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(1);
            expect(choice.loc).to.eql([2, 0]);
        });

        it('returns the starting vertex when the orthogonal projection is < 0', function() {
            var a = [0, 0],
                b = [5, 0],
                c = [-3, 4],
                nodes = [
                    iD.Node({loc: a}),
                    iD.Node({loc: b})
                ];

            var choice = iD.geoChooseEdge(nodes, c, projection);
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(5);
            expect(choice.loc).to.eql([0, 0]);
        });

        it('returns the ending vertex when the orthogonal projection is > 1', function() {
            var a = [0, 0],
                b = [5, 0],
                c = [8, 4],
                nodes = [
                    iD.Node({loc: a}),
                    iD.Node({loc: b})
                ];

            var choice = iD.geoChooseEdge(nodes, c, projection);
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(5);
            expect(choice.loc).to.eql([5, 0]);
        });
    });

    describe('geoLineIntersection', function() {
        it('returns null if lines are colinear with overlap', function() {
            var a = [[0, 0], [10, 0]],
                b = [[-5, 0], [5, 0]];
            expect(iD.geoLineIntersection(a, b)).to.be.null;
        });
        it('returns null if lines are colinear but disjoint', function() {
            var a = [[5, 0], [10, 0]],
                b = [[-10, 0], [-5, 0]];
            expect(iD.geoLineIntersection(a, b)).to.be.null;
        });
        it('returns null if lines are parallel', function() {
            var a = [[0, 0], [10, 0]],
                b = [[0, 5], [10, 5]];
            expect(iD.geoLineIntersection(a, b)).to.be.null;
        });
        it('returns the intersection point between 2 lines', function() {
            var a = [[0, 0], [10, 0]],
                b = [[5, 10], [5, -10]];
            expect(iD.geoLineIntersection(a, b)).to.eql([5, 0]);
        });
        it('returns null if lines are not parallel but not intersecting', function() {
            var a = [[0, 0], [10, 0]],
                b = [[-5, 10], [-5, -10]];
            expect(iD.geoLineIntersection(a, b)).to.be.null;
        });
    });

    describe('geoPointInPolygon', function() {
        it('says a point in a polygon is on a polygon', function() {
            var poly = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]];
            var point = [0.5, 0.5];
            expect(iD.geoPointInPolygon(point, poly)).to.be.true;
        });
        it('says a point outside of a polygon is outside', function() {
            var poly = [
                [0, 0],
                [0, 1],
                [1, 1],
                [1, 0],
                [0, 0]];
            var point = [0.5, 1.5];
            expect(iD.geoPointInPolygon(point, poly)).to.be.false;
        });
    });

    describe('geoPolygonContainsPolygon', function() {
        it('says a polygon in a polygon is in', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]];
            expect(iD.geoPolygonContainsPolygon(outer, inner)).to.be.true;
        });
        it('says a polygon outside of a polygon is out', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[1, 1], [1, 9], [2, 2], [2, 1], [1, 1]];
            expect(iD.geoPolygonContainsPolygon(outer, inner)).to.be.false;
        });
    });

    describe('geoPolygonIntersectsPolygon', function() {
        it('returns true when outer polygon fully contains inner', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]];
            expect(iD.geoPolygonIntersectsPolygon(outer, inner)).to.be.true;
        });

        it('returns true when outer polygon partially contains inner (some vertices contained)', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[-1, -1], [1, 2], [2, 2], [2, 1], [1, 1]];
            expect(iD.geoPolygonIntersectsPolygon(outer, inner)).to.be.true;
        });

        it('returns false when outer polygon partially contains inner (no vertices contained - lax test)', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[1, -1], [1, 4], [2, 4], [2, -1], [1, -1]];
            expect(iD.geoPolygonIntersectsPolygon(outer, inner)).to.be.false;
        });

        it('returns true when outer polygon partially contains inner (no vertices contained - strict test)', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[1, -1], [1, 4], [2, 4], [2, -1], [1, -1]];
            expect(iD.geoPolygonIntersectsPolygon(outer, inner, true)).to.be.true;
        });

        it('returns false when outer and inner are fully disjoint', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[-1, -1], [-1, -2], [-2, -2], [-2, -1], [-1, -1]];
            expect(iD.geoPolygonIntersectsPolygon(outer, inner)).to.be.false;
        });
    });

    describe('geoPathLength', function() {
        it('calculates a simple path length', function() {
            var path = [[0, 0], [0, 1], [3, 5]];
            expect(iD.geoPathLength(path)).to.eql(6);
        });

        it('does not fail on single-point path', function() {
            var path = [[0, 0]];
            expect(iD.geoPathLength(path)).to.eql(0);
        });

        it('estimates zero-length edges', function() {
            var path = [[0, 0], [0, 0]];
            expect(iD.geoPathLength(path)).to.eql(0);
        });
    });
});
