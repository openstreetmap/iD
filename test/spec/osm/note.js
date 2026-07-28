describe('iD.osmNote', function () {
    it('returns a note', function () {
        expect(iD.osmNote()).toBeInstanceOf(iD.osmNote);
        expect(iD.osmNote().type).toEqual('note');
    });

    describe('#extent', function() {
        it('returns a note extent', function() {
            expect(iD.osmNote({loc: [5, 10]}).extent().equals([[5, 10], [5, 10]])).toBeTruthy();
        });
    });

    describe('#update', function() {
        it.todo('returns an updated note');
    });

    describe('#isNew', function() {
        it('returns true if a note is new', function() {
            var note = iD.osmNote({
                id: -1,
                loc: [5, 10]
            });
            expect(note.isNew()).toBe(true);
        });
        it('returns false if a note is not new', function() {
            var note = iD.osmNote({
                id: 1,
                loc: [5, 10]
            });
            expect(note.isNew()).toBe(false);
        });
    });

    describe('#move', function() {
        it('returns an moved note', function() {
            var note = iD.osmNote({
                id: 1,
                loc: [5, 5]
            });
            note = note.move([10, 10]);
            expect(note.loc).toEqual([10, 10]);
        });
    });

});
