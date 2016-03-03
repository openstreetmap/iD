describe('iD.geo', function() {
    describe('.roundCoords', function() {
        it('rounds coordinates', function() {
            expect(iD.geo.roundCoords([0.1, 1])).to.eql([0, 1]);
            expect(iD.geo.roundCoords([0, 1])).to.eql([0, 1]);
            expect(iD.geo.roundCoords([0, 1.1])).to.eql([0, 1]);
        });
    });

    describe('.interp', function() {
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

    describe('.cross', function() {
        it('cross product of right hand turn is positive', function() {
            var o = [0, 0],
                a = [2, 0],
                b = [0, 2];
            expect(iD.geo.cross(o, a, b)).to.eql(4);
        });
        it('cross product of left hand turn is negative', function() {
            var o = [0, 0],
                a = [2, 0],
                b = [0, -2];
            expect(iD.geo.cross(o, a, b)).to.eql(-4);
        });
        it('cross product of colinear points is zero', function() {
            var o = [0, 0],
                a = [-2, 0],
                b = [2, 0];
            expect(iD.geo.cross(o, a, b)).to.equal(0);
        });
    });

    describe('.euclideanDistance', function() {
        it('distance between two same points is zero', function() {
            var a = [0, 0],
                b = [0, 0];
            expect(iD.geo.euclideanDistance(a, b)).to.eql(0);
        });
        it('a straight 10 unit line is 10', function() {
            var a = [0, 0],
                b = [10, 0];
            expect(iD.geo.euclideanDistance(a, b)).to.eql(10);
        });
        it('a pythagorean triangle is right', function() {
            var a = [0, 0],
                b = [4, 3];
            expect(iD.geo.euclideanDistance(a, b)).to.eql(5);
        });
    });

    describe('.latToMeters', function() {
        it('0 degrees latitude is 0 meters', function() {
            expect(iD.geo.latToMeters(0)).to.eql(0);
        });
        it('1 degree latitude is approx 111 km', function() {
            expect(iD.geo.latToMeters(1)).to.be.within(110E3, 112E3);
        });
        it('-1 degree latitude is approx -111 km', function() {
            expect(iD.geo.latToMeters(-1)).to.be.within(-112E3, -110E3);
        });
    });

    describe('.lonToMeters', function() {
        it('0 degrees longitude is 0 km', function() {
            expect(iD.geo.lonToMeters(0, 0)).to.eql(0);
        });
        it('distance of 1 degree longitude varies with latitude', function() {
            expect(iD.geo.lonToMeters(1,  0)).to.be.within(110E3, 112E3);
            expect(iD.geo.lonToMeters(1, 15)).to.be.within(107E3, 108E3);
            expect(iD.geo.lonToMeters(1, 30)).to.be.within(96E3, 97E3);
            expect(iD.geo.lonToMeters(1, 45)).to.be.within(78E3, 79E3);
            expect(iD.geo.lonToMeters(1, 60)).to.be.within(55E3, 56E3);
            expect(iD.geo.lonToMeters(1, 75)).to.be.within(28E3, 29E3);
            expect(iD.geo.lonToMeters(1, 90)).to.eql(0);
        });
        it('distance of -1 degree longitude varies with latitude', function() {
            expect(iD.geo.lonToMeters(-1,   0)).to.be.within(-112E3, -110E3);
            expect(iD.geo.lonToMeters(-1, -15)).to.be.within(-108E3, -107E3);
            expect(iD.geo.lonToMeters(-1, -30)).to.be.within(-97E3, -96E3);
            expect(iD.geo.lonToMeters(-1, -45)).to.be.within(-79E3, -78E3);
            expect(iD.geo.lonToMeters(-1, -60)).to.be.within(-56E3, -55E3);
            expect(iD.geo.lonToMeters(-1, -75)).to.be.within(-29E3, -28E3);
            expect(iD.geo.lonToMeters(-1, -90)).to.eql(0);
        });
    });

    describe('.metersToLat', function() {
        it('0 meters is 0 degrees latitude', function() {
            expect(iD.geo.metersToLat(0)).to.eql(0);
        });
        it('111 km is approx 1 degree latitude', function() {
            expect(iD.geo.metersToLat(111E3)).to.be.within(0.995, 1.005);
        });
        it('-111 km is approx -1 degree latitude', function() {
            expect(iD.geo.metersToLat(-111E3)).to.be.within(-1.005, -0.995);
        });
    });

    describe('.metersToLon', function() {
        it('0 meters is 0 degrees longitude', function() {
            expect(iD.geo.metersToLon(0, 0)).to.eql(0);
        });
        it('distance of 1 degree longitude varies with latitude', function() {
            expect(iD.geo.metersToLon(111320,  0)).to.be.within(0.995, 1.005);
            expect(iD.geo.metersToLon(107551, 15)).to.be.within(0.995, 1.005);
            expect(iD.geo.metersToLon(96486,  30)).to.be.within(0.995, 1.005);
            expect(iD.geo.metersToLon(78847,  45)).to.be.within(0.995, 1.005);
            expect(iD.geo.metersToLon(55800,  60)).to.be.within(0.995, 1.005);
            expect(iD.geo.metersToLon(28902,  75)).to.be.within(0.995, 1.005);
            expect(iD.geo.metersToLon(1, 90)).to.eql(0);
        });
        it('distance of -1 degree longitude varies with latitude', function() {
            expect(iD.geo.metersToLon(-111320,  0)).to.be.within(-1.005, -0.995);
            expect(iD.geo.metersToLon(-107551, 15)).to.be.within(-1.005, -0.995);
            expect(iD.geo.metersToLon(-96486,  30)).to.be.within(-1.005, -0.995);
            expect(iD.geo.metersToLon(-78847,  45)).to.be.within(-1.005, -0.995);
            expect(iD.geo.metersToLon(-55800,  60)).to.be.within(-1.005, -0.995);
            expect(iD.geo.metersToLon(-28902,  75)).to.be.within(-1.005, -0.995);
            expect(iD.geo.metersToLon(-1, 90)).to.eql(0);
        });
    });

    describe('.sphericalDistance', function() {
        it('distance between two same points is zero', function() {
            var a = [0, 0],
                b = [0, 0];
            expect(iD.geo.sphericalDistance(a, b)).to.eql(0);
        });
        it('a straight 1 degree line at the equator is aproximately 111 km', function() {
            var a = [0, 0],
                b = [1, 0];
            expect(iD.geo.sphericalDistance(a, b)).to.be.within(110E3, 112E3);
        });
        it('a pythagorean triangle is (nearly) right', function() {
            var a = [0, 0],
                b = [4, 3];
            expect(iD.geo.sphericalDistance(a, b)).to.be.within(555E3, 556E3);
        });
        it('east-west distances at high latitude are shorter', function() {
            var a = [0, 60],
                b = [1, 60];
            expect(iD.geo.sphericalDistance(a, b)).to.be.within(55E3, 56E3);
        });
        it('north-south distances at high latitude are not shorter', function() {
            var a = [0, 60],
                b = [0, 61];
            expect(iD.geo.sphericalDistance(a, b)).to.be.within(110E3, 112E3);
        });
    });

    describe('.chooseEdge', function() {
        var projection = function (l) { return l; };
        projection.invert = projection;

        it('returns undefined properties for a degenerate way (no nodes)', function() {
            expect(iD.geo.chooseEdge([], [0, 0], projection)).to.eql({
                index: undefined,
                distance: Infinity,
                loc: undefined
            })
        });

        it('returns undefined properties for a degenerate way (single node)', function() {
            expect(iD.geo.chooseEdge([iD.Node({loc: [0, 0]})], [0, 0], projection)).to.eql({
                index: undefined,
                distance: Infinity,
                loc: undefined
            })
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

            var choice = iD.geo.chooseEdge(nodes, c, projection);
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

            var choice = iD.geo.chooseEdge(nodes, c, projection);
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

            var choice = iD.geo.chooseEdge(nodes, c, projection);
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(5);
            expect(choice.loc).to.eql([5, 0]);
        });
    });

    describe('.lineIntersection', function() {
        it('returns null if lines are colinear with overlap', function() {
            var a = [[0, 0], [10, 0]],
                b = [[-5, 0], [5, 0]];
            expect(iD.geo.lineIntersection(a, b)).to.be.null;
        });
        it('returns null if lines are colinear but disjoint', function() {
            var a = [[5, 0], [10, 0]],
                b = [[-10, 0], [-5, 0]];
            expect(iD.geo.lineIntersection(a, b)).to.be.null;
        });
        it('returns null if lines are parallel', function() {
            var a = [[0, 0], [10, 0]],
                b = [[0, 5], [10, 5]];
            expect(iD.geo.lineIntersection(a, b)).to.be.null;
        });
        it('returns the intersection point between 2 lines', function() {
            var a = [[0, 0], [10, 0]],
                b = [[5, 10], [5, -10]];
            expect(iD.geo.lineIntersection(a, b)).to.eql([5, 0]);
        });
        it('returns null if lines are not parallel but not intersecting', function() {
            var a = [[0, 0], [10, 0]],
                b = [[-5, 10], [-5, -10]];
            expect(iD.geo.lineIntersection(a, b)).to.be.null;
        });
    });

    describe('.pointInPolygon', function() {
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

    describe('.polygonContainsPolygon', function() {
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

    describe('.polygonIntersectsPolygon', function() {
        it('returns true when outer polygon fully contains inner', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]];
            expect(iD.geo.polygonIntersectsPolygon(outer, inner)).to.be.true;
        });

        it('returns true when outer polygon partially contains inner (some vertices contained)', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[-1, -1], [1, 2], [2, 2], [2, 1], [1, 1]];
            expect(iD.geo.polygonIntersectsPolygon(outer, inner)).to.be.true;
        });

        it('returns false when outer polygon partially contains inner (no vertices contained - lax test)', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[1, -1], [1, 4], [2, 4], [2, -1], [1, -1]];
            expect(iD.geo.polygonIntersectsPolygon(outer, inner)).to.be.false;
        });

        it('returns true when outer polygon partially contains inner (no vertices contained - strict test)', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[1, -1], [1, 4], [2, 4], [2, -1], [1, -1]];
            expect(iD.geo.polygonIntersectsPolygon(outer, inner, true)).to.be.true;
        });

        it('returns false when outer and inner are fully disjoint', function() {
            var outer = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var inner = [[-1, -1], [-1, -2], [-2, -2], [-2, -1], [-1, -1]];
            expect(iD.geo.polygonIntersectsPolygon(outer, inner)).to.be.false;
        });
    });

    describe('.pathLength', function() {
        it('calculates a simple path length', function() {
            var path = [[0, 0], [0, 1], [3, 5]];
            expect(iD.geo.pathLength(path)).to.eql(6);
        });

        it('does not fail on single-point path', function() {
            var path = [[0, 0]];
            expect(iD.geo.pathLength(path)).to.eql(0);
        });

        it('estimates zero-length edges', function() {
            var path = [[0, 0], [0, 0]];
            expect(iD.geo.pathLength(path)).to.eql(0);
        });
    });
});
