describe('iD.geo', function() {
    describe('.roundCoords', function() {
        expect(iD.geo.roundCoords([0.1, 1])).to.eql([0, 1]);
        expect(iD.geo.roundCoords([0, 1])).to.eql([0, 1]);
        expect(iD.geo.roundCoords([0, 1.1])).to.eql([0, 1]);
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

    describe('.dist', function() {
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

    describe('.pathLength', function() {
        it('calculates a simple path length', function() {
            var path = [[0, 0], [0, 1], [3, 5]];
            expect(iD.geo.pathLength(path)).to.eql(6);
        });
    });
});
