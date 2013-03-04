describe('d3.clip.cohenSutherland', function() {
    var clip;

    beforeEach(function() {
        clip = d3.clip.cohenSutherland()
            .bounds([0, 0, 10, 10]);
    });

    it('clips an empty array', function() {
        expect(clip([])).to.eql([]);
    });

    it('clips a point inside bounds', function() {
        expect(clip([[0, 0]])).to.eql([[[0, 0]]]);
    });

    it('clips a point outside bounds', function() {
        expect(clip([[-1, -1]])).to.eql([]);
    });

    it('clips a single segment inside bounds', function() {
        expect(clip([[0, 0], [10, 10]])).to.eql([[[0, 0], [10, 10]]]);
    });

    it('clips a single segment leaving bounds', function() {
        expect(clip([[5, 5], [15, 15]])).to.eql([[[5, 5], [10, 10]]]);
    });

    it('clips a single segment entering bounds', function() {
        expect(clip([[15, 15], [5, 5]])).to.eql([[[10, 10], [5, 5]]]);
    });

    it('clips a single segment entering and leaving bounds', function() {
        expect(clip([[0, 15], [15, 0]])).to.eql([[[5, 10], [10, 5]]]);
    });

    it('clips multiple segments', function() {
        expect(clip([[15, 15], [5, 5], [15, 15], [5, 5]])).to.
            eql([[[10, 10], [5, 5], [10, 10]], [[10, 10], [5, 5]]]);
    });
});
