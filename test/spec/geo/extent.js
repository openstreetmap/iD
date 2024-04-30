describe('iD.geoExtent', function () {
    describe('constructor', function () {
        it('defaults to infinitely empty extent', function () {
            expect(iD.geoExtent().equals([[Infinity, Infinity], [-Infinity, -Infinity]])).to.be.ok;
        });

        it('constructs via a point', function () {
            var p = [0, 0];
            expect(iD.geoExtent(p).equals([p, p])).to.be.ok;
        });

        it('constructs via two points', function () {
            var min = [0, 0],
                max = [5, 10];
            expect(iD.geoExtent(min, max).equals([min, max])).to.be.ok;
        });

        it('constructs via an extent', function () {
            var min = [0, 0],
                max = [5, 10];
            expect(iD.geoExtent([min, max]).equals([min, max])).to.be.ok;
        });

        it('constructs via an iD.geoExtent', function () {
            var min = [0, 0],
                max = [5, 10],
                extent = iD.geoExtent(min, max);
            expect(iD.geoExtent(extent).equals(extent)).to.be.ok;
        });

        it('has length 2', function () {
            expect(iD.geoExtent().length).to.equal(2);
        });

        it('has min element', function () {
            var min = [0, 0],
                max = [5, 10];
            expect(iD.geoExtent(min, max)[0]).to.equal(min);
        });

        it('has max element', function () {
            var min = [0, 0],
                max = [5, 10];
            expect(iD.geoExtent(min, max)[1]).to.equal(max);
        });
    });

    describe('#equals', function () {
        it('tests extent equality', function () {
            var e1 = iD.geoExtent([0, 0], [10, 10]),
                e2 = iD.geoExtent([0, 0], [10, 10]),
                e3 = iD.geoExtent([0, 0], [12, 12]);
            expect(e1.equals(e2)).to.be.ok;
            expect(e1.equals(e3)).to.be.not.ok;
        });
    });

    describe('#center', function () {
        it('returns the center point', function () {
            expect(iD.geoExtent([0, 0], [5, 10]).center()).to.eql([2.5, 5]);
        });
    });

    describe('#rectangle', function () {
        it('returns the extent as a rectangle', function () {
            expect(iD.geoExtent([0, 0], [5, 10]).rectangle()).to.eql([0, 0, 5, 10]);
        });
    });

    describe('#polygon', function () {
        it('returns the extent as a polygon', function () {
            expect(iD.geoExtent([0, 0], [5, 10]).polygon())
                .to.eql([[0, 0], [0, 10], [5, 10], [5, 0], [0, 0]]);
        });
    });

    describe('#area', function () {
        it('returns the area', function () {
           expect(iD.geoExtent([0, 0], [5, 10]).area()).to.eql(50);
        });
    });

    describe('#padByMeters', function () {
        it('does not change centerpoint of an extent', function () {
           var min = [0, 0], max = [5, 10];
           expect(iD.geoExtent(min, max).padByMeters(100).center()).to.eql([2.5, 5]);
        });

        it('does not affect the extent with a pad of zero', function () {
           var min = [0, 0], max = [5, 10];
           expect(iD.geoExtent(min, max).padByMeters(0)[0]).to.eql([0, 0]);
        });
    });

    describe('#extend', function () {
        it('does not modify self', function () {
            var extent = iD.geoExtent([0, 0], [0, 0]);
            extent.extend([1, 1]);
            expect(extent.equals([[0, 0], [0, 0]])).to.be.ok;
        });

        it('returns the minimal extent containing self and the given point', function () {
            expect(iD.geoExtent().extend([0, 0]).equals([[0, 0], [0, 0]])).to.be.ok;
            expect(iD.geoExtent([0, 0], [0, 0]).extend([5, 10]).equals([[0, 0], [5, 10]])).to.be.ok;
        });

        it('returns the minimal extent containing self and the given extent', function () {
            expect(iD.geoExtent().extend([[0, 0], [5, 10]]).equals([[0, 0], [5, 10]])).to.be.ok;
            expect(iD.geoExtent([0, 0], [0, 0]).extend([[4, -1], [5, 10]]).equals([[0, -1], [5, 10]])).to.be.ok;
        });
    });

    describe('#_extend', function () {
        it('extends self to the minimal extent containing self and the given extent', function () {
            var e = iD.geoExtent();
            e._extend([[0, 0], [5, 10]]);
            expect(e.equals([[0, 0], [5, 10]])).to.be.ok;

            e = iD.geoExtent([0, 0], [0, 0]);
            e._extend([[4, -1], [5, 10]]);
            expect(e.equals([[0, -1], [5, 10]])).to.be.ok;
        });
    });

    describe('#contains', function () {
        it('returns true for a point inside self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).contains([2, 2])).to.be.true;
        });

        it('returns true for a point on the boundary of self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).contains([0, 0])).to.be.true;
        });

        it('returns false for a point outside self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).contains([6, 6])).to.be.false;
        });

        it('returns true for an extent contained by self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).contains([[1, 1], [2, 2]])).to.be.true;
            expect(iD.geoExtent([1, 1], [2, 2]).contains([[0, 0], [5, 5]])).to.be.false;
        });

        it('returns false for an extent partially contained by self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).contains([[1, 1], [6, 6]])).to.be.false;
            expect(iD.geoExtent([1, 1], [6, 6]).contains([[0, 0], [5, 5]])).to.be.false;
        });

        it('returns false for an extent not intersected by self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).contains([[6, 6], [7, 7]])).to.be.false;
            expect(iD.geoExtent([[6, 6], [7, 7]]).contains([[0, 0], [5, 5]])).to.be.false;
        });
    });

    describe('#intersects', function () {
        it('returns true for a point inside self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).intersects([2, 2])).to.be.true;
        });

        it('returns true for a point on the boundary of self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).intersects([0, 0])).to.be.true;
        });

        it('returns false for a point outside self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).intersects([6, 6])).to.be.false;
        });

        it('returns true for an extent contained by self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).intersects([[1, 1], [2, 2]])).to.be.true;
            expect(iD.geoExtent([1, 1], [2, 2]).intersects([[0, 0], [5, 5]])).to.be.true;
        });

        it('returns true for an extent partially contained by self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).intersects([[1, 1], [6, 6]])).to.be.true;
            expect(iD.geoExtent([1, 1], [6, 6]).intersects([[0, 0], [5, 5]])).to.be.true;
        });

        it('returns false for an extent not intersected by self', function () {
            expect(iD.geoExtent([0, 0], [5, 5]).intersects([[6, 6], [7, 7]])).to.be.false;
            expect(iD.geoExtent([[6, 6], [7, 7]]).intersects([[0, 0], [5, 5]])).to.be.false;
        });
    });

    describe('#intersection', function () {
        it('returns an empty extent if self does not intersect with other', function () {
            var a = iD.geoExtent([0, 0], [5, 5]),
                b = iD.geoExtent([6, 6], [7, 7]);
            expect(a.intersection(b)).to.eql(iD.geoExtent());
        });

        it('returns the intersection of self with other (1)', function () {
            var a = iD.geoExtent([0, 0], [5, 5]),
                b = iD.geoExtent([3, 4], [7, 7]);
            expect(a.intersection(b)).to.eql(iD.geoExtent([3, 4], [5, 5]));
            expect(b.intersection(a)).to.eql(iD.geoExtent([3, 4], [5, 5]));
        });

        it('returns the intersection of self with other (2)', function () {
            var a = iD.geoExtent([0, 0], [5, 5]),
                b = iD.geoExtent([3, -4], [7, 2]);
            expect(a.intersection(b)).to.eql(iD.geoExtent([3, 0], [5, 2]));
            expect(b.intersection(a)).to.eql(iD.geoExtent([3, 0], [5, 2]));
        });

        it('returns the intersection of self with other (3)', function () {
            var a = iD.geoExtent([0, 0], [5, 5]),
                b = iD.geoExtent([3, 3], [4, 7]);
            expect(a.intersection(b)).to.eql(iD.geoExtent([3, 3], [4, 5]));
            expect(b.intersection(a)).to.eql(iD.geoExtent([3, 3], [4, 5]));
        });

        it('returns the intersection of self with other (4)', function () {
            var a = iD.geoExtent([0, 0], [5, 5]),
                b = iD.geoExtent([3, -2], [4, 2]);
            expect(a.intersection(b)).to.eql(iD.geoExtent([3, 0], [4, 2]));
            expect(b.intersection(a)).to.eql(iD.geoExtent([3, 0], [4, 2]));
        });

        it('returns the intersection of self with other (5)', function () {
            var a = iD.geoExtent([0, 0], [5, 5]),
                b = iD.geoExtent([1, 1], [2, 2]);
            expect(a.intersection(b)).to.eql(iD.geoExtent([1, 1], [2, 2]));
            expect(b.intersection(a)).to.eql(iD.geoExtent([1, 1], [2, 2]));
        });
    });

    describe('#percentContainedIn', function () {
        it('returns a 0 if self does not intersect other', function () {
            var a = iD.geoExtent([0, 0], [1, 1]),
                b = iD.geoExtent([0, 3], [4, 1]);
            expect(a.percentContainedIn(b)).to.eql(0);
            expect(b.percentContainedIn(a)).to.eql(0);
        });

        it('returns the percent contained of self with other (1)', function () {
            var a = iD.geoExtent([0, 0], [2, 1]),
                b = iD.geoExtent([1, 0], [3, 1]);
            expect(a.percentContainedIn(b)).to.eql(0.5);
            expect(b.percentContainedIn(a)).to.eql(0.5);
        });

        it('returns the percent contained of self with other (2)', function () {
            var a = iD.geoExtent([0, 0], [4, 1]),
                b = iD.geoExtent([3, 0], [4, 2]);
            expect(a.percentContainedIn(b)).to.eql(0.25);
            expect(b.percentContainedIn(a)).to.eql(0.5);
        });

    });

    describe('#split', function () {
        it('splits into four parts', function () {
            var splits = iD.geoExtent([0, 10], [5, 20]).split();
            expect(splits).to.have.length(4);
            expect(splits[0].equals([[0, 10], [2.5, 15]])).to.be.ok;
            expect(splits[1].equals([[2.5, 10], [5, 15]])).to.be.ok;
            expect(splits[2].equals([[2.5, 15], [5, 20]])).to.be.ok;
            expect(splits[3].equals([[0, 15], [2.5, 20]])).to.be.ok;
        });
    });

});
