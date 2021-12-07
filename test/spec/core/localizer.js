describe('iD.coreLocalizer', function() {
    describe('#localized-text', function() {
        it('appends localized text to the DOM', function() {
            var selection = d3.select(document.createElement('div'));
            selection.call(iD.localizer.t.append('icons.download' /* <- just any random string */));
            expect(selection.selectChild().classed('localized-text')).to.be.true;
        });
    });
});
