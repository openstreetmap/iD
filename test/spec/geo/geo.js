describe('iD.geo', function() {

    describe('geoLatToMeters', function() {
        it('0 degrees latitude is 0 meters', function() {
            expect(iD.geoLatToMeters(0)).to.eql(0);
        });
        it('1 degree latitude is approx 111 km', function() {
            expect(iD.geoLatToMeters(1)).to.be.closeTo(111319, 10);
        });
        it('-1 degree latitude is approx -111 km', function() {
            expect(iD.geoLatToMeters(-1)).to.be.closeTo(-111319, 10);
        });
    });

    describe('geoLonToMeters', function() {
        it('0 degrees longitude is 0 km', function() {
            expect(iD.geoLonToMeters(0, 0)).to.eql(0);
        });
        it('distance of 1 degree longitude varies with latitude', function() {
            expect(iD.geoLonToMeters(1,  0)).to.be.closeTo(110946, 10);
            expect(iD.geoLonToMeters(1, 15)).to.be.closeTo(107165, 10);
            expect(iD.geoLonToMeters(1, 30)).to.be.closeTo(96082, 10);
            expect(iD.geoLonToMeters(1, 45)).to.be.closeTo(78450, 10);
            expect(iD.geoLonToMeters(1, 60)).to.be.closeTo(55473, 10);
            expect(iD.geoLonToMeters(1, 75)).to.be.closeTo(28715, 10);
            expect(iD.geoLonToMeters(1, 90)).to.eql(0);
        });
        it('distance of -1 degree longitude varies with latitude', function() {
            expect(iD.geoLonToMeters(-1,  -0)).to.be.closeTo(-110946, 10);
            expect(iD.geoLonToMeters(-1, -15)).to.be.closeTo(-107165, 10);
            expect(iD.geoLonToMeters(-1, -30)).to.be.closeTo(-96082, 10);
            expect(iD.geoLonToMeters(-1, -45)).to.be.closeTo(-78450, 10);
            expect(iD.geoLonToMeters(-1, -60)).to.be.closeTo(-55473, 10);
            expect(iD.geoLonToMeters(-1, -75)).to.be.closeTo(-28715, 10);
            expect(iD.geoLonToMeters(-1, -90)).to.eql(0);
        });
    });

    describe('geoMetersToLat', function() {
        it('0 meters is 0 degrees latitude', function() {
            expect(iD.geoMetersToLat(0)).to.eql(0);
        });
        it('111 km is approx 1 degree latitude', function() {
            expect(iD.geoMetersToLat(111319)).to.be.closeTo(1, 0.0001);
        });
        it('-111 km is approx -1 degree latitude', function() {
            expect(iD.geoMetersToLat(-111319)).to.be.closeTo(-1, 0.0001);
        });
    });

    describe('geoMetersToLon', function() {
        it('0 meters is 0 degrees longitude', function() {
            expect(iD.geoMetersToLon(0, 0)).to.eql(0);
        });
        it('distance of 1 degree longitude varies with latitude', function() {
            expect(iD.geoMetersToLon(110946,  0)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(107165, 15)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(96082,  30)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(78450,  45)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(55473,  60)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(28715,  75)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(1, 90)).to.eql(0);
        });
        it('distance of -1 degree longitude varies with latitude', function() {
            expect(iD.geoMetersToLon(-110946,  -0)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-107165, -15)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-96082,  -30)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-78450,  -45)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-55473,  -60)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-28715,  -75)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-1, -90)).to.eql(0);
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
            var a = [0, 0];
            var b = [0, 0];
            expect(iD.geoSphericalDistance(a, b)).to.eql(0);
        });
        it('a straight 1 degree line at the equator is aproximately 111 km', function() {
            var a = [0, 0];
            var b = [1, 0];
            expect(iD.geoSphericalDistance(a, b)).to.be.closeTo(110946, 10);
        });
        it('a pythagorean triangle is (nearly) right', function() {
            var a = [0, 0];
            var b = [4, 3];
            expect(iD.geoSphericalDistance(a, b)).to.be.closeTo(555282, 10);
        });
        it('east-west distances at high latitude are shorter', function() {
            var a = [0, 60];
            var b = [1, 60];
            expect(iD.geoSphericalDistance(a, b)).to.be.closeTo(55473, 10);
        });
        it('north-south distances at high latitude are not shorter', function() {
            var a = [0, 60];
            var b = [0, 61];
            expect(iD.geoSphericalDistance(a, b)).to.be.closeTo(111319, 10);
        });
    });

    describe('geoZoomToScale', function() {
        it('converts from zoom to projection scale (tileSize = 256)', function() {
            expect(iD.geoZoomToScale(17)).to.be.closeTo(5340353.715440872, 1e-6);
        });
        it('converts from zoom to projection scale (tileSize = 512)', function() {
            expect(iD.geoZoomToScale(17, 512)).to.be.closeTo(10680707.430881744, 1e-6);
        });
    });

    describe('geoScaleToZoom', function() {
        it('converts from projection scale to zoom (tileSize = 256)', function() {
            expect(iD.geoScaleToZoom(5340353.715440872)).to.be.closeTo(17, 1e-6);
        });
        it('converts from projection scale to zoom (tileSize = 512)', function() {
            expect(iD.geoScaleToZoom(10680707.430881744, 512)).to.be.closeTo(17, 1e-6);
        });
    });

    describe('geoEdgeEqual', function() {
        it('returns false for inequal edges', function() {
            expect(iD.geoEdgeEqual(['a', 'b'], ['a', 'c'])).to.be.false;
        });

        it('returns true for equal edges along same direction', function() {
            expect(iD.geoEdgeEqual(['a', 'b'], ['a', 'b'])).to.be.true;
        });

        it('returns true for equal edges along opposite direction', function() {
            expect(iD.geoEdgeEqual(['a', 'b'], ['b', 'a'])).to.be.true;
        });
    });

    describe('geoAngle', function() {
        it('returns angle between a and b', function() {
            var projection = function (_) { return _; };
            expect(iD.geoAngle({loc:[0, 0]}, {loc:[1, 0]}, projection)).to.be.closeTo(0, 1e-6);
            expect(iD.geoAngle({loc:[0, 0]}, {loc:[0, 1]}, projection)).to.be.closeTo(Math.PI / 2, 1e-6);
            expect(iD.geoAngle({loc:[0, 0]}, {loc:[-1, 0]}, projection)).to.be.closeTo(Math.PI, 1e-6);
            expect(iD.geoAngle({loc:[0, 0]}, {loc:[0, -1]}, projection)).to.be.closeTo(-Math.PI / 2, 1e-6);
        });
    });

    describe('geoRotate', function() {
        it('rotates points around [0, 0]', function() {
            var points = [[5, 0], [5, 1]];
            var angle = Math.PI;
            var around = [0, 0];
            var result = iD.geoRotate(points, angle, around);
            expect(result[0][0]).to.be.closeTo(-5, 1e-6);
            expect(result[0][1]).to.be.closeTo(0, 1e-6);
            expect(result[1][0]).to.be.closeTo(-5, 1e-6);
            expect(result[1][1]).to.be.closeTo(-1, 1e-6);
        });

        it('rotates points around [3, 0]', function() {
            var points = [[5, 0], [5, 1]];
            var angle = Math.PI;
            var around = [3, 0];
            var result = iD.geoRotate(points, angle, around);
            expect(result[0][0]).to.be.closeTo(1, 1e-6);
            expect(result[0][1]).to.be.closeTo(0, 1e-6);
            expect(result[1][0]).to.be.closeTo(1, 1e-6);
            expect(result[1][1]).to.be.closeTo(-1, 1e-6);
        });
    });

    describe('geoChooseEdge', function() {
        var projection = function (l) { return l; };
        projection.invert = projection;

        it('returns null for a degenerate way (no nodes)', function() {
            expect(iD.geoChooseEdge([], [0, 0], projection)).to.be.null;
        });

        it('returns null for a degenerate way (single node)', function() {
            expect(iD.geoChooseEdge([iD.osmNode({loc: [0, 0]})], [0, 0], projection)).to.be.null;
        });

        it('calculates the orthogonal projection of a point onto a segment', function() {
            // a --*--- b
            //     |
            //     c
            //
            // * = [2, 0]
            var a = [0, 0];
            var b = [5, 0];
            var c = [2, 1];
            var nodes = [ iD.osmNode({loc: a}), iD.osmNode({loc: b}) ];
            var choice = iD.geoChooseEdge(nodes, c, projection);
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(1);
            expect(choice.loc).to.eql([2, 0]);
        });

        it('returns the starting vertex when the orthogonal projection is < 0', function() {
            var a = [0, 0];
            var b = [5, 0];
            var c = [-3, 4];
            var nodes = [ iD.osmNode({loc: a}), iD.osmNode({loc: b}) ];
            var choice = iD.geoChooseEdge(nodes, c, projection);
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(5);
            expect(choice.loc).to.eql([0, 0]);
        });

        it('returns the ending vertex when the orthogonal projection is > 1', function() {
            var a = [0, 0];
            var b = [5, 0];
            var c = [8, 4];
            var nodes = [ iD.osmNode({loc: a}), iD.osmNode({loc: b}) ];
            var choice = iD.geoChooseEdge(nodes, c, projection);
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(5);
            expect(choice.loc).to.eql([5, 0]);
        });

        it('skips the given nodeID at end of way', function() {
            //
            // a --*-- b
            //     e   |
            //     |   |
            //     d - c
            //
            // * = [2, 0]
            var a = [0, 0];
            var b = [5, 0];
            var c = [5, 5];
            var d = [2, 5];
            var e = [2, 0.1];  // e.g. user is dragging e onto ab
            var nodes = [
                iD.osmNode({id: 'a', loc: a}),
                iD.osmNode({id: 'b', loc: b}),
                iD.osmNode({id: 'c', loc: c}),
                iD.osmNode({id: 'd', loc: d}),
                iD.osmNode({id: 'e', loc: e})
            ];
            var choice = iD.geoChooseEdge(nodes, e, projection, 'e');
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(0.1);
            expect(choice.loc).to.eql([2, 0]);
        });

        it('skips the given nodeID in middle of way', function() {
            //
            // a --*-- b
            //     d   |
            //   /   \ |
            // e       c
            //
            // * = [2, 0]
            var a = [0, 0];
            var b = [5, 0];
            var c = [5, 5];
            var d = [2, 0.1];  // e.g. user is dragging d onto ab
            var e = [0, 5];
            var nodes = [
                iD.osmNode({id: 'a', loc: a}),
                iD.osmNode({id: 'b', loc: b}),
                iD.osmNode({id: 'c', loc: c}),
                iD.osmNode({id: 'd', loc: d}),
                iD.osmNode({id: 'e', loc: e})
            ];
            var choice = iD.geoChooseEdge(nodes, d, projection, 'd');
            expect(choice.index).to.eql(1);
            expect(choice.distance).to.eql(0.1);
            expect(choice.loc).to.eql([2, 0]);
        });

        it('returns null if all nodes are skipped', function() {
            var nodes = [
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [5, 0]}),
            ];
            var choice = iD.geoChooseEdge(nodes, [2, 2], projection, 'a');
            expect(choice).to.be.null;
        });
    });

    describe('geoLineIntersection', function() {
        it('returns null if lines are colinear with overlap', function() {
            var a = [[0, 0], [10, 0]];
            var b = [[-5, 0], [5, 0]];
            expect(iD.geoLineIntersection(a, b)).to.be.null;
        });
        it('returns null if lines are colinear but disjoint', function() {
            var a = [[5, 0], [10, 0]];
            var b = [[-10, 0], [-5, 0]];
            expect(iD.geoLineIntersection(a, b)).to.be.null;
        });
        it('returns null if lines are parallel', function() {
            var a = [[0, 0], [10, 0]];
            var b = [[0, 5], [10, 5]];
            expect(iD.geoLineIntersection(a, b)).to.be.null;
        });
        it('returns the intersection point between 2 lines', function() {
            var a = [[0, 0], [10, 0]];
            var b = [[5, 10], [5, -10]];
            expect(iD.geoLineIntersection(a, b)).to.eql([5, 0]);
        });
        it('returns null if lines are not parallel but not intersecting', function() {
            var a = [[0, 0], [10, 0]];
            var b = [[-5, 10], [-5, -10]];
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
            var poly = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]];
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

    describe('geoViewportEdge', function() {
        var dimensions = [1000, 1000];
        it('returns null if the point is not at the edge', function() {
            expect(iD.geoViewportEdge([500, 500], dimensions)).to.be.null;
        });
        it('nudges top edge', function() {
            expect(iD.geoViewportEdge([500, 5], dimensions)).to.eql([0, 10]);
        });
        it('nudges top-right corner', function() {
            expect(iD.geoViewportEdge([995, 5], dimensions)).to.eql([-10, 10]);
        });
        it('nudges right edge', function() {
            expect(iD.geoViewportEdge([995, 500], dimensions)).to.eql([-10, 0]);
        });
        it('nudges bottom-right corner', function() {
            expect(iD.geoViewportEdge([995, 995], dimensions)).to.eql([-10, -10]);
        });
        it('nudges bottom edge', function() {
            expect(iD.geoViewportEdge([500, 995], dimensions)).to.eql([0, -10]);
        });
        it('nudges bottom-left corner', function() {
            expect(iD.geoViewportEdge([5, 995], dimensions)).to.eql([10, -10]);
        });
        it('nudges left edge', function() {
            expect(iD.geoViewportEdge([5, 500], dimensions)).to.eql([10, 0]);
        });
        it('nudges top-left corner', function() {
            expect(iD.geoViewportEdge([5, 5], dimensions)).to.eql([10, 10]);
        });
    });

});
