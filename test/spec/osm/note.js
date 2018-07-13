describe('iD.osmNote', function () {
    it('returns a note', function () {
        expect(iD.osmNote()).to.be.an.instanceOf(iD.osmNote);
        expect(iD.osmNote().type).to.equal('note');
    });

    describe('#extent', function() {
        it('returns a note extent', function() {
            expect(iD.osmNote({loc: [5, 10]}).extent().equals([[5, 10], [5, 10]])).to.be.ok;
        });
    });

    // TODO: add tests for #update, or remove function

});