describe('iD.geo - geometry', function() {

    describe('geoAngle', function() {
        it('returns angle between a and b', function() {
            var projection = function (_) { return _; };
            expect(iD.geoAngle({loc:[0, 0]}, {loc:[1, 0]}, projection)).to.be.closeTo(0, 1e-6);
            expect(iD.geoAngle({loc:[0, 0]}, {loc:[0, 1]}, projection)).to.be.closeTo(Math.PI / 2, 1e-6);
            expect(iD.geoAngle({loc:[0, 0]}, {loc:[-1, 0]}, projection)).to.be.closeTo(Math.PI, 1e-6);
            expect(iD.geoAngle({loc:[0, 0]}, {loc:[0, -1]}, projection)).to.be.closeTo(-Math.PI / 2, 1e-6);
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

    describe('geoHasLineIntersections', function() {
        it('returns false for a degenerate way (no nodes)', function() {
            expect(iD.geoHasLineIntersections([], '')).to.be.false;
        });

        it('returns false if no activeID', function() {
            var a = iD.osmNode({id: 'a', loc: [2, 2]});
            var b = iD.osmNode({id: 'b', loc: [4, 2]});
            var c = iD.osmNode({id: 'c', loc: [4, 4]});
            var d = iD.osmNode({id: 'd', loc: [2, 4]});
            var nodes = [a, b, c, d, a];
            expect(iD.geoHasLineIntersections(nodes, '')).to.be.false;
        });

        it('returns false if there are no intersections', function() {
            //  e --------- f
            //  |           |
            //  |  a --- b  |
            //  |  |     |  |
            //  |  |     |  |
            //  |  d --- c  |
            //  |           |
            //  h --------- g
            var a = iD.osmNode({id: 'a', loc: [2, 2]});
            var b = iD.osmNode({id: 'b', loc: [4, 2]});
            var c = iD.osmNode({id: 'c', loc: [4, 4]});
            var d = iD.osmNode({id: 'd', loc: [2, 4]});
            var e = iD.osmNode({id: 'e', loc: [0, 0]});
            var f = iD.osmNode({id: 'f', loc: [8, 0]});
            var g = iD.osmNode({id: 'g', loc: [8, 8]});
            var h = iD.osmNode({id: 'h', loc: [0, 8]});
            var inner = [a, b, c, d, a];
            var outer = [e, f, g, h, e];
            expect(iD.geoHasLineIntersections(inner, outer, 'a')).to.be.false;
            expect(iD.geoHasLineIntersections(inner, outer, 'b')).to.be.false;
            expect(iD.geoHasLineIntersections(inner, outer, 'c')).to.be.false;
            expect(iD.geoHasLineIntersections(inner, outer, 'd')).to.be.false;
            expect(iD.geoHasLineIntersections(outer, inner, 'e')).to.be.false;
            expect(iD.geoHasLineIntersections(outer, inner, 'f')).to.be.false;
            expect(iD.geoHasLineIntersections(outer, inner, 'g')).to.be.false;
            expect(iD.geoHasLineIntersections(outer, inner, 'h')).to.be.false;
        });

        it('returns true if the activeID is causing intersections', function() {
            //  e --------- f
            //  |           |
            //  |  a --------- b
            //  |  |        |/
            //  |  |       /|
            //  |  d --- c  |
            //  |           |
            //  h --------- g
            var a = iD.osmNode({id: 'a', loc: [2, 2]});
            var b = iD.osmNode({id: 'b', loc: [10, 2]});
            var c = iD.osmNode({id: 'c', loc: [4, 4]});
            var d = iD.osmNode({id: 'd', loc: [2, 4]});
            var e = iD.osmNode({id: 'e', loc: [0, 0]});
            var f = iD.osmNode({id: 'f', loc: [8, 0]});
            var g = iD.osmNode({id: 'g', loc: [8, 8]});
            var h = iD.osmNode({id: 'h', loc: [0, 8]});
            var inner = [a, b, c, d, a];
            var outer = [e, f, g, h, e];
            expect(iD.geoHasLineIntersections(inner, outer, 'a')).to.be.true;
            expect(iD.geoHasLineIntersections(inner, outer, 'b')).to.be.true;
            expect(iD.geoHasLineIntersections(inner, outer, 'c')).to.be.true;
            expect(iD.geoHasLineIntersections(inner, outer, 'd')).to.be.false;
            expect(iD.geoHasLineIntersections(outer, inner, 'e')).to.be.false;
            expect(iD.geoHasLineIntersections(outer, inner, 'f')).to.be.true;
            expect(iD.geoHasLineIntersections(outer, inner, 'g')).to.be.true;
            expect(iD.geoHasLineIntersections(outer, inner, 'h')).to.be.false;
        });
    });

    describe('geoHasSelfIntersections', function() {
        it('returns false for a degenerate way (no nodes)', function() {
            expect(iD.geoHasSelfIntersections([], '')).to.be.false;
        });

        it('returns false if no activeID', function() {
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [2, 0]});
            var c = iD.osmNode({id: 'c', loc: [2, 2]});
            var d = iD.osmNode({id: 'd', loc: [0, 2]});
            var nodes = [a, b, c, d, a];
            expect(iD.geoHasSelfIntersections(nodes, '')).to.be.false;
        });

        it('returns false if there are no self intersections (closed way)', function() {
            //  a --- b
            //  |     |
            //  |     |
            //  d --- c
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [2, 0]});
            var c = iD.osmNode({id: 'c', loc: [2, 2]});
            var d = iD.osmNode({id: 'd', loc: [0, 2]});
            var nodes = [a, b, c, d, a];
            expect(iD.geoHasSelfIntersections(nodes, 'a')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'b')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'c')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'd')).to.be.false;
        });

        it('returns true if there are self intersections without a junction (closed way)', function() {
            //  a     c
            //  | \ / |
            //  |  /  |
            //  | / \ |
            //  d     b
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [2, 2]});
            var c = iD.osmNode({id: 'c', loc: [2, 0]});
            var d = iD.osmNode({id: 'd', loc: [0, 2]});
            var nodes = [a, b, c, d, a];
            expect(iD.geoHasSelfIntersections(nodes, 'a')).to.be.true;
            expect(iD.geoHasSelfIntersections(nodes, 'b')).to.be.true;
            expect(iD.geoHasSelfIntersections(nodes, 'c')).to.be.true;
            expect(iD.geoHasSelfIntersections(nodes, 'd')).to.be.true;
        });

        it('returns false if there are self intersections with a junction (closed way)', function() {
            //  a     c
            //  | \ / |
            //  |  x  |
            //  | / \ |
            //  d     b
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [2, 2]});
            var c = iD.osmNode({id: 'c', loc: [2, 0]});
            var d = iD.osmNode({id: 'd', loc: [0, 2]});
            var x = iD.osmNode({id: 'x', loc: [1, 1]});
            var nodes = [a, x, b, c, x, d, a];
            expect(iD.geoHasSelfIntersections(nodes, 'a')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'b')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'c')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'd')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'x')).to.be.false;
        });

        it('returns false if there are no self intersections (open way)', function() {
            //  a --- b
            //        |
            //        |
            //  d --- c
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [2, 0]});
            var c = iD.osmNode({id: 'c', loc: [2, 2]});
            var d = iD.osmNode({id: 'd', loc: [0, 2]});
            var nodes = [a, b, c, d];
            expect(iD.geoHasSelfIntersections(nodes, 'a')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'b')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'c')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'd')).to.be.false;
        });

        it('returns true if there are self intersections without a junction (open way)', function() {
            //  a     c
            //    \ / |
            //     /  |
            //    / \ |
            //  d     b
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [2, 2]});
            var c = iD.osmNode({id: 'c', loc: [2, 0]});
            var d = iD.osmNode({id: 'd', loc: [0, 2]});
            var nodes = [a, b, c, d];
            expect(iD.geoHasSelfIntersections(nodes, 'a')).to.be.true;
            expect(iD.geoHasSelfIntersections(nodes, 'b')).to.be.true;
            expect(iD.geoHasSelfIntersections(nodes, 'c')).to.be.true;
            expect(iD.geoHasSelfIntersections(nodes, 'd')).to.be.true;
        });

        it('returns false if there are self intersections with a junction (open way)', function() {
            //  a     c
            //    \ / |
            //     x  |
            //    / \ |
            //  d     b
            var a = iD.osmNode({id: 'a', loc: [0, 0]});
            var b = iD.osmNode({id: 'b', loc: [2, 2]});
            var c = iD.osmNode({id: 'c', loc: [2, 0]});
            var d = iD.osmNode({id: 'd', loc: [0, 2]});
            var x = iD.osmNode({id: 'x', loc: [1, 1]});
            var nodes = [a, x, b, c, x, d];
            expect(iD.geoHasSelfIntersections(nodes, 'a')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'b')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'c')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'd')).to.be.false;
            expect(iD.geoHasSelfIntersections(nodes, 'x')).to.be.false;
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

        it('returns false when inner polygon fully contains outer', function() {
            var inner = [[0, 0], [0, 3], [3, 3], [3, 0], [0, 0]];
            var outer = [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]];
            expect(iD.geoPolygonIntersectsPolygon(outer, inner)).to.be.false;
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

    describe('geoGetSmallestSurroundingRectangle', function() {
        it('calculates a smallest surrounding rectangle', function() {
            //  +----b---------d
            //  |              |
            //  a---------c----+
            var points = [[0, -1], [5, 1], [10, -1], [15, 1]];
            var ssr = iD.geoGetSmallestSurroundingRectangle(points);
            expect(ssr.poly).to.eql([[0, -1], [0, 1], [15, 1], [15, -1], [0, -1]]);
            expect(ssr.angle).to.eql(0);
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
