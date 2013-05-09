describe("iD.geo.Extent", function () {
    describe("constructor", function () {
        it("defaults to infinitely empty extent", function () {
            expect(iD.geo.Extent()).to.eql([[Infinity, Infinity], [-Infinity, -Infinity]]);
        });

        it("constructs via a point", function () {
            var p = [0, 0];
            expect(iD.geo.Extent(p)).to.eql([p, p]);
        });

        it("constructs via two points", function () {
            var min = [0, 0],
                max = [5, 10];
            expect(iD.geo.Extent(min, max)).to.eql([min, max]);
        });

        it("constructs via an extent", function () {
            var min = [0, 0],
                max = [5, 10];
            expect(iD.geo.Extent([min, max])).to.eql([min, max]);
        });

        it("constructs via an iD.geo.Extent", function () {
            var min = [0, 0],
                max = [5, 10],
                extent = iD.geo.Extent(min, max);
            expect(iD.geo.Extent(extent)).to.equal(extent);
        });

        it("has length 2", function () {
            expect(iD.geo.Extent().length).to.equal(2);
        });

        it("has min element", function () {
            var min = [0, 0],
                max = [5, 10];
            expect(iD.geo.Extent(min, max)[0]).to.equal(min);
        });

        it("has max element", function () {
            var min = [0, 0],
                max = [5, 10];
            expect(iD.geo.Extent(min, max)[1]).to.equal(max);
        });
    });

    describe("#center", function () {
        it("returns the center point", function () {
           expect(iD.geo.Extent([0, 0], [5, 10]).center()).to.eql([2.5, 5]);
        });
    });

    describe("#padByMeters", function () {
        it("does not change centerpoint of an extent", function () {
           var min = [0, 0], max = [5, 10];
           expect(iD.geo.Extent(min, max).padByMeters(100).center()).to.eql([2.5, 5]);
        });

        it("does not affect the extent with a pad of zero", function () {
           var min = [0, 0], max = [5, 10];
           expect(iD.geo.Extent(min, max).padByMeters(0)[0]).to.eql([0, 0]);
        });
    });

    describe("#extend", function () {
        it("does not modify self", function () {
            var extent = iD.geo.Extent([0, 0], [0, 0]);
            extent.extend([1, 1]);
            expect(extent).to.eql([[0, 0], [0, 0]]);
        });

        it("returns the minimal extent containing self and the given point", function () {
            expect(iD.geo.Extent().extend([0, 0])).to.eql([[0, 0], [0, 0]]);
            expect(iD.geo.Extent([0, 0], [0, 0]).extend([5, 10])).to.eql([[0, 0], [5, 10]]);
        });

        it("returns the minimal extent containing self and the given extent", function () {
            expect(iD.geo.Extent().extend([[0, 0], [5, 10]])).to.eql([[0, 0], [5, 10]]);
            expect(iD.geo.Extent([0, 0], [0, 0]).extend([[4, -1], [5, 10]])).to.eql([[0, -1], [5, 10]]);
        });
    });

    describe('#intersects', function () {
        it("returns true for a point inside self", function () {
            expect(iD.geo.Extent([0, 0], [5, 5]).intersects([2, 2])).to.be.true;
        });

        it("returns true for a point on the boundary of self", function () {
            expect(iD.geo.Extent([0, 0], [5, 5]).intersects([0, 0])).to.be.true;
        });

        it("returns false for a point outside self", function () {
            expect(iD.geo.Extent([0, 0], [5, 5]).intersects([6, 6])).to.be.false;
        });

        it("returns true for an extent contained by self", function () {
            expect(iD.geo.Extent([0, 0], [5, 5]).intersects([[1, 1], [2, 2]])).to.be.true;
            expect(iD.geo.Extent([1, 1], [2, 2]).intersects([[0, 0], [5, 5]])).to.be.true;
        });

        it("returns true for an extent intersected by self", function () {
            expect(iD.geo.Extent([0, 0], [5, 5]).intersects([[1, 1], [6, 6]])).to.be.true;
            expect(iD.geo.Extent([1, 1], [6, 6]).intersects([[0, 0], [5, 5]])).to.be.true;
        });

        it("returns false for an extent not intersected by self", function () {
            expect(iD.geo.Extent([0, 0], [5, 5]).intersects([[6, 6], [7, 7]])).to.be.false;
            expect(iD.geo.Extent([[6, 6], [7, 7]]).intersects([[0, 0], [5, 5]])).to.be.false;
        });
    });
});
