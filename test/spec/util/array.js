describe('iD.utilArrayDifference', function() {
    it('returns set difference', function() {
        var a = [1, 2, 3];
        var b = [4, 3, 2];
        expect(iD.utilArrayDifference([], [])).to.eql([]);
        expect(iD.utilArrayDifference([], a)).to.eql([]);
        expect(iD.utilArrayDifference(a, [])).to.have.members([1, 2, 3]);
        expect(iD.utilArrayDifference(a, b)).to.have.members([1]);
        expect(iD.utilArrayDifference(b, a)).to.have.members([4]);
    });
});

describe('iD.utilArrayIntersection', function() {
    it('returns set intersection', function() {
        var a = [1, 2, 3];
        var b = [4, 3, 2];
        expect(iD.utilArrayIntersection([], [])).to.eql([]);
        expect(iD.utilArrayIntersection([], a)).to.eql([]);
        expect(iD.utilArrayIntersection(a, [])).to.eql([]);
        expect(iD.utilArrayIntersection(a, b)).to.have.members([2, 3]);
        expect(iD.utilArrayIntersection(b, a)).to.have.members([2, 3]);
    });
});

describe('iD.utilArrayUnion', function() {
    it('returns set union', function() {
        var a = [1, 2, 3];
        var b = [4, 3, 2];
        expect(iD.utilArrayUnion([], [])).to.eql([]);
        expect(iD.utilArrayUnion([], a)).to.have.members([1, 2, 3]);
        expect(iD.utilArrayUnion(a, [])).to.have.members([1, 2, 3]);
        expect(iD.utilArrayUnion(a, b)).to.have.members([1, 2, 3, 4]);
        expect(iD.utilArrayUnion(b, a)).to.have.members([1, 2, 3, 4]);
    });
});

describe('iD.utilArrayUniq', function() {
    it('returns unique values', function() {
        var a = [1, 1, 2, 3, 3];
        expect(iD.utilArrayUniq([])).to.eql([]);
        expect(iD.utilArrayUniq(a)).to.have.members([1, 2, 3]);
    });
});
