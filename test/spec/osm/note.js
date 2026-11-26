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

    describe('#update', function() {
        it('returns an updated note', function() {

        });
    });

    describe('#isNew', function() {
        it('returns true if a note is new', function() {
            var note = iD.osmNote({
                id: -1,
                loc: [5, 10]
            });
            expect(note.isNew()).to.be.true;
        });
        it('returns false if a note is not new', function() {
            var note = iD.osmNote({
                id: 1,
                loc: [5, 10]
            });
            expect(note.isNew()).to.be.false;
        });
    });

    describe('#move', function() {
        it('returns an moved note', function() {
            var note = iD.osmNote({
                id: 1,
                loc: [5, 5]
            });
            note = note.move([10, 10]);
            expect(note.loc).to.eql([10, 10]);
        });
    });

});