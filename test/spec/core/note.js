describe('iD.Note', function () {
    var aNote = {
        geometry: {
            type: 'Point',
            coordinates: [0,0]
        },
        properties: 'Hello, world'
    };

    it("returns a note", function () {
        var note = new iD.Note(aNote);
        expect(note).to.be.an.instanceOf(iD.Note);
        expect(note.type).to.eql('note');
        expect(note.geometry()).to.eql('note');
        expect(note.loc).to.eql([0,0]);
    });
});
